import { Prisma } from "@prisma/client";
export interface CreateReservationInput {
    userId: string;
    vehicleId: string;
    connectorId: string;
    startTime: Date;
    endTime: Date;
}
export declare function createReservation(input: CreateReservationInput): Promise<{
    id: string;
    status: import("@prisma/client").$Enums.ReservationStatus;
    createdAt: Date;
    userId: string;
    vehicleId: string;
    connectorId: string;
    startTime: Date;
    endTime: Date;
    estimatedCost: Prisma.Decimal | null;
    cancelledAt: Date | null;
}>;
export declare function cancelReservation(userId: string, reservationId: string): Promise<{
    id: string;
    status: import("@prisma/client").$Enums.ReservationStatus;
    createdAt: Date;
    userId: string;
    vehicleId: string;
    connectorId: string;
    startTime: Date;
    endTime: Date;
    estimatedCost: Prisma.Decimal | null;
    cancelledAt: Date | null;
}>;
export declare function listUserReservations(userId: string): Prisma.PrismaPromise<({
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
} & {
    id: string;
    status: import("@prisma/client").$Enums.ReservationStatus;
    createdAt: Date;
    userId: string;
    vehicleId: string;
    connectorId: string;
    startTime: Date;
    endTime: Date;
    estimatedCost: Prisma.Decimal | null;
    cancelledAt: Date | null;
})[]>;
//# sourceMappingURL=reservations.service.d.ts.map