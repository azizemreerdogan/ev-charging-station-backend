import { env } from "../../config/env.js";

export interface CostInputs {
    energyKwh: number;
    durationMinutes: number;
    pricePerKwh: number;
    timeRatePerHour: number;
    discountAmount?: number;
}

export interface CostBreakdown {
    energyCost: number;
    timeCost: number;
    discountAmount: number;
    taxableSubtotal: number;
    taxAmount: number;
    totalAmount: number;
}

const MIN_CHARGEABLE_MINUTES = 5;

/**
 * UC-02 billing formula:
 *   total = energyKwh * pricePerKwh + durationHours * timeRate - discount + tax
 * Sessions shorter than 5 minutes are free (BR-72). Total is never negative
 * (BR-71).
 */
export function calculateCost(input: CostInputs): CostBreakdown {
    if (input.durationMinutes < MIN_CHARGEABLE_MINUTES) {
        return {
            energyCost: 0,
            timeCost: 0,
            discountAmount: 0,
            taxableSubtotal: 0,
            taxAmount: 0,
            totalAmount: 0,
        };
    }

    const energyCost = input.energyKwh * input.pricePerKwh;
    const timeCost = (input.durationMinutes / 60) * input.timeRatePerHour;
    const discountAmount = input.discountAmount ?? 0;
    const subtotal = Math.max(energyCost + timeCost - discountAmount, 0);
    const taxAmount = subtotal * env.TAX_RATE;
    const totalAmount = subtotal + taxAmount;

    return {
        energyCost: round2(energyCost),
        timeCost: round2(timeCost),
        discountAmount: round2(discountAmount),
        taxableSubtotal: round2(subtotal),
        taxAmount: round2(taxAmount),
        totalAmount: round2(totalAmount),
    };
}

function round2(n: number): number {
    return Math.round(n * 100) / 100;
}

export function generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const seq = Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, "0");
    return `INV-${year}-${seq}`;
}
