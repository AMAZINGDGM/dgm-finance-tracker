import { Suspense } from "react";

import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function RegisterPage() {
  return (
    <AuthShell mode="register">
      <Suspense fallback={<LoadingSkeleton className="h-96" />}>
        <AuthForm mode="register" />
      </Suspense>
    </AuthShell>
  );
}
