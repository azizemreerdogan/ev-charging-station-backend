import type { FastifyInstance } from "fastify";
export interface AuthUser {
    sub: string;
    email: string;
    role: "VEHICLE_OWNER" | "OPERATOR" | "ADMIN";
}
declare module "fastify" {
    interface FastifyInstance {
        authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
        requireRole: (...roles: AuthUser["role"][]) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
    interface FastifyRequest {
        currentUser: AuthUser;
    }
}
declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: AuthUser;
        user: AuthUser;
    }
}
export declare const authPlugin: (app: FastifyInstance) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map