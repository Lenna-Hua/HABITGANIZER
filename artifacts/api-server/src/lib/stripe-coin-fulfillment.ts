/**
 * Idempotency key for Stripe coin-pack fulfillment.
 *
 * Prefer the PaymentIntent id (stable across Checkout retries). Fall back to
 * the Checkout Session id when Stripe omits `payment_intent` so a retry still
 * collapses to one credit.
 */
export function stripeCheckoutIdempotencyKey(session: {
  id?: string;
  payment_intent?: string | { id?: string } | null;
}): string | null {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;
  if (paymentIntentId) return paymentIntentId;
  return session.id ?? null;
}
