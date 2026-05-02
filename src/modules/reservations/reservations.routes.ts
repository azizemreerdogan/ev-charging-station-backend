import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
    cancelReservation,
    createReservation,
    listUserReservations,
} from "./reservations.service.js";

const createBodySchema = z
    .object({
        vehicleId: z.string().uuid(),
        connectorId: z.string().uuid(),
        startTime: z.coerce.date(),
        endTime: z.coerce.date(),
    })
    .refine((v) => v.endTime > v.startTime, {
        message: "endTime must be after startTime",
        path: ["endTime"],
    });

const idParamSchema = z.object({ id: z.string().uuid() });

export async function reservationRoutes(app: FastifyInstance) {
    const r = app.withTypeProvider<ZodTypeProvider>();

    r.get(
        "/",
        { onRequest: [app.authenticate], schema: { tags: ["reservations"] } },
        async (req) => listUserReservations(req.currentUser.sub),
    );

    r.post(
        "/",
        {
            onRequest: [app.authenticate],
            schema: { body: createBodySchema, tags: ["reservations"] },
        },
        async (req, reply) => {
            const reservation = await createReservation({
                userId: req.currentUser.sub,
                ...req.body,
            });
            return reply.code(201).send(reservation);
        },
    );

    r.delete(
        "/:id",
        {
            onRequest: [app.authenticate],
            schema: { params: idParamSchema, tags: ["reservations"] },
        },
        async (req) => {
            return cancelReservation(req.currentUser.sub, req.params.id);
        },
    );
}
