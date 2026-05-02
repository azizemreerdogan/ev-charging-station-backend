import { Client, Status, } from "@googlemaps/google-maps-services-js";
import { env } from "../config/env.js";
import { haversineKm } from "../modules/stations/geo.js";
/**
 * Google Maps integration. The PDF (UC-03) calls for Google Maps API for
 * geocoding, distance/ETA, and map rendering. We treat the API as optional:
 * when GOOGLE_MAPS_API_KEY is unset or the API errors out (UC-03 "API Quota
 * Failure" exception), callers get a deterministic Haversine fallback so the
 * system stays available.
 */
const TTL_MS = env.GOOGLE_MAPS_CACHE_TTL_SECONDS * 1000;
const cache = new Map();
function cacheGet(key) {
    const hit = cache.get(key);
    if (!hit)
        return undefined;
    if (hit.expiresAt < Date.now()) {
        cache.delete(key);
        return undefined;
    }
    return hit.value;
}
function cacheSet(key, value) {
    if (TTL_MS <= 0)
        return;
    cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
}
const client = env.GOOGLE_MAPS_API_KEY ? new Client({}) : null;
export function isGoogleMapsEnabled() {
    return client !== null;
}
/**
 * Resolve an address to coordinates. Throws when Google is unavailable —
 * callers must decide whether to require coordinates or proceed without them
 * (we throw instead of falling back because there is no sensible offline
 * substitute for geocoding).
 */
export async function geocodeAddress(address) {
    if (!client || !env.GOOGLE_MAPS_API_KEY) {
        throw new GoogleMapsUnavailableError("Geocoding requires GOOGLE_MAPS_API_KEY");
    }
    const cacheKey = `geocode:${address}`;
    const cached = cacheGet(cacheKey);
    if (cached)
        return cached;
    try {
        const res = await client.geocode({
            params: { address, key: env.GOOGLE_MAPS_API_KEY },
            timeout: 5_000,
        });
        if (res.data.status !== Status.OK || res.data.results.length === 0) {
            throw new GoogleMapsUnavailableError(`Geocoding failed: ${res.data.status}`);
        }
        const top = res.data.results[0];
        const result = {
            latitude: top.geometry.location.lat,
            longitude: top.geometry.location.lng,
            formattedAddress: top.formatted_address,
            source: "google",
        };
        cacheSet(cacheKey, result);
        return result;
    }
    catch (err) {
        if (err instanceof GoogleMapsUnavailableError)
            throw err;
        throw new GoogleMapsUnavailableError(`Geocoding error: ${err.message}`);
    }
}
/**
 * Fetches driving distance + duration from origin to each destination in
 * order. On any failure (no key, quota exceeded, network), falls back to
 * Haversine for distance with `durationMinutes: null`.
 */
export async function getDistances(origin, destinations, mode = "driving") {
    const fallback = () => destinations.map((d) => ({
        distanceKm: haversineKm(origin.lat, origin.lng, d.lat, d.lng),
        durationMinutes: null,
        source: "haversine",
    }));
    if (!client || !env.GOOGLE_MAPS_API_KEY || destinations.length === 0) {
        return fallback();
    }
    const cacheKey = `dm:${mode}:${origin.lat},${origin.lng}|${destinations
        .map((d) => `${d.lat},${d.lng}`)
        .join(";")}`;
    const cached = cacheGet(cacheKey);
    if (cached)
        return cached;
    try {
        const res = await client.distancematrix({
            params: {
                origins: [origin],
                destinations,
                mode,
                key: env.GOOGLE_MAPS_API_KEY,
            },
            timeout: 5_000,
        });
        if (res.data.status !== Status.OK) {
            return fallback();
        }
        const row = res.data.rows[0];
        if (!row)
            return fallback();
        const results = row.elements.map((el, idx) => {
            const dest = destinations[idx];
            if (el.status !== "OK") {
                return {
                    distanceKm: haversineKm(origin.lat, origin.lng, dest.lat, dest.lng),
                    durationMinutes: null,
                    source: "haversine",
                };
            }
            return {
                distanceKm: el.distance.value / 1000,
                durationMinutes: Math.round(el.duration.value / 60),
                source: "google",
            };
        });
        cacheSet(cacheKey, results);
        return results;
    }
    catch {
        return fallback();
    }
}
/**
 * Builds a Google Static Maps URL the frontend can embed as <img src>. This
 * is the "render" path described in UC-03: the backend doesn't actually draw
 * tiles, it produces a signed URL that browsers/PDF generators can fetch.
 *
 * When no API key is configured, returns null so callers can degrade to
 * "raw lat/lng + frontend SDK" rendering.
 */
export function buildStaticMapUrl(opts) {
    if (!env.GOOGLE_MAPS_API_KEY)
        return null;
    const params = new URLSearchParams();
    params.set("size", opts.size ?? env.STATIC_MAP_DEFAULT_SIZE);
    if (opts.center) {
        params.set("center", `${opts.center.lat},${opts.center.lng}`);
    }
    if (opts.zoom !== undefined) {
        params.set("zoom", String(opts.zoom));
    }
    params.set("key", env.GOOGLE_MAPS_API_KEY);
    // One markers param per color/label group. Simplest: one per marker so
    // each can have its own color matching the GREEN/YELLOW/RED status.
    for (const m of opts.markers) {
        const parts = [];
        if (m.color)
            parts.push(`color:${m.color}`);
        if (m.label)
            parts.push(`label:${m.label}`);
        parts.push(`${m.latitude},${m.longitude}`);
        params.append("markers", parts.join("|"));
    }
    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}
export class GoogleMapsUnavailableError extends Error {
    constructor(message) {
        super(message);
        this.name = "GoogleMapsUnavailableError";
    }
}
//# sourceMappingURL=google-maps.js.map