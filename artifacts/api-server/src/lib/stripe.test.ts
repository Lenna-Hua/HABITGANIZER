import assert from "node:assert/strict";
import { describe, it, after } from "node:test";
import { httpStatusFromError, isStripeConfigured, getStripe } from "./stripe";

describe("stripe config helpers", () => {
  const hadSecret = Object.prototype.hasOwnProperty.call(process.env, "STRIPE_SECRET_KEY");
  const hadApi = Object.prototype.hasOwnProperty.call(process.env, "STRIPE_API_KEY");
  const hadSecretAlias = Object.prototype.hasOwnProperty.call(process.env, "STRIPE_SECRET");
  const prevSecret = process.env.STRIPE_SECRET_KEY;
  const prevApi = process.env.STRIPE_API_KEY;
  const prevSecretAlias = process.env.STRIPE_SECRET;

  after(() => {
    if (hadSecret) process.env.STRIPE_SECRET_KEY = prevSecret;
    else delete process.env.STRIPE_SECRET_KEY;
    if (hadApi) process.env.STRIPE_API_KEY = prevApi;
    else delete process.env.STRIPE_API_KEY;
    if (hadSecretAlias) process.env.STRIPE_SECRET = prevSecretAlias;
    else delete process.env.STRIPE_SECRET;
  });

  it("treats missing keys as unconfigured", () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_API_KEY;
    delete process.env.STRIPE_SECRET;
    assert.equal(isStripeConfigured(), false);
    assert.equal(getStripe(), null);
  });

  it("rejects placeholder secret keys", () => {
    delete process.env.STRIPE_API_KEY;
    delete process.env.STRIPE_SECRET;
    process.env.STRIPE_SECRET_KEY = "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
    assert.equal(isStripeConfigured(), false);
    assert.equal(getStripe(), null);
  });

  it("accepts STRIPE_API_KEY as an alias", () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET;
    process.env.STRIPE_API_KEY = "sk_test_51ValidLookingKeyForUnitTestOnly0001";
    assert.equal(isStripeConfigured(), true);
  });

  it("maps tagged status and Stripe statusCode", () => {
    assert.equal(httpStatusFromError({ status: 503 }), 503);
    assert.equal(httpStatusFromError({ statusCode: 402 }), 402);
    assert.equal(httpStatusFromError(new Error("nope")), 500);
  });
});
