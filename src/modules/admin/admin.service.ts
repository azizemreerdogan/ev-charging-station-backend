import { Prisma } from "@prisma/client";
import { prisma } from "../../db/client.js";
import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../utils/errors.js";

export type Actor = {
    userId: string;
    role: "VEHICLE_OWNER" | "OPERATOR" | "ADMIN";
};

function assertAdminOrOperator(actor: Actor) {
    if (actor.role !== "ADMIN" && actor.role !== "OPERATOR") {
        throw new ForbiddenError();
    }
}

function assertAdmin(actor: Actor) {
    if (actor.role !== "ADMIN") {
        throw new ForbiddenError("Requires role: ADMIN");
    }
}

// Users — ADMIN only

export async function listUsers(
    actor: Actor,
    filters: {
        page: number;
        pageSize: number;
        q?: string;
        role?: "VEHICLE_OWNER" | "OPERATOR" | "ADMIN";
        status?: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "ARREARS";
    },
) {
    assertAdmin(actor);
    const where: Prisma.UserWhereInput = {
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.q
            ? {
                  OR: [
                      { email: { contains: filters.q, mode: "insensitive" } },
                      { name: { contains: filters.q, mode: "insensitive" } },
                  ],
              }
            : {}),
    };
    const [items, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                _count: { select: { vehicles: true, sessions: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (filters.page - 1) * filters.pageSize,
            take: filters.pageSize,
        }),
        prisma.user.count({ where }),
    ]);
    return { items, total, page: filters.page, pageSize: filters.pageSize };
}

export async function getUser(actor: Actor, id: string) {
    assertAdmin(actor);
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            _count: {
                select: {
                    vehicles: true,
                    sessions: true,
                    reservations: true,
                    operatedStations: true,
                },
            },
        },
    });
    if (!user) throw new NotFoundError("User");
    return user;
}

export async function patchUser(
    actor: Actor,
    id: string,
    patch: {
        status?: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "ARREARS";
        role?: "VEHICLE_OWNER" | "OPERATOR" | "ADMIN";
    },
) {
    assertAdmin(actor);
    if (id === actor.userId && patch.role && patch.role !== "ADMIN") {
        throw new ConflictError("Admins cannot demote themselves");
    }
    const exists = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
    });
    if (!exists) throw new NotFoundError("User");

    return prisma.user.update({
        where: { id },
        data: {
            ...(patch.status !== undefined ? { status: patch.status } : {}),
            ...(patch.role !== undefined ? { role: patch.role } : {}),
            ...(patch.status === "DEACTIVATED" ? { deletedAt: new Date() } : {}),
        },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
        },
    });
}

// Stations — ADMIN full; OPERATOR scoped to operatorId

function operatorWhere(actor: Actor): Prisma.ChargingStationWhereInput {
    return actor.role === "OPERATOR" ? { operatorId: actor.userId } : {};
}

export async function listStations(
    actor: Actor,
    filters: {
        page: number;
        pageSize: number;
        status?: "ACTIVE" | "MAINTENANCE" | "OFFLINE";
    },
) {
    assertAdminOrOperator(actor);
    const where: Prisma.ChargingStationWhereInput = {
        ...operatorWhere(actor),
        ...(filters.status ? { status: filters.status } : {}),
    };
    const [items, total] = await Promise.all([
        prisma.chargingStation.findMany({
            where,
            include: {
                operator: { select: { id: true, email: true, name: true } },
                connectors: {
                    select: { id: true, status: true },
                },
                _count: { select: { connectors: true } },
            },
            orderBy: { createdAt: "desc" },
            skip: (filters.page - 1) * filters.pageSize,
            take: filters.pageSize,
        }),
        prisma.chargingStation.count({ where }),
    ]);
    const enriched = items.map((s) => ({
        id: s.id,
        name: s.name,
        address: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        operatingHours: s.operatingHours,
        amenities: s.amenities,
        rating: s.rating,
        status: s.status,
        operator: s.operator,
        totalConnectors: s._count.connectors,
        availableConnectors: s.connectors.filter((c) => c.status === "AVAILABLE")
            .length,
        inUseConnectors: s.connectors.filter((c) => c.status === "IN_USE").length,
        offlineConnectors: s.connectors.filter(
            (c) => c.status === "OFFLINE" || c.status === "MAINTENANCE",
        ).length,
    }));
    return { items: enriched, total, page: filters.page, pageSize: filters.pageSize };
}

