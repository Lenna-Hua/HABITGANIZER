import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stripeCheckoutIdempotencyKey } from "./stripe-coin-fulfillment";

describe("stripeCheckoutIdempotencyKey", () => {
  it("prefers a string payment_intent", () => {
    assert.equal(
      stripeCheckoutIdempotencyKey({ id: "cs_1", payment_intent: "pi_1" }),
      "pi_1",
    );
  });

  it("reads payment_intent.id when Stripe expands the object", () => {
    assert.equal(
      stripeCheckoutIdempotencyKey({ id: "cs_1", payment_intent: { id: "pi_obj" } }),
      "pi_obj",
    );
  });

  it("falls back to the Checkout Session id when payment_intent is missing", () => {
    assert.equal(stripeCheckoutIdempotencyKey({ id: "cs_retry" }), "cs_retry");
    assert.equal(stripeCheckoutIdempotencyKey({ id: "cs_retry", payment_intent: null }), "cs_retry");
    assert.equal(stripeCheckoutIdempotencyKey({ id: "cs_retry", payment_intent: {} }), "cs_retry");
  });

  it("returns null only when neither id is present", () => {
    assert.equal(stripeCheckoutIdempotencyKey({}), null);
    assert.equal(stripeCheckoutIdempotencyKey({ payment_intent: null }), null);
  });
});
