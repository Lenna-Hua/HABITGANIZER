/**
 * Stripe Checkout Studio embedded form (dahlia Stripe.js).
 * Script: https://js.stripe.com/dahlia/stripe.js — never bundle or self-host.
 */

// Appearance from Checkout Studio
export const STRIPE_CHECKOUT_APPEARANCE = {
  theme: "stripe",
  inputs: "spaced",
  labels: "auto",
  variables: {
    borderRadius: "4px",
    colorBackground: "#ffffff",
    colorDanger: "#df1b41",
    colorPrimary: "#0570de",
    colorSuccess: "#00c853",
    colorText: "#30313d",
    fontFamily: "default",
    fontSizeBase: "16px",
    spacingUnit: "4px",
  },
} as const;

type StripeConfirmEvent = unknown;

type StripeCheckoutFormInstance = {
  mount: (selector: string) => void;
  unmount?: () => void;
  on: (
    event: "confirm",
    handler: (event: StripeConfirmEvent) => void | Promise<void>,
  ) => void;
};

type StripeCheckoutActions = {
  confirm: (opts: { formConfirmEvent: StripeConfirmEvent }) => Promise<unknown>;
};

type StripeCheckoutSdk = {
  createForm: (opts: { layout: "expanded" }) => StripeCheckoutFormInstance;
  loadActions: () => Promise<
    | { type: "success"; actions: StripeCheckoutActions }
    | { type: "error"; error?: unknown }
  >;
  destroy?: () => void;
};

type StripeBrowser = {
  initCheckoutFormSdk: (opts: {
    clientSecret: string | Promise<string>;
    appearance: typeof STRIPE_CHECKOUT_APPEARANCE;
  }) => StripeCheckoutSdk;
};

declare global {
  interface Window {
    Stripe?: (publishableKey: string, options?: { betas?: string[] }) => StripeBrowser;
  }
}

export type MountedCheckoutForm = {
  destroy: () => void;
};

/**
 * Mirrors Checkout Studio client snippet:
 * Stripe(pk, { betas }) → initCheckoutFormSdk → createForm → mount('#checkout-form') → confirm
 */
export async function mountStripeCheckoutForm(options: {
  publishableKey: string;
  /** Session client_secret, or a Promise that resolves to it (Studio fetch pattern). */
  clientSecret: string | Promise<string>;
  mountSelector?: string;
}): Promise<MountedCheckoutForm> {
  if (typeof window.Stripe !== "function") {
    throw new Error("Stripe.js failed to load. Check the dahlia script in index.html.");
  }

  // create an instance of Stripe on your Checkout Page
  const stripe = window.Stripe(options.publishableKey, {
    betas: ["custom_checkout_payment_form_1"],
  });

  const appearance = STRIPE_CHECKOUT_APPEARANCE;

  // create the Checkout instance
  const checkout = stripe.initCheckoutFormSdk({
    clientSecret: options.clientSecret,
    appearance,
  });

  // Create and mount the Embedded form
  const checkoutForm = checkout.createForm({ layout: "expanded" });
  checkoutForm.mount(options.mountSelector ?? "#checkout-form");

  const loadActionsResult = await checkout.loadActions();
  if (loadActionsResult.type === "success") {
    checkoutForm.on("confirm", (event) => {
      void loadActionsResult.actions.confirm({ formConfirmEvent: event });
    });
  }

  return {
    destroy: () => {
      checkoutForm.unmount?.();
      checkout.destroy?.();
    },
  };
}
