import { analyticsRangeQuerySchema, connectorCreateSchema, connectorPatchSchema, idParamSchema, sessionListQuerySchema, stationCreateSchema, stationListQuerySchema, stationPatchSchema, userListQuerySchema, userPatchSchema, } from "./admin.schemas.js";
import * as svc from "./admin.service.js";
function actor(req) {
    return { userId: req.currentUser.sub, role: req.currentUser.role };
}
export async function adminRoutes(app) {
    const r = app.withTypeProvider();
    const guard = { preHandler: [app.requireRole("ADMIN", "OPERATOR")] };
    // ---- Users (ADMIN-only enforced inside service) ----
    r.get("/users", { ...guard, schema: { querystring: userListQuerySchema, tags: ["admin"] } }, async (req) => svc.listUsers(actor(req), req.query));
    r.get("/users/:id", { ...guard, schema: { params: idParamSchema, tags: ["admin"] } }, async (req) => svc.getUser(actor(req), req.params.id));
    r.patch("/users/:id", {
        ...guard,
        schema: {
            params: idParamSchema,
            body: userPatchSchema,
            tags: ["admin"],
        },
    }, async (req) => svc.patchUser(actor(req), req.params.id, req.body));
    // ---- Stations ----
    r.get("/stations", {
        ...guard,
        schema: { querystring: stationListQuerySchema, tags: ["admin"] },
    }, async (req) => svc.listStations(actor(req), req.query));
    r.post("/stations", {
        ...guard,
        schema: { body: stationCreateSchema, tags: ["admin"] },
    }, async (req, reply) => {
        const s = await svc.createStation(actor(req), req.body);
        return reply.code(201).send(s);
    });
    r.patch("/stations/:id", {
        ...guard,
        schema: {
            params: idParamSchema,
            body: stationPatchSchema,
            tags: ["admin"],
        },
    }, async (req) => svc.patchStation(actor(req), req.params.id, req.body));
    r.get("/stations/:id/connectors", { ...guard, schema: { params: idParamSchema, tags: ["admin"] } }, async (req) => svc.listConnectorsForStation(actor(req), req.params.id));
    r.post("/stations/:id/connectors", {
        ...guard,
        schema: {
            params: idParamSchema,
            body: connectorCreateSchema,
            tags: ["admin"],
        },
    }, async (req, reply) => {
        const c = await svc.createConnector(actor(req), req.params.id, req.body);
        return reply.code(201).send(c);
    });
    // ---- Connectors ----
    r.patch("/connectors/:id", {
        ...guard,
        schema: {
            params: idParamSchema,
            body: connectorPatchSchema,
            tags: ["admin"],
        },
    }, async (req) => svc.patchConnector(actor(req), req.params.id, req.body));
    r.delete("/connectors/:id", { ...guard, schema: { params: idParamSchema, tags: ["admin"] } }, async (req) => svc.deleteConnector(actor(req), req.params.id));
    // ---- Sessions oversight ----
    r.get("/sessions", {
        ...guard,
        schema: { querystring: sessionListQuerySchema, tags: ["admin"] },
    }, async (req) => svc.listSessions(actor(req), req.query));
    r.get("/sessions/:id", { ...guard, schema: { params: idParamSchema, tags: ["admin"] } }, async (req) => svc.getSession(actor(req), req.params.id));
    r.post("/sessions/:id/emergency-stop", { ...guard, schema: { params: idParamSchema, tags: ["admin"] } }, async (req) => svc.adminEmergencyStop(actor(req), req.params.id));
    // ---- Analytics ----
    r.get("/analytics/overview", { ...guard, schema: { tags: ["admin"] } }, async (req) => svc.overview(actor(req)));
    r.get("/analytics/stations", {
        ...guard,
        schema: {
            querystring: analyticsRangeQuerySchema,
            tags: ["admin"],
        },
    }, async (req) => svc.stationAnalytics(actor(req), req.query));
    r.get("/analytics/payments", {
        ...guard,
        schema: {
            querystring: analyticsRangeQuerySchema,
            tags: ["admin"],
        },
    }, async (req) => svc.paymentAnalytics(actor(req), req.query));
}
//# sourceMappingURL=admin.routes.js.map