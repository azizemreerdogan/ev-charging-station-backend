import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { ConflictError, ForbiddenError, NotFoundError, } from "../../utils/errors.js";
const connectorTypeEnum = z.enum([
    "TYPE_1",
    "TYPE_2",
    "CCS",
    "CHADEMO",
    "TESLA",
]);
const createVehicleSchema = z.object({
    make: z.string().min(1).max(50),
    model: z.string().min(1).max(50),
    year: z.number().int().min(2010).max(new Date().getFullYear() + 1),
    licensePlate: z.string().min(1).max(20),
    batteryKwh: z.number().min(10).max(200),
    connectorTypes: z.array(connectorTypeEnum).min(1),
    nickname: z.string().max(50).optional(),
});
const idParamSchema = z.object({ id: z.string().uuid() });
const MAX_VEHICLES_PER_USER = 10;
export async function vehicleRoutes(app) {
    const r = app.withTypeProvider();
    r.get("/", { onRequest: [app.authenticate], schema: { tags: ["vehicles"] } }, async (req) => {
        return prisma.vehicle.findMany({
            where: { userId: req.currentUser.sub, deletedAt: null },
            orderBy: { createdAt: "desc" },
        });
    });
    r.post("/", {
        onRequest: [app.authenticate],
        schema: { body: createVehicleSchema, tags: ["vehicles"] },
    }, async (req, reply) => {
        const count = await prisma.vehicle.count({
            where: { userId: req.currentUser.sub, deletedAt: null },
        });
        if (count >= MAX_VEHICLES_PER_USER) {
            throw new ConflictError(`Maximum ${MAX_VEHICLES_PER_USER} vehicles per user`);
        }
        try {
            const vehicle = await prisma.vehicle.create({
                data: {
                    userId: req.currentUser.sub,
                    ...req.body,
                },
            });
            return reply.code(201).send(vehicle);
        }
        catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === "P2002") {
                throw new ConflictError("License plate already registered");
            }
            throw err;
        }
    });
    r.delete("/:id", {
        onRequest: [app.authenticate],
        schema: { params: idParamSchema, tags: ["vehicles"] },
    }, async (req, reply) => {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: req.params.id },
        });
        if (!vehicle || vehicle.deletedAt)
            throw new NotFoundError("Vehicle");
        if (vehicle.userId !== req.currentUser.sub) {
            throw new ForbiddenError();
        }
        await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: { deletedAt: new Date() },
        });
        return reply.code(204).send();
    });
}
//# sourceMappingURL=vehicles.routes.js.map