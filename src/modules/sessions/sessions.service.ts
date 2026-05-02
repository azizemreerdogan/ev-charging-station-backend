import { Prisma } from "@prisma/client";
import { prisma } from "../../db/client.js";
import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../utils/errors.js";
import {
    calculateCost,
    generateInvoiceNumber,
} from "../billing/billing.service.js";
import { processMockPayment } from "../payments/payments.service.js";

const MAX_SESSION_HOURS = 8;
const ENERGY_EFFICIENCY = 0.9;

/**
 * Phase 1 fake meter — real OCPP integration is deferred. Energy delivered is
 * estimated from elapsed time × connector power × efficiency factor.
 */
function estimateEnergyKwh(startTime: Date, endTime: Date, powerKw: number) {
    const hours = (endTime.getTime() - startTime.getTime()) / 3_600_000;
    return Math.max(0, hours * powerKw * ENERGY_EFFICIENCY);
}

export async function startSession(userId: string, reservationId: string) {
    return prisma.$transaction(async (tx) => {
        const reservation = await tx.reservation.findUnique({
            where: { id: reservationId },
            include: { connector: true },
        });
        if (!reservation) throw new NotFoundError("Reservation");
        if (reservation.userId !== userId) throw new ForbiddenError();
        if (reservation.status !== "CONFIRMED") {
            throw new ConflictError(
                `Cannot start session for reservation in status ${reservation.status}`,
            );
        }

        const existing = await tx.chargingSession.findUnique({
            where: { reservationId },
        });
        if (existing) {
            throw new ConflictError("Session already exists for reservation");
        }

        const session = await tx.chargingSession.create({
            data: {
                reservationId,
                userId,
                vehicleId: reservation.vehicleId,
                connectorId: reservation.connectorId,
                startTime: new Date(),
            },
        });

        await tx.reservation.update({
            where: { id: reservationId },
            data: { status: "ACTIVE" },
        });
        await tx.connector.update({
            where: { id: reservation.connectorId },
            data: { status: "IN_USE" },
        });

        return session;
    });
}

export async function getSessionLive(userId: string, sessionId: string) {
    const session = await prisma.chargingSession.findUnique({
        where: { id: sessionId },
        include: { connector: true },
    });
    if (!session) throw new NotFoundError("Session");
    if (session.userId !== userId) throw new ForbiddenError();

    const now = new Date();
    const isActive = session.status === "ACTIVE";
    const referenceEnd = isActive ? now : session.endTime ?? now;
    const energyKwh = isActive
        ? estimateEnergyKwh(
              session.startTime,
              referenceEnd,
              session.connector.powerKw,
          )
        : session.energyKwh;
    const durationMinutes =
        (referenceEnd.getTime() - session.startTime.getTime()) / 60_000;

    const cost = calculateCost({
        energyKwh,
        durationMinutes,
        pricePerKwh: Number(session.connector.pricePerKwh),
        timeRatePerHour: Number(session.connector.timeRatePerHour),
    });

    // 8-hour auto-stop check (BR-73)
    if (isActive && durationMinutes / 60 >= MAX_SESSION_HOURS) {
        return finalizeSession(sessionId, "COMPLETED");
    }

    return {
        id: session.id,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        durationMinutes: Math.round(durationMinutes),
        energyKwh: round3(energyKwh),
        runningCost: cost.totalAmount,
        breakdown: cost,
    };
}

export async function stopSession(
    userId: string,
    sessionId: string,
    opts: { emergency?: boolean; simulate?: "insufficient_funds" } = {},
) {
    const session = await prisma.chargingSession.findUnique({
        where: { id: sessionId },
        include: { connector: true },
    });
    if (!session) throw new NotFoundError("Session");

    // Vehicle owner can stop their own session; operator/admin may emergency-stop any.
    const isOwner = session.userId === userId;
    if (!isOwner) throw new ForbiddenError();

    if (session.status !== "ACTIVE") {
        throw new ConflictError(
            `Session is already in status ${session.status}`,
        );
    }

    return finalizeSession(sessionId, opts.emergency ? "STOPPED" : "COMPLETED", {
        ...(opts.simulate ? { simulate: opts.simulate } : {}),
    });
}

export async function emergencyStopByOperator(
    actorUserId: string,
    sessionId: string,
) {
    const [actor, session] = await Promise.all([
        prisma.user.findUnique({ where: { id: actorUserId } }),
        prisma.chargingSession.findUnique({
            where: { id: sessionId },
            include: { connector: { include: { station: true } } },
        }),
    ]);
    if (!actor) throw new ForbiddenError();
    if (!session) throw new NotFoundError("Session");

    const isAdmin = actor.role === "ADMIN";
    const isStationOperator =
        actor.role === "OPERATOR" &&
        session.connector.station.operatorId === actor.id;
    const isOwner = session.userId === actor.id;
    if (!isAdmin && !isStationOperator && !isOwner) {
        throw new ForbiddenError(
            "Only the session owner, the station operator, or an admin may emergency-stop",
        );
    }

    if (session.status !== "ACTIVE") {
        throw new ConflictError(
            `Session is already in status ${session.status}`,
        );
    }

    return finalizeSession(sessionId, "STOPPED");
}

