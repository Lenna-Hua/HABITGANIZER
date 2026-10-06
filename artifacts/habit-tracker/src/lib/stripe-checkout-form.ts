/** Stripe.js dahlia build globals (loaded from https://js.stripe.com/dahlia/stripe.js). */

export const STRIPE_CHECKOUT_APPEARANCE = {
  theme: "stripe",
  labels: "auto",
  inputs: "spaced",
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

export async function mountStripeCheckoutForm(options: {
  publishableKey: string;
  clientSecret: string | Promise<string>;
  mountSelector: string;
}): Promise<MountedCheckoutForm> {
  if (typeof window.Stripe !== "function") {
    throw new Error("Stripe.js failed to load. Check the dahlia script in index.html.");
  }

  const stripe = window.Stripe(options.publishableKey, {
    betas: ["custom_checkout_payment_form_1"],
  });

  const checkout = stripe.initCheckoutFormSdk({
    clientSecret: options.clientSecret,
    appearance: STRIPE_CHECKOUT_APPEARANCE,
  });

  const form = checkout.createForm({ layout: "expanded" });
  form.mount(options.mountSelector);

  const loadActionsResult = await checkout.loadActions();
  if (loadActionsResult.type === "success") {
    form.on("confirm", async (event) => {
      try {
        await loadActionsResult.actions.confirm({ formConfirmEvent: event });
      } catch (error) {
        console.error("Payment confirmation error:", error);
        throw error;
      }
    });
  }

  return {
    destroy: () => {
      form.unmount?.();
      checkout.destroy?.();
    },
  };
}
