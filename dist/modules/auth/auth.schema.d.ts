import { z } from "zod";
export declare const userRoleEnum: z.ZodEnum<{
    VEHICLE_OWNER: "VEHICLE_OWNER";
    OPERATOR: "OPERATOR";
    ADMIN: "ADMIN";
}>;
export declare const registerBodySchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const loginBodySchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const authResponseSchema: z.ZodObject<{
    token: z.ZodString;
    user: z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodString;
        role: z.ZodEnum<{
            VEHICLE_OWNER: "VEHICLE_OWNER";
            OPERATOR: "OPERATOR";
            ADMIN: "ADMIN";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
//# sourceMappingURL=auth.schema.d.ts.map