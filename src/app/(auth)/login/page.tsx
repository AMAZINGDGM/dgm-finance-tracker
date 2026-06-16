import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function LoginPage() {
  return (
    <AuthShell mode="login">
      <Suspense fallback={<LoadingSkeleton className="h-80" />}>
        <AuthForm mode="login" />
      </Suspense>
    </AuthShell>
  );
}
