import type { ReactNode } from "react";

type UpdateUserPayload = {
  firstName?: string;
  unsafeMetadata?: Record<string, unknown>;
};

const demoUser = {
  id: "portfolio-user",
  firstName: "Maya",
  username: "maya",
  unsafeMetadata: {
    bio: "Designing healthier evening routines.",
  } as Record<string, unknown>,
  primaryEmailAddress: {
    emailAddress: "maya.portfolio@example.com",
  },
  async update(payload: UpdateUserPayload) {
    if ("firstName" in payload) {
      demoUser.firstName = payload.firstName ?? "";
    }
    if (payload.unsafeMetadata) {
      demoUser.unsafeMetadata = payload.unsafeMetadata;
    }
    return demoUser;
  },
};

export function ClerkProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function SignIn() {
  return null;
}

export function SignUp() {
  return null;
}

export function SignInButton({ children }: { children?: ReactNode }) {
  return <>{children ?? null}</>;
}

export function PricingTable() {
  return (
    <div className="rounded-xl border-2 border-foreground bg-white p-4 text-sm font-bold">
      Portfolio demo billing preview
    </div>
  );
}

export function UserProfile() {
  return (
    <div className="rounded-xl border-2 border-foreground bg-white p-4 text-sm font-bold">
      Seeded portfolio account: {demoUser.primaryEmailAddress.emailAddress}
    </div>
  );
}

export function Show({
  when,
  children,
}: {
  when: "signed-in" | "signed-out";
  children: ReactNode;
}) {
  return when === "signed-in" ? <>{children}</> : null;
}

export function useAuth() {
  return {
    isLoaded: true,
    isSignedIn: true,
    userId: demoUser.id,
    sessionId: "portfolio-demo-session",
    has: () => false,
    getToken: async () => "portfolio-demo-token",
  };
}

export function useUser() {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: demoUser,
  };
}

export function useClerk() {
  return {
    user: demoUser,
    signOut: async () => undefined,
    addListener: () => () => undefined,
  };
}