async function loadStationForActor(actor: Actor, stationId: string) {
    const station = await prisma.chargingStation.findUnique({
        where: { id: stationId },
    });
    if (!station) throw new NotFoundError("Station");
    if (actor.role === "OPERATOR" && station.operatorId !== actor.userId) {
        throw new ForbiddenError();
    }
    return station;
}

export async function patchStation(
    actor: Actor,
    id: string,
    patch: {
        name?: string;
        address?: string;
        operatingHours?: string;
        amenities?: string[];
        status?: "ACTIVE" | "MAINTENANCE" | "OFFLINE";
    },
) {
    assertAdminOrOperator(actor);
    await loadStationForActor(actor, id);
    return prisma.chargingStation.update({
        where: { id },
        data: {
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.address !== undefined ? { address: patch.address } : {}),
            ...(patch.operatingHours !== undefined
                ? { operatingHours: patch.operatingHours }
                : {}),
            ...(patch.amenities !== undefined
                ? { amenities: patch.amenities }
                : {}),
            ...(patch.status !== undefined ? { status: patch.status } : {}),
        },
    });
}

// Connectors

export async function listConnectorsForStation(actor: Actor, stationId: string) {
    assertAdminOrOperator(actor);
    await loadStationForActor(actor, stationId);
    const connectors = await prisma.connector.findMany({
        where: { stationId },
        orderBy: { connectorNumber: "asc" },
    });
    return connectors.map((c) => ({
        id: c.id,
        stationId: c.stationId,
        connectorNumber: c.connectorNumber,
        type: c.type,
        powerKw: c.powerKw,
        pricePerKwh: c.pricePerKwh.toString(),
        timeRatePerHour: c.timeRatePerHour.toString(),
        status: c.status,
    }));
}

export async function createConnector(
    actor: Actor,
    stationId: string,
    body: {
        connectorNumber: number;
        type: "TYPE_1" | "TYPE_2" | "CCS" | "CHADEMO" | "TESLA";
        powerKw: number;
        pricePerKwh: number;
        timeRatePerHour?: number;
    },
) {
    assertAdminOrOperator(actor);
    await loadStationForActor(actor, stationId);
    const existing = await prisma.connector.findUnique({
        where: {
            stationId_connectorNumber: {
                stationId,
                connectorNumber: body.connectorNumber,
            },
        },
    });
    if (existing) {
        throw new ConflictError(
            `Connector number ${body.connectorNumber} already exists at this station`,
        );
    }
    return prisma.connector.create({
        data: {
            stationId,
            connectorNumber: body.connectorNumber,
            type: body.type,
            powerKw: body.powerKw,
            pricePerKwh: body.pricePerKwh.toFixed(4),
            timeRatePerHour: (body.timeRatePerHour ?? 0).toFixed(4),
        },
    });
}

async function loadConnectorForActor(actor: Actor, connectorId: string) {
    const connector = await prisma.connector.findUnique({
        where: { id: connectorId },
        include: { station: true },
    });
    if (!connector) throw new NotFoundError("Connector");
    if (
        actor.role === "OPERATOR" &&
        connector.station.operatorId !== actor.userId
    ) {
        throw new ForbiddenError();
    }
    return connector;
}

export async function patchConnector(
    actor: Actor,
    id: string,
    patch: {
        powerKw?: number;
        pricePerKwh?: number;
        timeRatePerHour?: number;
        status?: "AVAILABLE" | "MAINTENANCE" | "OFFLINE";
    },
) {
    assertAdminOrOperator(actor);
    const connector = await loadConnectorForActor(actor, id);

    if (
        patch.status &&
        patch.status !== connector.status &&
        (connector.status === "IN_USE" || connector.status === "RESERVED")
    ) {
        throw new ConflictError(
            `Cannot change status while connector is ${connector.status}`,
        );
    }

    return prisma.connector.update({
        where: { id },
        data: {
            ...(patch.powerKw !== undefined ? { powerKw: patch.powerKw } : {}),
            ...(patch.pricePerKwh !== undefined
                ? { pricePerKwh: patch.pricePerKwh.toFixed(4) }
                : {}),
            ...(patch.timeRatePerHour !== undefined
                ? { timeRatePerHour: patch.timeRatePerHour.toFixed(4) }
                : {}),
            ...(patch.status !== undefined ? { status: patch.status } : {}),
        },
    });
}

