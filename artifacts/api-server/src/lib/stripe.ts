import Stripe from "stripe";

let stripe: Stripe | null = null;

const PLACEHOLDER_KEY =
  /^(sk_(test|live)_x+|sk_(test|live)_your|sk_(test|live)_replace|your[_-]?stripe)/i;

function readStripeSecretKey(): string | null {
  const raw =
    process.env.STRIPE_SECRET_KEY?.trim() ||
    process.env.STRIPE_API_KEY?.trim() ||
    process.env.STRIPE_SECRET?.trim() ||
    "";
  if (!raw) return null;
  if (PLACEHOLDER_KEY.test(raw) || raw.includes("xxxxxxxx")) return null;
  return raw;
}

/** True when a usable Stripe secret key is present in the environment. */
export function isStripeConfigured(): boolean {
  return Boolean(readStripeSecretKey());
}

/** Lazy Stripe client. Returns null when STRIPE_SECRET_KEY is unset (dev without payments). */
export function getStripe(): Stripe | null {
  const key = readStripeSecretKey();
  if (!key) return null;
  if (!stripe) {
    stripe = new Stripe(key, {
      apiVersion: "2026-06-24.dahlia",
      typescript: true,
    });
  }
  return stripe;
}

export function requireStripe(): Stripe {
  const client = getStripe();
  if (!client) {
    throw Object.assign(new Error("Stripe is not configured (missing STRIPE_SECRET_KEY)"), {
      status: 503,
      code: "stripe_not_configured",
    });
  }
  return client;
}

/** HTTP status from our tagged errors or Stripe's statusCode. */
export function httpStatusFromError(err: unknown, fallback = 500): number {
  if (!err || typeof err !== "object") return fallback;
  const e = err as { status?: unknown; statusCode?: unknown };
  if (typeof e.status === "number" && e.status >= 400 && e.status < 600) return e.status;
  if (typeof e.statusCode === "number" && e.statusCode >= 400 && e.statusCode < 600) {
    return e.statusCode;
  }
  return fallback;
}

/** Public app origin for Checkout success/cancel URLs. */
export function resolveAppOrigin(req: {
  get(name: string): string | undefined;
  headers: { origin?: string };
}): string {
  const fromEnv = process.env.APP_URL?.trim() || process.env.PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  const origin = req.headers.origin || req.get("origin");
  if (origin) return origin.replace(/\/+$/, "");

  const cors = (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)[0];
  if (cors) return cors.replace(/\/+$/, "");

  return "http://localhost:5173";
}
