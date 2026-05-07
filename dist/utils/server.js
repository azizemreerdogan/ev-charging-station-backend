import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import rateLimit from "@fastify/rate-limit";
import { serializerCompiler, validatorCompiler, jsonSchemaTransform, } from "fastify-type-provider-zod";
import { authPlugin } from "../plugins/auth.js";
import { authRoutes } from "../modules/auth/auth.routes.js";
import { userRoutes } from "../modules/users/users.routes.js";
import { vehicleRoutes } from "../modules/vehicles/vehicles.routes.js";
import { stationRoutes } from "../modules/stations/stations.routes.js";
import { reservationRoutes } from "../modules/reservations/reservations.routes.js";
import { sessionRoutes } from "../modules/sessions/sessions.routes.js";
import { adminRoutes } from "../modules/admin/admin.routes.js";
import { registerErrorHandler } from "./errors.js";
import { prisma } from "../db/client.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
const adminHtml = readFileSync(resolve(__dirname, "../modules/admin/ui/index.html"), "utf8");
export async function buildServer() {
    const app = fastify({
        logger: {
            transport: {
                target: "pino-pretty",
            },
        },
    }).withTypeProvider();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);
    registerErrorHandler(app);
    await app.register(rateLimit, {
        max: 200,
        timeWindow: "1 minute",
    });
    await app.register(swagger, {
        openapi: {
            info: {
                title: "EV Charging System API",
                description: "Phase 1 MVP — see project requirements PDF",
                version: "0.1.0",
            },
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: "http",
                        scheme: "bearer",
                        bearerFormat: "JWT",
                    },
                },
            },
            security: [{ bearerAuth: [] }],
        },
        transform: jsonSchemaTransform,
    });
    await app.register(swaggerUi, { routePrefix: "/docs" });
    await app.register(authPlugin);
    app.get("/healthz", async () => {
        await prisma.$queryRaw `SELECT 1`;
        return { status: "ok" };
    });
    await app.register(async (api) => {
        await api.register(authRoutes, { prefix: "/auth" });
        await api.register(userRoutes, { prefix: "/users" });
        await api.register(vehicleRoutes, { prefix: "/vehicles" });
        await api.register(stationRoutes, { prefix: "/stations" });
        await api.register(reservationRoutes, { prefix: "/reservations" });
        await api.register(sessionRoutes, { prefix: "/sessions" });
        await api.register(adminRoutes, { prefix: "/admin" });
    }, { prefix: "/api/v1" });
    // Server-rendered admin console for ADMIN/OPERATOR roles. The HTML is
    // self-contained and talks to /api/v1/admin/* with a JWT in localStorage.
    app.get("/admin", async (_req, reply) => {
        return reply.type("text/html; charset=utf-8").send(adminHtml);
    });
    app.addHook("onClose", async () => {
        await prisma.$disconnect();
    });
    return app;
}
//# sourceMappingURL=server.js.map