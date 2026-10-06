import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mountStripeCheckoutForm, type MountedCheckoutForm } from "@/lib/stripe-checkout-form";

const CHECKOUT_MOUNT_ID = "checkout-form";

type StripeCheckoutDialogProps = {
  open: boolean;
  title: string;
  /** Resolves to a Checkout Session client_secret from the API. */
  clientSecret: string | null;
  onOpenChange: (open: boolean) => void;
};

export function StripeCheckoutDialog({
  open,
  title,
  clientSecret,
  onOpenChange,
}: StripeCheckoutDialogProps) {
  const mountedRef = useRef<MountedCheckoutForm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open || !clientSecret) return;

    let cancelled = false;
    setError(null);
    setReady(false);

    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();
    if (!publishableKey) {
      setError("Missing VITE_STRIPE_PUBLISHABLE_KEY");
      return;
    }

    void (async () => {
      try {
        // Ensure the mount node exists before Stripe mounts the iframe.
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        if (cancelled) return;
        mountedRef.current?.destroy();
        mountedRef.current = await mountStripeCheckoutForm({
          publishableKey,
          clientSecret,
          mountSelector: `#${CHECKOUT_MOUNT_ID}`,
        });
        if (!cancelled) setReady(true);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load checkout");
        }
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current?.destroy();
      mountedRef.current = null;
    };
  }, [open, clientSecret]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          !ready && <p className="text-sm text-muted-foreground">Loading secure checkout…</p>
        )}
        <div id={CHECKOUT_MOUNT_ID} />
      </DialogContent>
    </Dialog>
  );
}
