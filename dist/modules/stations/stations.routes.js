import { z } from "zod";
import { prisma } from "../../db/client.js";
import { NotFoundError } from "../../utils/errors.js";
import { haversineKm } from "./geo.js";
const connectorTypeEnum = z.enum([
    "TYPE_1",
    "TYPE_2",
    "CCS",
    "CHADEMO",
    "TESLA",
]);
const discoveryQuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().min(1).max(100).default(10),
    connectorType: connectorTypeEnum.optional(),
    minPowerKw: z.coerce.number().min(0).optional(),
    onlyAvailable: z
        .union([z.literal("true"), z.literal("false")])
        .optional()
        .transform((v) => v === "true"),
});
const idParamSchema = z.object({ id: z.string().uuid() });
export async function stationRoutes(app) {
    const r = app.withTypeProvider();
    // UC-03 — discovery + filters. Public endpoint.
    r.get("/", { schema: { querystring: discoveryQuerySchema, tags: ["stations"] } }, async (req) => {
        const q = req.query;
        const stations = await prisma.chargingStation.findMany({
            where: { status: { not: "OFFLINE" } },
            include: {
                connectors: {
                    where: {
                        ...(q.connectorType
                            ? { type: q.connectorType }
                            : {}),
                        ...(q.minPowerKw !== undefined
                            ? { powerKw: { gte: q.minPowerKw } }
                            : {}),
                    },
                },
            },
        });
        const enriched = stations
            .filter((s) => s.connectors.length > 0)
            .map((s) => {
            const distanceKm = q.lat !== undefined && q.lng !== undefined
                ? haversineKm(q.lat, q.lng, s.latitude, s.longitude)
                : null;
            const availableCount = s.connectors.filter((c) => c.status === "AVAILABLE").length;
            let mapStatus;
            if (s.status !== "ACTIVE")
                mapStatus = "RED";
            else if (availableCount > 0)
                mapStatus = "GREEN";
            else
                mapStatus = "YELLOW";
            return {
                id: s.id,
                name: s.name,
                address: s.address,
                latitude: s.latitude,
                longitude: s.longitude,
                operatingHours: s.operatingHours,
                amenities: s.amenities,
                rating: s.rating,
                status: s.status,
                mapStatus,
                distanceKm,
                connectors: s.connectors.map((c) => ({
                    id: c.id,
                    type: c.type,
                    powerKw: c.powerKw,
                    pricePerKwh: c.pricePerKwh.toString(),
                    timeRatePerHour: c.timeRatePerHour.toString(),
                    status: c.status,
                })),
            };
        })
            .filter((s) => distanceWithinRadius(s.distanceKm, q.radiusKm) &&
            (!q.onlyAvailable || s.mapStatus === "GREEN"))
            .sort((a, b) => {
            if (a.distanceKm === null || b.distanceKm === null)
                return 0;
            return a.distanceKm - b.distanceKm;
        });
        return enriched;
    });
    r.get("/:id", { schema: { params: idParamSchema, tags: ["stations"] } }, async (req) => {
        const station = await prisma.chargingStation.findUnique({
            where: { id: req.params.id },
            include: { connectors: true },
        });
        if (!station)
            throw new NotFoundError("Station");
        return station;
    });
}
function distanceWithinRadius(distanceKm, radius) {
    if (distanceKm === null)
        return true;
    return distanceKm <= radius;
}
//# sourceMappingURL=stations.routes.js.map