# Stripe Integration TODO

Single source of truth for remaining Checkout Studio (embedded form) setup.

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- None for `mode` / `line_items` — existing Habiganize calls already use real `mode: "payment"` and dynamic `price_data` line items (not `price_...` stubs).

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | unset / example `pk_test_…` | Your publishable key from [Stripe API keys](https://dashboard.stripe.com/apikeys). Set in root `.env` and Netlify env. |
| `STRIPE_SECRET_KEY` | unset / example `sk_test_…` | Your secret key from the same Dashboard page. Set in root `.env` and Render env. |
| `STRIPE_WEBHOOK_SECRET` | unset / example `whsec_…` | Signing secret for `POST /api/webhooks/stripe` from [Workbench → Webhooks](https://dashboard.stripe.com/workbench/webhooks). |

Optional later: if you prefer Dashboard Price IDs instead of inline `price_data`, replace `line_items` in the files below with `{ price: "price_…", quantity: 1 }`.

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [artifacts/api-server/src/routes/subscriptions.ts](artifacts/api-server/src/routes/subscriptions.ts) (`POST /api/coin-packs/checkout/:slug`)
- [artifacts/api-server/src/routes/donations.ts](artifacts/api-server/src/routes/donations.ts) (`POST /api/donations/checkout`)
- [artifacts/api-server/src/lib/stripe.ts](artifacts/api-server/src/lib/stripe.ts) (API version + beta)
- [artifacts/habit-tracker/index.html](artifacts/habit-tracker/index.html) (Stripe.js dahlia)
- [artifacts/habit-tracker/src/lib/stripe-checkout-form.ts](artifacts/habit-tracker/src/lib/stripe-checkout-form.ts)
- [artifacts/habit-tracker/src/components/stripe-checkout-dialog.tsx](artifacts/habit-tracker/src/components/stripe-checkout-dialog.tsx)
- [artifacts/habit-tracker/src/pages/premium.tsx](artifacts/habit-tracker/src/pages/premium.tsx)

| Parameter | Value |
|-----------|-------|
| `mode` | `payment` |
| `ui_mode` | `form` (stripe-node `^22.3.2` ≥ 21.0.0) |
| `line_items` | dynamic `price_data` (not `{{PRICE_ID}}` placeholder) |
| `billing_address_collection` | `auto` |
| `submit_type` | `auto` |
| `integration_identifier` | `custom_embedded_web_0001` |
| API version | `2026-03-25.dahlia; custom_checkout_payment_form_preview=v1` |
| Stripe.js | `https://js.stripe.com/dahlia/stripe.js` + beta `custom_checkout_payment_form_1` |
| Appearance | theme `stripe`, labels `auto`, inputs `spaced` (see `stripe-checkout-form.ts`) |

Session create matches the Checkout Studio server snippet. Secret key comes from `STRIPE_SECRET_KEY` (never hardcoded). Response is `{ client_secret }` for the embedded form — not `res.redirect(session.url)`.

Client (`stripe-checkout-form.ts`) matches the Studio snippet: `Stripe(pk, { betas: ['custom_checkout_payment_form_1'] })` → `initCheckoutFormSdk({ clientSecret, appearance })` → `createForm({ layout: 'expanded' })` → `mount('#checkout-form')` → `loadActions` / `confirm`. Publishable key from `VITE_STRIPE_PUBLISHABLE_KEY` (never hardcoded).

## Setup and next steps

### Environment variables

Copy [`.env.example`](.env.example) → `.env` and set:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

- **API (Render):** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Web (Netlify):** `VITE_STRIPE_PUBLISHABLE_KEY` (rebuild after changing)

### Project structure (new / touched for this integration)

| Path | Role |
|------|------|
| `artifacts/api-server/src/lib/stripe.ts` | Stripe Node SDK client + Checkout Studio API version |
| `artifacts/api-server/src/routes/subscriptions.ts` | Coin-pack Checkout Session → `{ client_secret }` |
| `artifacts/api-server/src/routes/donations.ts` | Donation Checkout Session → `{ client_secret }` |
| `artifacts/habit-tracker/index.html` | Loads Stripe.js dahlia build |
| `artifacts/habit-tracker/src/lib/stripe-checkout-form.ts` | `initCheckoutFormSdk` + appearance + confirm wiring |
| `artifacts/habit-tracker/src/components/stripe-checkout-dialog.tsx` | Mounts `#checkout-form` in a dialog |
| `artifacts/habit-tracker/src/pages/premium.tsx` | Opens embedded form instead of hosted redirect |

### How the integration works

1. User clicks **Buy with Stripe** or **Donate** on `/premium`.
2. Authenticated API creates a Checkout Session with `ui_mode: "form"` and returns `{ client_secret }`.
3. The web app initializes Stripe.js (`custom_checkout_payment_form_1`), calls `initCheckoutFormSdk`, mounts `#checkout-form`, and confirms via `loadActions().actions.confirm`.
4. Stripe sends `checkout.session.completed` to `POST /api/webhooks/stripe` for fulfillment.

### Fulfillment follow-up (important)

Checkout Studio Scenario A removed session fields that were **not** in Field Intents (`metadata`, `client_reference_id`, `success_url`, `cancel_url`). The existing webhook still expects `metadata.kind` (`coin_pack` / `donation`) to credit coins or complete donations.

**Before going live**, restore fulfillment identifiers on the session create calls (or rewrite the webhook) so purchases can be attributed to a wallet. Suggested fields to re-add after Studio baseline:

- `metadata: { kind, walletId, … }`
- `client_reference_id: walletId`

### Testing

Use [Stripe test cards](https://docs.stripe.com/testing#cards):

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Decline |

Any future expiry, any CVC, any postal code in test mode.

### Next steps

1. Set keys in `.env`, Render, and Netlify (see above).
2. Point a Stripe webhook to `https://habiganize-api.onrender.com/api/webhooks/stripe` for `checkout.session.completed`.
3. Re-wire session `metadata` / webhook fulfillment (see above).
4. When ready for plan subscriptions, add a separate `mode: "subscription"` session (then include `payment_method_collection: "always"`) — still Stripe-only, not Clerk Billing.
5. Optionally create Dashboard Products/Prices and switch `line_items` to Price IDs.

### Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
- https://docs.stripe.com/checkout/form/quickstart
- https://docs.stripe.com/sdks (Node server SDK + Stripe.js web)
