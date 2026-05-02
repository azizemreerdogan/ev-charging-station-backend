import { randomUUID } from "node:crypto";

export interface PaymentRequest {
    amount: number;
    currency: string;
    userId: string;
    simulate?: "success" | "insufficient_funds";
}

export interface PaymentResult {
    success: boolean;
    gatewayTransactionId: string;
    failureReason?: string;
}

/**
 * Mock payment gateway. Real Stripe/PayPal integration is deferred to Phase 2.
 * Pass `simulate: "insufficient_funds"` to exercise the failure path
 * (UC-02 Insufficient Funds exception).
 */
export async function processMockPayment(
    req: PaymentRequest,
): Promise<PaymentResult> {
    if (req.simulate === "insufficient_funds") {
        return {
            success: false,
            gatewayTransactionId: `mock_${randomUUID()}`,
            failureReason: "Insufficient funds",
        };
    }
    return {
        success: true,
        gatewayTransactionId: `mock_${randomUUID()}`,
    };
}
