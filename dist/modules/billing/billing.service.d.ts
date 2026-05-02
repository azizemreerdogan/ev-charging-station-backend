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
/**
 * UC-02 billing formula:
 *   total = energyKwh * pricePerKwh + durationHours * timeRate - discount + tax
 * Sessions shorter than 5 minutes are free (BR-72). Total is never negative
 * (BR-71).
 */
export declare function calculateCost(input: CostInputs): CostBreakdown;
export declare function generateInvoiceNumber(): string;
//# sourceMappingURL=billing.service.d.ts.map