import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { env } from "../config/env.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

export interface AuthUser {
    sub: string;
    email: string;
    role: "VEHICLE_OWNER" | "OPERATOR" | "ADMIN";
}

declare module "fastify" {
    interface FastifyInstance {
        authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
        requireRole: (
            ...roles: AuthUser["role"][]
        ) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
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

export const authPlugin = fp(async (app: FastifyInstance) => {
    await app.register(jwt, {
        secret: env.JWT_SECRET,
        sign: { expiresIn: env.JWT_EXPIRES_IN },
    });

    app.decorate(
        "authenticate",
        async (req: FastifyRequest, _reply: FastifyReply) => {
            try {
                await req.jwtVerify();
                req.currentUser = req.user;
            } catch {
                throw new UnauthorizedError("Invalid or missing token");
            }
        },
    );

    app.decorate("requireRole", (...roles: AuthUser["role"][]) => {
        return async (req: FastifyRequest, _reply: FastifyReply) => {
            await app.authenticate(req, _reply);
            if (!roles.includes(req.currentUser.role)) {
                throw new ForbiddenError(
                    `Requires role: ${roles.join(" or ")}`,
                );
            }
        };
    });
});