async function finalizeSession(
    sessionId: string,
    finalStatus: "COMPLETED" | "STOPPED",
    opts: { simulate?: "insufficient_funds" } = {},
) {
    return prisma.$transaction(async (tx) => {
        const session = await tx.chargingSession.findUnique({
            where: { id: sessionId },
            include: { connector: true },
        });
        if (!session) throw new NotFoundError("Session");
        if (session.status !== "ACTIVE") {
            throw new ConflictError(
                `Session is already in status ${session.status}`,
            );
        }

        const endTime = new Date();
        const energyKwh = estimateEnergyKwh(
            session.startTime,
            endTime,
            session.connector.powerKw,
        );
        const durationMinutes =
            (endTime.getTime() - session.startTime.getTime()) / 60_000;

        const breakdown = calculateCost({
            energyKwh,
            durationMinutes,
            pricePerKwh: Number(session.connector.pricePerKwh),
            timeRatePerHour: Number(session.connector.timeRatePerHour),
        });

        const updatedSession = await tx.chargingSession.update({
            where: { id: sessionId },
            data: {
                endTime,
                energyKwh: round3(energyKwh),
                costAmount: breakdown.totalAmount.toFixed(2),
                status: finalStatus,
            },
        });

        await tx.reservation.update({
            where: { id: session.reservationId },
            data: { status: "COMPLETED" },
        });
        await tx.connector.update({
            where: { id: session.connectorId },
            data: { status: "AVAILABLE" },
        });

        let invoice: Prisma.InvoiceGetPayload<Record<string, never>> | null =
            null;
        let payment: Prisma.PaymentGetPayload<Record<string, never>> | null =
            null;

        if (breakdown.totalAmount > 0) {
            invoice = await tx.invoice.create({
                data: {
                    invoiceNumber: generateInvoiceNumber(),
                    sessionId: session.id,
                    userId: session.userId,
                    energyCost: breakdown.energyCost.toFixed(2),
                    timeCost: breakdown.timeCost.toFixed(2),
                    discountAmount: breakdown.discountAmount.toFixed(2),
                    taxAmount: breakdown.taxAmount.toFixed(2),
                    totalAmount: breakdown.totalAmount.toFixed(2),
                },
            });

            const paymentResult = await processMockPayment({
                amount: breakdown.totalAmount,
                currency: "USD",
                userId: session.userId,
                ...(opts.simulate ? { simulate: opts.simulate } : {}),
            });

            payment = await tx.payment.create({
                data: {
                    sessionId: session.id,
                    userId: session.userId,
                    amount: breakdown.totalAmount.toFixed(2),
                    method: "MOCK",
                    gatewayTransactionId: paymentResult.gatewayTransactionId,
                    status: paymentResult.success ? "COMPLETED" : "FAILED",
                },
            });

            await tx.chargingSession.update({
                where: { id: session.id },
                data: {
                    paymentStatus: paymentResult.success ? "COMPLETED" : "FAILED",
                },
            });

            if (!paymentResult.success) {
                await tx.user.update({
                    where: { id: session.userId },
                    data: { status: "ARREARS" },
                });
            }
        } else {
            await tx.chargingSession.update({
                where: { id: session.id },
                data: { paymentStatus: "COMPLETED" },
            });
        }

        return {
            session: updatedSession,
            breakdown,
            invoice,
            payment,
        };
    });
}

export async function listHistory(
    userId: string,
    filters: {
        vehicleId?: string;
        stationId?: string;
        from?: Date;
        to?: Date;
        page?: number;
        pageSize?: number;
    } = {},
) {
    const page = filters.page ?? 1;
    const pageSize = Math.min(filters.pageSize ?? 20, 100);
    const where: Prisma.ChargingSessionWhereInput = {
        userId,
        ...(filters.vehicleId ? { vehicleId: filters.vehicleId } : {}),
        ...(filters.stationId
            ? { connector: { stationId: filters.stationId } }
            : {}),
        ...(filters.from || filters.to
            ? {
                  startTime: {
                      ...(filters.from ? { gte: filters.from } : {}),
                      ...(filters.to ? { lte: filters.to } : {}),
                  },
              }
            : {}),
    };
    const [items, total] = await Promise.all([
        prisma.chargingSession.findMany({
            where,
            orderBy: { startTime: "desc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                connector: { include: { station: true } },
                vehicle: true,
                invoice: true,
                payment: true,
            },
        }),
        prisma.chargingSession.count({ where }),
    ]);
    return { items, total, page, pageSize };
}

function round3(n: number): number {
    return Math.round(n * 1000) / 1000;
}
