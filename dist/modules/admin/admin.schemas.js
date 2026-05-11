import { z } from "zod";
export const idParamSchema = z.object({ id: z.string().uuid() });
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const userListQuerySchema = paginationSchema.extend({
    q: z.string().max(120).optional(),
    role: z.enum(["VEHICLE_OWNER", "OPERATOR", "ADMIN"]).optional(),
    status: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED", "ARREARS"]).optional(),
});
export const userPatchSchema = z
    .object({
    status: z
        .enum(["ACTIVE", "SUSPENDED", "DEACTIVATED", "ARREARS"])
        .optional(),
    role: z.enum(["VEHICLE_OWNER", "OPERATOR", "ADMIN"]).optional(),
})
    .refine((v) => v.status !== undefined || v.role !== undefined, {
    message: "At least one of status or role must be provided",
});
export const stationListQuerySchema = paginationSchema.extend({
    status: z.enum(["ACTIVE", "MAINTENANCE", "OFFLINE"]).optional(),
});
export const stationCreateSchema = z.object({
    name: z.string().min(1).max(120),
    address: z.string().min(3).max(255),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    operatingHours: z.string().min(1).max(120).optional(),
    amenities: z.array(z.string().max(40)).max(20).optional(),
});
export const stationPatchSchema = z
    .object({
    name: z.string().min(1).max(120).optional(),
    address: z.string().min(3).max(255).optional(),
    operatingHours: z.string().min(1).max(120).optional(),
    amenities: z.array(z.string().max(40)).max(20).optional(),
    status: z.enum(["ACTIVE", "MAINTENANCE", "OFFLINE"]).optional(),
})
    .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided",
});
const connectorTypeEnum = z.enum([
    "TYPE_1",
    "TYPE_2",
    "CCS",
    "CHADEMO",
    "TESLA",
]);
export const connectorCreateSchema = z.object({
    connectorNumber: z.number().int().min(1).max(50),
    type: connectorTypeEnum,
    powerKw: z.number().min(1).max(500),
    pricePerKwh: z.number().min(0).max(10),
    timeRatePerHour: z.number().min(0).max(50).optional(),
});
export const connectorPatchSchema = z
    .object({
    powerKw: z.number().min(1).max(500).optional(),
    pricePerKwh: z.number().min(0).max(10).optional(),
    timeRatePerHour: z.number().min(0).max(50).optional(),
    status: z
        .enum(["AVAILABLE", "MAINTENANCE", "OFFLINE"])
        .optional(),
})
    .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided",
});
export const sessionListQuerySchema = paginationSchema.extend({
    stationId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    status: z.enum(["ACTIVE", "COMPLETED", "STOPPED", "ERROR"]).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
});
export const analyticsRangeQuerySchema = z.object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
});
//# sourceMappingURL=admin.schemas.js.map