export async function deleteConnector(actor: Actor, id: string) {
    assertAdminOrOperator(actor);
    const connector = await loadConnectorForActor(actor, id);
    if (connector.status === "IN_USE" || connector.status === "RESERVED") {
        throw new ConflictError(
            `Cannot delete connector in status ${connector.status}`,
        );
    }
    const activeSession = await prisma.chargingSession.findFirst({
        where: { connectorId: id, status: "ACTIVE" },
        select: { id: true },
    });
    if (activeSession) {
        throw new ConflictError("Connector has an active session");
    }
    await prisma.connector.delete({ where: { id } });
    return { id };
}

// Sessions oversight

export async function listSessions(
    actor: Actor,
    filters: {
        page: number;
        pageSize: number;
        stationId?: string;
        userId?: string;
        status?: "ACTIVE" | "COMPLETED" | "STOPPED" | "ERROR";
        from?: Date;
        to?: Date;
    },
) {
    assertAdminOrOperator(actor);
    const where: Prisma.ChargingSessionWhereInput = {
        ...(filters.userId ? { userId: filters.userId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.stationId
            ? { connector: { stationId: filters.stationId } }
            : {}),
        ...(actor.role === "OPERATOR"
            ? {
                  connector: {
                      ...(filters.stationId
                          ? { stationId: filters.stationId }
                          : {}),
                      station: { operatorId: actor.userId },
                  },
              }
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
            skip: (filters.page - 1) * filters.pageSize,
            take: filters.pageSize,
            include: {
                user: { select: { id: true, email: true, name: true } },
                vehicle: {
                    select: { id: true, make: true, model: true, licensePlate: true },
                },
                connector: {
                    select: {
                        id: true,
                        connectorNumber: true,
                        type: true,
                        station: { select: { id: true, name: true } },
                    },
                },
                invoice: true,
                payment: true,
            },
        }),
        prisma.chargingSession.count({ where }),
    ]);
    return { items, total, page: filters.page, pageSize: filters.pageSize };
}

export async function getSession(actor: Actor, id: string) {
    assertAdminOrOperator(actor);
    const session = await prisma.chargingSession.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, email: true, name: true } },
            vehicle: true,
            connector: { include: { station: true } },
            invoice: true,
            payment: true,
        },
    });
    if (!session) throw new NotFoundError("Session");
    if (
        actor.role === "OPERATOR" &&
        session.connector.station.operatorId !== actor.userId
    ) {
        throw new ForbiddenError();
    }
    return session;
}

// Analytics

export async function overview(actor: Actor) {
    assertAdminOrOperator(actor);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const sessionScope: Prisma.ChargingSessionWhereInput =
        actor.role === "OPERATOR"
            ? { connector: { station: { operatorId: actor.userId } } }
            : {};
    const stationScope: Prisma.ChargingStationWhereInput = operatorWhere(actor);
    const reservationScope: Prisma.ReservationWhereInput =
        actor.role === "OPERATOR"
            ? { connector: { station: { operatorId: actor.userId } } }
            : {};
    const invoiceScope: Prisma.InvoiceWhereInput =
        actor.role === "OPERATOR"
            ? {
                  session: {
                      connector: { station: { operatorId: actor.userId } },
                  },
              }
            : {};
    const paymentScope: Prisma.PaymentWhereInput =
        actor.role === "OPERATOR"
            ? {
                  session: {
                      connector: { station: { operatorId: actor.userId } },
                  },
              }
            : {};

    const [
        activeSessions,
        todayReservations,
        todayInvoices,
        weekPayments,
        totalStations,
        totalConnectors,
    ] = await Promise.all([
        prisma.chargingSession.count({
            where: { ...sessionScope, status: "ACTIVE" },
        }),
        prisma.reservation.count({
            where: { ...reservationScope, createdAt: { gte: startOfDay } },
        }),
        prisma.invoice.aggregate({
            where: { ...invoiceScope, createdAt: { gte: startOfDay } },
            _sum: { totalAmount: true },
            _count: true,
        }),
        prisma.payment.groupBy({
            by: ["status"],
            where: { ...paymentScope, paymentDate: { gte: sevenDaysAgo } },
            _count: true,
        }),
        prisma.chargingStation.count({ where: stationScope }),
        prisma.connector.count({
            where: actor.role === "OPERATOR"
                ? { station: { operatorId: actor.userId } }
                : {},
        }),
    ]);

    const paymentsByStatus = Object.fromEntries(
        weekPayments.map((p) => [p.status, p._count]),
    );
    const totalPay = weekPayments.reduce((acc, p) => acc + p._count, 0);
    const successPay = paymentsByStatus["COMPLETED"] ?? 0;
    const successRate = totalPay === 0 ? null : successPay / totalPay;

    return {
        activeSessions,
        todayReservations,
        todayRevenue: (todayInvoices._sum.totalAmount ?? "0").toString(),
        todayInvoiceCount: todayInvoices._count,
        paymentSuccessRate7d: successRate,
        paymentsByStatus7d: paymentsByStatus,
        totalStations,
        totalConnectors,
    };
}

