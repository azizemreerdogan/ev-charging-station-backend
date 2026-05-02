import { type LatLngLiteral, type TravelMode } from "@googlemaps/google-maps-services-js";
export declare function isGoogleMapsEnabled(): boolean;
export interface GeocodeResult {
    latitude: number;
    longitude: number;
    formattedAddress: string;
    source: "google" | "unavailable";
}
/**
 * Resolve an address to coordinates. Throws when Google is unavailable —
 * callers must decide whether to require coordinates or proceed without them
 * (we throw instead of falling back because there is no sensible offline
 * substitute for geocoding).
 */
export declare function geocodeAddress(address: string): Promise<GeocodeResult>;
export interface DistanceResult {
    distanceKm: number;
    durationMinutes: number | null;
    source: "google" | "haversine";
}
/**
 * Fetches driving distance + duration from origin to each destination in
 * order. On any failure (no key, quota exceeded, network), falls back to
 * Haversine for distance with `durationMinutes: null`.
 */
export declare function getDistances(origin: LatLngLiteral, destinations: LatLngLiteral[], mode?: TravelMode): Promise<DistanceResult[]>;
export interface StaticMapMarker {
    latitude: number;
    longitude: number;
    color?: "red" | "green" | "yellow" | "blue" | "orange";
    label?: string;
}
export interface StaticMapOptions {
    center?: LatLngLiteral;
    zoom?: number;
    size?: string;
    markers: StaticMapMarker[];
}
/**
 * Builds a Google Static Maps URL the frontend can embed as <img src>. This
 * is the "render" path described in UC-03: the backend doesn't actually draw
 * tiles, it produces a signed URL that browsers/PDF generators can fetch.
 *
 * When no API key is configured, returns null so callers can degrade to
 * "raw lat/lng + frontend SDK" rendering.
 */
export declare function buildStaticMapUrl(opts: StaticMapOptions): string | null;
export declare class GoogleMapsUnavailableError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=google-maps.d.ts.map