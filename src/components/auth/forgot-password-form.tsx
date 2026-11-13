"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/config/public";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const configured = isSupabaseConfigured();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast.error("Supabase is not configured. Please try again later.");
      return;
    }

    setIsSubmitting(true);
    try {
      const redirectTo = new URL("/auth/callback?next=/reset-password", window.location.origin);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectTo.toString()
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success("Password reset instructions have been requested.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the reset email.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {!configured ? (
        <div className="rounded-2xl border border-warning/35 bg-warning/10 p-4 text-sm leading-6 text-amber-100">
          Supabase is not connected yet. Add your Supabase credentials to
          <span className="font-semibold"> .env.local</span> and restart the dev server.
        </div>
      ) : null}

      {emailSent ? (
        <div className="space-y-5" role="status" aria-live="polite">
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-300/15 text-emerald-200">
              <Mail className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-white">Check your inbox</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              If an account exists for <span className="font-semibold text-white">{email}</span>,
              we have sent a password reset link. Check your inbox and spam folder.
            </p>
          </div>
          <Button className="w-full" variant="secondary" onClick={() => setEmailSent(false)}>
            Try another email
          </Button>
          <Link
            className="flex items-center justify-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-white"
            href="/login"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to login
          </Link>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <p className="text-sm leading-6 text-slate-300">
            Enter the email address connected to your DFT account. We will send you a secure
            link to create a new password.
          </p>

          <label className="block">
            <span className="auth-form-label mb-2 block text-sm font-medium">Email</span>
            <span className="relative block">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <Input
                className="h-12 border-cyan-300/15 bg-slate-950/70 pl-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-cyan-300/70"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </span>
          </label>

          <Button
            className="auth-submit-button w-full shadow-[0_18px_50px_rgba(34,211,238,0.22)]"
            type="submit"
            size="lg"
            disabled={!configured || isSubmitting}
          >
            {isSubmitting ? "Sending link..." : "Send reset link"}
          </Button>

          <div className="flex items-start gap-2 rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-3 text-xs leading-5 text-slate-400">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />
            For account privacy, this page does not reveal whether an email address is registered.
          </div>

          <Link
            className="flex items-center justify-center gap-2 text-sm font-semibold text-cyan-200 transition hover:text-white"
            href="/login"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to login
          </Link>
        </form>
      )}
    </div>
  );
}
