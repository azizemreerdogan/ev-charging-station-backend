import { describe, expect, it } from "vitest";
import { calculateCost } from "./billing.service.js";

describe("calculateCost (UC-02 billing formula)", () => {
    it("returns zero for sessions under 5 minutes (BR-72)", () => {
        const r = calculateCost({
            energyKwh: 1,
            durationMinutes: 4,
            pricePerKwh: 0.3,
            timeRatePerHour: 0.1,
        });
        expect(r.totalAmount).toBe(0);
    });

    it("computes energy + time + tax (TC-007)", () => {
        const r = calculateCost({
            energyKwh: 10,
            durationMinutes: 60,
            pricePerKwh: 0.3,
            timeRatePerHour: 0.1,
        });
        // energy 3.00 + time 0.10 = 3.10 subtotal; tax 18% = 0.558 → 3.66
        expect(r.energyCost).toBe(3.0);
        expect(r.timeCost).toBe(0.1);
        expect(r.taxableSubtotal).toBe(3.1);
        expect(r.totalAmount).toBeCloseTo(3.66, 2);
    });

    it("never produces negative totals after discount (BR-71)", () => {
        const r = calculateCost({
            energyKwh: 1,
            durationMinutes: 30,
            pricePerKwh: 0.1,
            timeRatePerHour: 0,
            discountAmount: 999,
        });
        expect(r.totalAmount).toBe(0);
    });
});
