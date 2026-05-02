import { describe, expect, it } from "vitest";
import { buildStaticMapUrl, getDistances, isGoogleMapsEnabled, } from "./google-maps.js";
// These tests assume GOOGLE_MAPS_API_KEY is unset in the test env (it is in
// the dev .env). They cover the UC-03 "API Quota Failure" fallback path.
describe("google maps fallback (no API key)", () => {
    it("reports as disabled", () => {
        expect(isGoogleMapsEnabled()).toBe(false);
    });
    it("buildStaticMapUrl returns null without a key", () => {
        const url = buildStaticMapUrl({
            markers: [{ latitude: 41, longitude: 29 }],
        });
        expect(url).toBeNull();
    });
    it("getDistances falls back to Haversine", async () => {
        const results = await getDistances({ lat: 41.0082, lng: 28.9784 }, [
            { lat: 40.9769, lng: 28.8146 },
            { lat: 41.0431, lng: 29.0061 },
        ]);
        expect(results).toHaveLength(2);
        for (const r of results) {
            expect(r.source).toBe("haversine");
            expect(r.durationMinutes).toBeNull();
            expect(r.distanceKm).toBeGreaterThan(0);
        }
    });
});
//# sourceMappingURL=google-maps.test.js.map