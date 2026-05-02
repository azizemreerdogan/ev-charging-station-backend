import { Prisma } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError, } from "../../utils/errors.js";
const MAX_DURATION_MINUTES = 120;
const MAX_LEAD_HOURS = 24;
const MIN_DURATION_MINUTES = 15;
const MAX_ACTIVE_PER_USER = 3;
const CANCEL_DEADLINE_MINUTES = 15;
export async function createReservation(input) {
    const { userId, vehicleId, connectorId, startTime, endTime } = input;
    const now = new Date();
    if (startTime <= now) {
        throw new ValidationError("Start time must be in the future");
    }
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMin = durationMs / 60_000;
    if (durationMin < MIN_DURATION_MINUTES) {
        throw new ValidationError(`Reservation must be at least ${MIN_DURATION_MINUTES} minutes`);
    }
    if (durationMin > MAX_DURATION_MINUTES) {
        throw new ValidationError(`Reservation cannot exceed ${MAX_DURATION_MINUTES} minutes`);
    }
    const leadHours = (startTime.getTime() - now.getTime()) / (60 * 60 * 1000);
    if (leadHours > MAX_LEAD_HOURS) {
        throw new ValidationError(`Reservations must start within ${MAX_LEAD_HOURS} hours`);
    }
    const [vehicle, connector] = await Promise.all([
        prisma.vehicle.findUnique({ where: { id: vehicleId } }),
        prisma.connector.findUnique({
            where: { id: connectorId },
            include: { station: true },
        }),
    ]);
    if (!vehicle || vehicle.deletedAt)
        throw new NotFoundError("Vehicle");
    if (vehicle.userId !== userId)
        throw new ForbiddenError();
    if (!connector)
        throw new NotFoundError("Connector");
    if (connector.station.status !== "ACTIVE") {
        throw new ConflictError("Station is not active");
    }
    if (connector.status === "MAINTENANCE" ||
        connector.status === "OFFLINE") {
        throw new ConflictError(`Connector is ${connector.status}`);
    }
    if (!vehicle.connectorTypes.includes(connector.type)) {
        throw new ValidationError(`Vehicle does not support connector type ${connector.type}`);
    }
    const activeCount = await prisma.reservation.count({
        where: {
            userId,
            status: { in: ["CONFIRMED", "ACTIVE"] },
        },
    });
    if (activeCount >= MAX_ACTIVE_PER_USER) {
        throw new ConflictError(`Maximum ${MAX_ACTIVE_PER_USER} active reservations per user`);
    }
    // Estimated cost = avg power * duration * pricePerKwh
    const estimatedKwh = connector.powerKw * (durationMin / 60) * 0.9;
    const estimatedCost = estimatedKwh * Number(connector.pricePerKwh);
    return prisma.$transaction(async (tx) => {
        // Pessimistic check: any overlapping reservation for this connector
        // (CONFIRMED or ACTIVE) blocks the new one. Concurrent attempts are
        // handled by the SERIALIZABLE isolation level below.
        const overlap = await tx.reservation.findFirst({
            where: {
                connectorId,
                status: { in: ["CONFIRMED", "ACTIVE"] },
                startTime: { lt: endTime },
                endTime: { gt: startTime },
            },
        });
        if (overlap) {
            throw new ConflictError("Connector already reserved for the requested window");
        }
        const reservation = await tx.reservation.create({
            data: {
                userId,
                vehicleId,
                connectorId,
                startTime,
                endTime,
                estimatedCost: estimatedCost.toFixed(2),
            },
        });
        await tx.connector.update({
            where: { id: connectorId },
            data: { status: "RESERVED" },
        });
        return reservation;
    }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
}
export async function cancelReservation(userId, reservationId) {
    const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
    });
    if (!reservation)
        throw new NotFoundError("Reservation");
    if (reservation.userId !== userId)
        throw new ForbiddenError();
    if (reservation.status !== "CONFIRMED") {
        throw new ConflictError(`Cannot cancel reservation in status ${reservation.status}`);
    }
    const minutesUntilStart = (reservation.startTime.getTime() - Date.now()) / 60_000;
    if (minutesUntilStart < CANCEL_DEADLINE_MINUTES) {
        throw new ConflictError(`Cancellation must be at least ${CANCEL_DEADLINE_MINUTES} minutes before start`);
    }
    return prisma.$transaction(async (tx) => {
        const updated = await tx.reservation.update({
            where: { id: reservationId },
            data: { status: "CANCELLED", cancelledAt: new Date() },
        });
        await tx.connector.update({
            where: { id: reservation.connectorId },
            data: { status: "AVAILABLE" },
        });
        return updated;
    });
}
export function listUserReservations(userId) {
    return prisma.reservation.findMany({
        where: { userId },
        orderBy: { startTime: "desc" },
        include: { connector: { include: { station: true } }, vehicle: true },
    });
}
//# sourceMappingURL=reservations.service.js.map