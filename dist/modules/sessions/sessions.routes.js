import { z } from "zod";
import { emergencyStopByOperator, getSessionLive, listHistory, startSession, stopSession, } from "./sessions.service.js";
const startBodySchema = z.object({
    reservationId: z.string().uuid(),
});
const stopBodySchema = z
    .object({
    simulate: z.literal("insufficient_funds").optional(),
})
    .optional();
const idParamSchema = z.object({ id: z.string().uuid() });
const historyQuerySchema = z.object({
    vehicleId: z.string().uuid().optional(),
    stationId: z.string().uuid().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export async function sessionRoutes(app) {
    const r = app.withTypeProvider();
    r.post("/start", {
        onRequest: [app.authenticate],
        schema: { body: startBodySchema, tags: ["sessions"] },
    }, async (req, reply) => {
        const session = await startSession(req.currentUser.sub, req.body.reservationId);
        return reply.code(201).send(session);
    });
    r.get("/history", {
        onRequest: [app.authenticate],
        schema: {
            querystring: historyQuerySchema,
            tags: ["sessions"],
        },
    }, async (req) => listHistory(req.currentUser.sub, req.query));
    r.get("/:id", {
        onRequest: [app.authenticate],
        schema: { params: idParamSchema, tags: ["sessions"] },
    }, async (req) => getSessionLive(req.currentUser.sub, req.params.id));
    r.post("/:id/stop", {
        onRequest: [app.authenticate],
        schema: {
            params: idParamSchema,
            body: stopBodySchema,
            tags: ["sessions"],
        },
    }, async (req) => {
        const opts = req.body
            ? req.body.simulate
                ? { simulate: req.body.simulate }
                : {}
            : {};
        return stopSession(req.currentUser.sub, req.params.id, opts);
    });
    r.post("/:id/emergency-stop", {
        onRequest: [app.authenticate],
        schema: { params: idParamSchema, tags: ["sessions"] },
    }, async (req) => emergencyStopByOperator(req.currentUser.sub, req.params.id));
}
//# sourceMappingURL=sessions.routes.js.map