export async function stationAnalytics(
    actor: Actor,
    range: { from?: Date; to?: Date },
) {
    assertAdminOrOperator(actor);
    const stationWhere: Prisma.ChargingStationWhereInput = operatorWhere(actor);
    const stations = await prisma.chargingStation.findMany({
        where: stationWhere,
        select: { id: true, name: true, _count: { select: { connectors: true } } },
    });

    const sessionWhere = (stationId: string): Prisma.ChargingSessionWhereInput => ({
        connector: { stationId },
        ...(range.from || range.to
            ? {
                  startTime: {
                      ...(range.from ? { gte: range.from } : {}),
                      ...(range.to ? { lte: range.to } : {}),
                  },
              }
            : {}),
    });

    const rows = await Promise.all(
        stations.map(async (s) => {
            const [agg, count] = await Promise.all([
                prisma.chargingSession.aggregate({
                    where: sessionWhere(s.id),
                    _sum: { energyKwh: true, costAmount: true },
                }),
                prisma.chargingSession.count({ where: sessionWhere(s.id) }),
            ]);
            return {
                stationId: s.id,
                name: s.name,
                connectorCount: s._count.connectors,
                sessionCount: count,
                kwhDelivered: agg._sum.energyKwh ?? 0,
                revenue: (agg._sum.costAmount ?? "0").toString(),
            };
        }),
    );
    return { stations: rows };
}

export async function paymentAnalytics(
    actor: Actor,
    range: { from?: Date; to?: Date },
) {
    assertAdminOrOperator(actor);
    const where: Prisma.PaymentWhereInput = {
        ...(actor.role === "OPERATOR"
            ? {
                  session: {
                      connector: { station: { operatorId: actor.userId } },
                  },
              }
            : {}),
        ...(range.from || range.to
            ? {
                  paymentDate: {
                      ...(range.from ? { gte: range.from } : {}),
                      ...(range.to ? { lte: range.to } : {}),
                  },
              }
            : {}),
    };
    const grouped = await prisma.payment.groupBy({
        by: ["status"],
        where,
        _count: true,
        _sum: { amount: true },
    });
    return {
        byStatus: grouped.map((g) => ({
            status: g.status,
            count: g._count,
            amount: (g._sum.amount ?? "0").toString(),
        })),
    };
}

// Forced emergency-stop with admin/operator scope check.
export async function adminEmergencyStop(actor: Actor, sessionId: string) {
    assertAdminOrOperator(actor);
    const session = await prisma.chargingSession.findUnique({
        where: { id: sessionId },
        include: { connector: { include: { station: true } } },
    });
    if (!session) throw new NotFoundError("Session");
    if (
        actor.role === "OPERATOR" &&
        session.connector.station.operatorId !== actor.userId
    ) {
        throw new ForbiddenError();
    }
    if (session.status !== "ACTIVE") {
        throw new ConflictError(
            `Session is already in status ${session.status}`,
        );
    }
    // Delegate to the existing emergency-stop pipeline so finalize/billing/payment
    // logic stays in one place.
    const { emergencyStopByOperator } = await import(
        "../sessions/sessions.service.js"
    );
    return emergencyStopByOperator(actor.userId, sessionId);
}
