import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { env } from "../config/env.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";
export const authPlugin = fp(async (app) => {
    await app.register(jwt, {
        secret: env.JWT_SECRET,
        sign: { expiresIn: env.JWT_EXPIRES_IN },
    });
    app.decorate("authenticate", async (req, _reply) => {
        try {
            await req.jwtVerify();
            req.currentUser = req.user;
        }
        catch {
            throw new UnauthorizedError("Invalid or missing token");
        }
    });
    app.decorate("requireRole", (...roles) => {
        return async (req, _reply) => {
            await app.authenticate(req, _reply);
            if (!roles.includes(req.currentUser.role)) {
                throw new ForbiddenError(`Requires role: ${roles.join(" or ")}`);
            }
        };
    });
});
//# sourceMappingURL=auth.js.map