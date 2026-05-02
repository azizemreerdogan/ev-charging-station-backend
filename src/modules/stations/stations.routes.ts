import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { ForbiddenError, NotFoundError } from "../../utils/errors.js";
import { haversineKm } from "./geo.js";
import {
    buildStaticMapUrl,
    getDistances,
    isGoogleMapsEnabled,
} from "../../services/google-maps.js";
import { createStation } from "./stations.service.js";

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
    includeMapUrl: z
        .union([z.literal("true"), z.literal("false")])
        .optional()
        .transform((v) => v === "true"),
});

const idParamSchema = z.object({ id: z.string().uuid() });

const createStationSchema = z
    .object({
        name: z.string().min(1).max(120),
        address: z.string().min(3).max(255),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        operatingHours: z.string().min(1).max(120).optional(),
        amenities: z.array(z.string().max(40)).max(20).optional(),
    })
    .refine(
        (v) =>
            (v.latitude === undefined && v.longitude === undefined) ||
            (v.latitude !== undefined && v.longitude !== undefined),
        { message: "latitude and longitude must be provided together" },
    );

const staticMapQuerySchema = z.object({
    size: z
        .string()
        .regex(/^\d{2,4}x\d{2,4}$/)
        .optional(),
    zoom: z.coerce.number().int().min(1).max(20).optional(),
});

const overviewMapQuerySchema = discoveryQuerySchema.extend({
    size: z
        .string()
        .regex(/^\d{2,4}x\d{2,4}$/)
        .optional(),
    zoom: z.coerce.number().int().min(1).max(20).optional(),
});

function mapStatusFor(
    stationStatus: "ACTIVE" | "MAINTENANCE" | "OFFLINE",
    availableCount: number,
): "GREEN" | "YELLOW" | "RED" {
    if (stationStatus !== "ACTIVE") return "RED";
    return availableCount > 0 ? "GREEN" : "YELLOW";
}

function colorFor(status: "GREEN" | "YELLOW" | "RED"): "green" | "yellow" | "red" {
    return status === "GREEN" ? "green" : status === "YELLOW" ? "yellow" : "red";
}

