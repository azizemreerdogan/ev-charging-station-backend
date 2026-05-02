import { Prisma } from "@prisma/client";
export declare function startSession(userId: string, reservationId: string): Promise<{
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
export declare function getSessionLive(userId: string, sessionId: string): Promise<{
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
} | {
    id: string;
    status: import("@prisma/client").$Enums.SessionStatus;
    startTime: Date;
    endTime: Date | null;
    durationMinutes: number;
    energyKwh: number;
    runningCost: number;
    breakdown: import("../billing/billing.service.js").CostBreakdown;
}>;
export declare function stopSession(userId: string, sessionId: string, opts?: {
    emergency?: boolean;
    simulate?: "insufficient_funds";
}): Promise<{
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
export declare function emergencyStopByOperator(actorUserId: string, sessionId: string): Promise<{
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
export declare function listHistory(userId: string, filters?: {
    vehicleId?: string;
    stationId?: string;
    from?: Date;
    to?: Date;
    page?: number;
    pageSize?: number;
}): Promise<{
    items: ({
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
                operatorId: string;
                latitude: number;
                longitude: number;
                address: string;
                operatingHours: string;
                amenities: string[];
                rating: number | null;
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
    })[];
    total: number;
    page: number;
    pageSize: number;
}>;
//# sourceMappingURL=sessions.service.d.ts.map