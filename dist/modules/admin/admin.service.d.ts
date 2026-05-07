import { Prisma } from "@prisma/client";
export type Actor = {
    userId: string;
    role: "VEHICLE_OWNER" | "OPERATOR" | "ADMIN";
};
export declare function listUsers(actor: Actor, filters: {
    page: number;
    pageSize: number;
    q?: string;
    role?: "VEHICLE_OWNER" | "OPERATOR" | "ADMIN";
    status?: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "ARREARS";
}): Promise<{
    items: {
        role: import("@prisma/client").$Enums.UserRole;
        email: string;
        name: string;
        phone: string | null;
        id: string;
        status: import("@prisma/client").$Enums.AccountStatus;
        createdAt: Date;
        _count: {
            vehicles: number;
            sessions: number;
        };
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getUser(actor: Actor, id: string): Promise<{
    role: import("@prisma/client").$Enums.UserRole;
    email: string;
    name: string;
    phone: string | null;
    id: string;
    status: import("@prisma/client").$Enums.AccountStatus;
    createdAt: Date;
    updatedAt: Date;
    _count: {
        vehicles: number;
        operatedStations: number;
        reservations: number;
        sessions: number;
    };
}>;
export declare function patchUser(actor: Actor, id: string, patch: {
    status?: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "ARREARS";
    role?: "VEHICLE_OWNER" | "OPERATOR" | "ADMIN";
}): Promise<{
    role: import("@prisma/client").$Enums.UserRole;
    email: string;
    name: string;
    id: string;
    status: import("@prisma/client").$Enums.AccountStatus;
}>;
export declare function listStations(actor: Actor, filters: {
    page: number;
    pageSize: number;
    status?: "ACTIVE" | "MAINTENANCE" | "OFFLINE";
}): Promise<{
    items: {
        id: string;
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        operatingHours: string;
        amenities: string[];
        rating: number | null;
        status: import("@prisma/client").$Enums.StationStatus;
        operator: {
            email: string;
            name: string;
            id: string;
        };
        totalConnectors: number;
        availableConnectors: number;
        inUseConnectors: number;
        offlineConnectors: number;
    }[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function patchStation(actor: Actor, id: string, patch: {
    name?: string;
    address?: string;
    operatingHours?: string;
    amenities?: string[];
    status?: "ACTIVE" | "MAINTENANCE" | "OFFLINE";
}): Promise<{
    name: string;
    id: string;
    status: import("@prisma/client").$Enums.StationStatus;
    createdAt: Date;
    latitude: number;
    longitude: number;
    address: string;
    operatingHours: string;
    amenities: string[];
    rating: number | null;
    operatorId: string;
}>;
export declare function listConnectorsForStation(actor: Actor, stationId: string): Promise<{
    id: string;
    stationId: string;
    connectorNumber: number;
    type: import("@prisma/client").$Enums.ConnectorType;
    powerKw: number;
    pricePerKwh: string;
    timeRatePerHour: string;
    status: import("@prisma/client").$Enums.ConnectorStatus;
}[]>;
export declare function createConnector(actor: Actor, stationId: string, body: {
    connectorNumber: number;
    type: "TYPE_1" | "TYPE_2" | "CCS" | "CHADEMO" | "TESLA";
    powerKw: number;
    pricePerKwh: number;
    timeRatePerHour?: number;
}): Promise<{
    type: import("@prisma/client").$Enums.ConnectorType;
    id: string;
    status: import("@prisma/client").$Enums.ConnectorStatus;
    createdAt: Date;
    powerKw: number;
    stationId: string;
    connectorNumber: number;
    pricePerKwh: Prisma.Decimal;
    timeRatePerHour: Prisma.Decimal;
}>;
export declare function patchConnector(actor: Actor, id: string, patch: {
    powerKw?: number;
    pricePerKwh?: number;
    timeRatePerHour?: number;
    status?: "AVAILABLE" | "MAINTENANCE" | "OFFLINE";
}): Promise<{
    type: import("@prisma/client").$Enums.ConnectorType;
    id: string;
    status: import("@prisma/client").$Enums.ConnectorStatus;
    createdAt: Date;
    powerKw: number;
    stationId: string;
    connectorNumber: number;
    pricePerKwh: Prisma.Decimal;
    timeRatePerHour: Prisma.Decimal;
}>;
export declare function deleteConnector(actor: Actor, id: string): Promise<{
    id: string;
}>;
export declare function listSessions(actor: Actor, filters: {
    page: number;
    pageSize: number;
    stationId?: string;
    userId?: string;
    status?: "ACTIVE" | "COMPLETED" | "STOPPED" | "ERROR";
    from?: Date;
    to?: Date;
}): Promise<{
    items: ({
        user: {
            email: string;
            name: string;
            id: string;
        };
        vehicle: {
            id: string;
            make: string;
            model: string;
            licensePlate: string;
        };
        connector: {
            type: import("@prisma/client").$Enums.ConnectorType;
            id: string;
            connectorNumber: number;
            station: {
                name: string;
                id: string;
            };
        };
        payment: {
            method: import("@prisma/client").$Enums.PaymentMethod;
            id: string;
            status: import("@prisma/client").$Enums.PaymentStatus;
            userId: string;
            gatewayTransactionId: string | null;
            sessionId: string;
            currency: string;
            amount: Prisma.Decimal;
            paymentDate: Date;
        } | null;
        invoice: {
            id: string;
            createdAt: Date;
            userId: string;
            invoiceNumber: string;
            sessionId: string;
            energyCost: Prisma.Decimal;
            timeCost: Prisma.Decimal;
            discountAmount: Prisma.Decimal;
            taxAmount: Prisma.Decimal;
            totalAmount: Prisma.Decimal;
            currency: string;
        } | null;
    } & {
        id: string;
        status: import("@prisma/client").$Enums.SessionStatus;
        createdAt: Date;
        userId: string;
        vehicleId: string;
        connectorId: string;
        startTime: Date;
        endTime: Date | null;
        energyKwh: number;
        costAmount: Prisma.Decimal | null;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        reservationId: string;
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
export declare function getSession(actor: Actor, id: string): Promise<{
    user: {
        email: string;
        name: string;
        id: string;
    };
    vehicle: {
        id: string;
        createdAt: Date;
        deletedAt: Date | null;
        make: string;
        model: string;
        year: number;
        licensePlate: string;
        batteryKwh: number;
        connectorTypes: import("@prisma/client").$Enums.ConnectorType[];
        nickname: string | null;
        userId: string;
    };
    connector: {
        station: {
            name: string;
            id: string;
            status: import("@prisma/client").$Enums.StationStatus;
            createdAt: Date;
            latitude: number;
            longitude: number;
            address: string;
            operatingHours: string;
            amenities: string[];
            rating: number | null;
            operatorId: string;
        };
    } & {
        type: import("@prisma/client").$Enums.ConnectorType;
        id: string;
        status: import("@prisma/client").$Enums.ConnectorStatus;
        createdAt: Date;
        powerKw: number;
        stationId: string;
        connectorNumber: number;
        pricePerKwh: Prisma.Decimal;
        timeRatePerHour: Prisma.Decimal;
    };
    payment: {
        method: import("@prisma/client").$Enums.PaymentMethod;
        id: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        userId: string;
        gatewayTransactionId: string | null;
        sessionId: string;
        currency: string;
        amount: Prisma.Decimal;
        paymentDate: Date;
    } | null;
    invoice: {
        id: string;
        createdAt: Date;
        userId: string;
        invoiceNumber: string;
        sessionId: string;
        energyCost: Prisma.Decimal;
        timeCost: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        totalAmount: Prisma.Decimal;
        currency: string;
    } | null;
} & {
    id: string;
    status: import("@prisma/client").$Enums.SessionStatus;
    createdAt: Date;
    userId: string;
    vehicleId: string;
    connectorId: string;
    startTime: Date;
    endTime: Date | null;
    energyKwh: number;
    costAmount: Prisma.Decimal | null;
    paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
    reservationId: string;
}>;
export declare function overview(actor: Actor): Promise<{
    activeSessions: number;
    todayReservations: number;
    todayRevenue: string;
    todayInvoiceCount: number;
    paymentSuccessRate7d: number | null;
    paymentsByStatus7d: {
        [k: string]: number;
    };
    totalStations: number;
    totalConnectors: number;
}>;
export declare function stationAnalytics(actor: Actor, range: {
    from?: Date;
    to?: Date;
}): Promise<{
    stations: {
        stationId: string;
        name: string;
        connectorCount: number;
        sessionCount: number;
        kwhDelivered: number;
        revenue: string;
    }[];
}>;
export declare function paymentAnalytics(actor: Actor, range: {
    from?: Date;
    to?: Date;
}): Promise<{
    byStatus: {
        status: import("@prisma/client").$Enums.PaymentStatus;
        count: number;
        amount: string;
    }[];
}>;
export declare function adminEmergencyStop(actor: Actor, sessionId: string): Promise<{
    session: {
        id: string;
        status: import("@prisma/client").$Enums.SessionStatus;
        createdAt: Date;
        userId: string;
        vehicleId: string;
        connectorId: string;
        startTime: Date;
        endTime: Date | null;
        energyKwh: number;
        costAmount: Prisma.Decimal | null;
        paymentStatus: import("@prisma/client").$Enums.PaymentStatus;
        reservationId: string;
    };
    breakdown: import("../billing/billing.service.js").CostBreakdown;
    invoice: {
        id: string;
        createdAt: Date;
        userId: string;
        invoiceNumber: string;
        sessionId: string;
        energyCost: Prisma.Decimal;
        timeCost: Prisma.Decimal;
        discountAmount: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        totalAmount: Prisma.Decimal;
        currency: string;
    } | null;
    payment: {
        method: import("@prisma/client").$Enums.PaymentMethod;
        id: string;
        status: import("@prisma/client").$Enums.PaymentStatus;
        userId: string;
        gatewayTransactionId: string | null;
        sessionId: string;
        currency: string;
        amount: Prisma.Decimal;
        paymentDate: Date;
    } | null;
}>;
//# sourceMappingURL=admin.service.d.ts.map