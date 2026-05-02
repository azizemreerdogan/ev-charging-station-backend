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
export declare function processMockPayment(req: PaymentRequest): Promise<PaymentResult>;
//# sourceMappingURL=payments.service.d.ts.map