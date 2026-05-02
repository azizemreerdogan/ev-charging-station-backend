import type { LoginBody, RegisterBody } from "./auth.schema.js";
export declare function registerUser(input: RegisterBody): Promise<{
    role: import("@prisma/client").$Enums.UserRole;
    email: string;
    name: string;
    phone: string | null;
    id: string;
    passwordHash: string;
    status: import("@prisma/client").$Enums.AccountStatus;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}>;
export declare function authenticateUser(input: LoginBody): Promise<{
    role: import("@prisma/client").$Enums.UserRole;
    email: string;
    name: string;
    phone: string | null;
    id: string;
    passwordHash: string;
    status: import("@prisma/client").$Enums.AccountStatus;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}>;
//# sourceMappingURL=auth.service.d.ts.map