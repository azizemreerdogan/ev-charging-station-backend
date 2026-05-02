import { z } from "zod";

export const userRoleEnum = z.enum(["VEHICLE_OWNER", "OPERATOR", "ADMIN"]);

export const registerBodySchema = z.object({
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
    name: z.string().min(2).max(100),
    phone: z.string().max(32).optional(),
    role: userRoleEnum.default("VEHICLE_OWNER"),
});

export const loginBodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const authResponseSchema = z.object({
    token: z.string(),
    user: z.object({
        id: z.string().uuid(),
        email: z.string(),
        name: z.string(),
        role: userRoleEnum,
    }),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
