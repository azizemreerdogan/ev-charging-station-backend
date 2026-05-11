import { z } from "zod";
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const userListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    q: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        VEHICLE_OWNER: "VEHICLE_OWNER";
        OPERATOR: "OPERATOR";
        ADMIN: "ADMIN";
    }>>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        SUSPENDED: "SUSPENDED";
        DEACTIVATED: "DEACTIVATED";
        ARREARS: "ARREARS";
    }>>;
}, z.core.$strip>;
export declare const userPatchSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        SUSPENDED: "SUSPENDED";
        DEACTIVATED: "DEACTIVATED";
        ARREARS: "ARREARS";
    }>>;
    role: z.ZodOptional<z.ZodEnum<{
        VEHICLE_OWNER: "VEHICLE_OWNER";
        OPERATOR: "OPERATOR";
        ADMIN: "ADMIN";
    }>>;
}, z.core.$strip>;
export declare const stationListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        MAINTENANCE: "MAINTENANCE";
        OFFLINE: "OFFLINE";
    }>>;
}, z.core.$strip>;
export declare const stationCreateSchema: z.ZodObject<{
    name: z.ZodString;
    address: z.ZodString;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    operatingHours: z.ZodOptional<z.ZodString>;
    amenities: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const stationPatchSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    operatingHours: z.ZodOptional<z.ZodString>;
    amenities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<{
        ACTIVE: "ACTIVE";
        MAINTENANCE: "MAINTENANCE";
        OFFLINE: "OFFLINE";
    }>>;
}, z.core.$strip>;
export declare const connectorCreateSchema: z.ZodObject<{
    connectorNumber: z.ZodNumber;
    type: z.ZodEnum<{
        TYPE_1: "TYPE_1";
        TYPE_2: "TYPE_2";
        CCS: "CCS";
        CHADEMO: "CHADEMO";
        TESLA: "TESLA";
    }>;
    powerKw: z.ZodNumber;
    pricePerKwh: z.ZodNumber;
    timeRatePerHour: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const connectorPatchSchema: z.ZodObject<{
    powerKw: z.ZodOptional<z.ZodNumber>;
    pricePerKwh: z.ZodOptional<z.ZodNumber>;
    timeRatePerHour: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<{
        MAINTENANCE: "MAINTENANCE";
        OFFLINE: "OFFLINE";
        AVAILABLE: "AVAILABLE";
    }>>;
}, z.core.$strip>;
export declare const sessionListQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    pageSize: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    stationId: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        ERROR: "ERROR";
        ACTIVE: "ACTIVE";
        COMPLETED: "COMPLETED";
        STOPPED: "STOPPED";
    }>>;
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
export declare const analyticsRangeQuerySchema: z.ZodObject<{
    from: z.ZodOptional<z.ZodCoercedDate<unknown>>;
    to: z.ZodOptional<z.ZodCoercedDate<unknown>>;
}, z.core.$strip>;
//# sourceMappingURL=admin.schemas.d.ts.map