export async function stationRoutes(app: FastifyInstance) {
    const r = app.withTypeProvider<ZodTypeProvider>();

    // UC-03 — discovery + filters. Public endpoint.
    r.get(
        "/",
        { schema: { querystring: discoveryQuerySchema, tags: ["stations"] } },
        async (req) => {
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

            const filtered = stations.filter((s) => s.connectors.length > 0);

            // Compute distances. If user gave lat/lng, use Distance Matrix
            // (with internal Haversine fallback on quota failure).
            let distances: Array<{
                distanceKm: number;
                durationMinutes: number | null;
                source: "google" | "haversine";
            }> | null = null;
            if (q.lat !== undefined && q.lng !== undefined) {
                distances = await getDistances(
                    { lat: q.lat, lng: q.lng },
                    filtered.map((s) => ({
                        lat: s.latitude,
                        lng: s.longitude,
                    })),
                );
            }

            const enriched = filtered
                .map((s, idx) => {
                    const distInfo = distances?.[idx] ?? null;
                    const distanceKm =
                        distInfo?.distanceKm ??
                        (q.lat !== undefined && q.lng !== undefined
                            ? haversineKm(
                                  q.lat,
                                  q.lng,
                                  s.latitude,
                                  s.longitude,
                              )
                            : null);
                    const availableCount = s.connectors.filter(
                        (c) => c.status === "AVAILABLE",
                    ).length;
                    const status = mapStatusFor(s.status, availableCount);
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
                        mapStatus: status,
                        distanceKm:
                            distanceKm !== null
                                ? Math.round(distanceKm * 100) / 100
                                : null,
                        durationMinutes: distInfo?.durationMinutes ?? null,
                        distanceSource: distInfo?.source ?? "haversine",
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
                .filter(
                    (s) =>
                        (s.distanceKm === null || s.distanceKm <= q.radiusKm) &&
                        (!q.onlyAvailable || s.mapStatus === "GREEN"),
                )
                .sort((a, b) => {
                    if (a.distanceKm === null || b.distanceKm === null) return 0;
                    return a.distanceKm - b.distanceKm;
                });

            const mapUrl = q.includeMapUrl
                ? buildStaticMapUrl({
                      ...(q.lat !== undefined && q.lng !== undefined
                          ? { center: { lat: q.lat, lng: q.lng } }
                          : {}),
                      markers: enriched.map((s) => ({
                          latitude: s.latitude,
                          longitude: s.longitude,
                          color: colorFor(s.mapStatus),
                      })),
                  })
                : null;

            return {
                stations: enriched,
                googleMapsEnabled: isGoogleMapsEnabled(),
                mapUrl,
            };
        },
    );

    // Multi-marker overview Static Map for the same query (UC-03 render path).
    r.get(
        "/map",
        {
            schema: {
                querystring: overviewMapQuerySchema,
                tags: ["stations"],
            },
        },
        async (req, reply) => {
            const q = req.query;
            const stations = await prisma.chargingStation.findMany({
                where: { status: { not: "OFFLINE" } },
                include: { connectors: true },
            });
            const markers = stations
                .map((s) => {
                    const availableCount = s.connectors.filter(
                        (c) => c.status === "AVAILABLE",
                    ).length;
                    const status = mapStatusFor(s.status, availableCount);
                    return {
                        latitude: s.latitude,
                        longitude: s.longitude,
                        mapStatus: status,
                    };
                })
                .filter((m) => {
                    if (q.lat === undefined || q.lng === undefined) return true;
                    return (
                        haversineKm(q.lat, q.lng, m.latitude, m.longitude) <=
                        q.radiusKm
                    );
                });

            const url = buildStaticMapUrl({
                ...(q.lat !== undefined && q.lng !== undefined
                    ? { center: { lat: q.lat, lng: q.lng } }
                    : {}),
                ...(q.zoom !== undefined ? { zoom: q.zoom } : {}),
                ...(q.size !== undefined ? { size: q.size } : {}),
                markers: markers.map((m) => ({
                    latitude: m.latitude,
                    longitude: m.longitude,
                    color: colorFor(m.mapStatus),
                })),
            });

            if (!url) {
                return reply.code(503).send({
                    code: "GOOGLE_MAPS_DISABLED",
                    message:
                        "Static Map rendering requires GOOGLE_MAPS_API_KEY. Use the lat/lng/markers data with a client-side SDK instead.",
                });
            }
            return { url };
        },
    );

    r.get(
        "/:id",
        { schema: { params: idParamSchema, tags: ["stations"] } },
        async (req) => {
            const station = await prisma.chargingStation.findUnique({
                where: { id: req.params.id },
                include: { connectors: true },
            });
            if (!station) throw new NotFoundError("Station");
            return station;
        },
    );

    // Static Map for a single station — backend returns the URL the frontend
    // (or a PDF/email pipeline) embeds as <img src>.
    r.get(
        "/:id/static-map",
        {
            schema: {
                params: idParamSchema,
                querystring: staticMapQuerySchema,
                tags: ["stations"],
            },
        },
        async (req, reply) => {
            const station = await prisma.chargingStation.findUnique({
                where: { id: req.params.id },
                include: { connectors: true },
            });
            if (!station) throw new NotFoundError("Station");
            const availableCount = station.connectors.filter(
                (c) => c.status === "AVAILABLE",
            ).length;
            const status = mapStatusFor(station.status, availableCount);
            const url = buildStaticMapUrl({
                center: { lat: station.latitude, lng: station.longitude },
                zoom: req.query.zoom ?? 15,
                ...(req.query.size !== undefined
                    ? { size: req.query.size }
                    : {}),
                markers: [
                    {
                        latitude: station.latitude,
                        longitude: station.longitude,
                        color: colorFor(status),
                    },
                ],
            });
            if (!url) {
                return reply.code(503).send({
                    code: "GOOGLE_MAPS_DISABLED",
                    message:
                        "Static Map rendering requires GOOGLE_MAPS_API_KEY",
                    fallback: {
                        latitude: station.latitude,
                        longitude: station.longitude,
                        mapStatus: status,
                    },
                });
            }
            return { url };
        },
    );

    // Operator/admin can register a new station. Auto-geocodes when lat/lng
    // are omitted (uses Google Maps Geocoding API).
    r.post(
        "/",
        {
            preHandler: [app.requireRole("OPERATOR", "ADMIN")],
            schema: { body: createStationSchema, tags: ["stations"] },
        },
        async (req, reply) => {
            // Operators can only register their own stations; admins can pass
            // an explicit operatorId in the future. Phase 1: always self.
            const actor = await prisma.user.findUnique({
                where: { id: req.currentUser.sub },
            });
            if (!actor) throw new ForbiddenError();

            const station = await createStation({
                operatorId: actor.id,
                ...req.body,
            });
            return reply.code(201).send(station);
        },
    );
}
