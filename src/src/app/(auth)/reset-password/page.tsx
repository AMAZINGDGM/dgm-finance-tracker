import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell mode="reset-password">
      <ResetPasswordForm />
    </AuthShell>
  );
}
