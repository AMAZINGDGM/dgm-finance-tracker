"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/config/public";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let isActive = true;

    if (!supabase) {
      setIsCheckingSession(false);
      return () => {
        isActive = false;
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      if (isActive) {
        setHasSession(Boolean(data.session));
        setIsCheckingSession(false);
      }
    }).catch(() => {
      if (isActive) setIsCheckingSession(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isActive && session) {
        setHasSession(true);
        setIsCheckingSession(false);
      }
    });

    return () => {
      isActive = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("The passwords do not match.");
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      toast.error("Supabase is not configured. Please try again later.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        toast.success("Your password has been updated successfully.");
        router.replace("/dashboard");
      } else {
        toast.success("Password updated. Please sign in with your new password.");
        router.replace("/login");
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {!configured ? (
        <div className="rounded-2xl border border-warning/35 bg-warning/10 p-4 text-sm leading-6 text-amber-100">
          Supabase is not connected. Please contact your administrator.
        </div>
      ) : isCheckingSession ? (
        <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4 text-center text-sm text-slate-300">
          Verifying your password reset link...
        </div>
      ) : !hasSession ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100" role="alert">
            This password reset link is invalid or has expired. Request a new link to continue.
          </div>
          <Button className="w-full" onClick={() => router.push("/forgot-password")}>
            Request a new reset link
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
          <label className="block">
            <span className="auth-form-label mb-2 block text-sm font-medium">New password</span>
            <span className="relative block">
              <LockKeyhole
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <Input
                className="h-12 border-cyan-300/15 bg-slate-950/70 pl-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-cyan-300/70"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </span>
          </label>

          <label className="block">
            <span className="auth-form-label mb-2 block text-sm font-medium">Confirm new password</span>
            <span className="relative block">
              <LockKeyhole
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <Input
                className="h-12 border-cyan-300/15 bg-slate-950/70 pl-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-cyan-300/70"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </span>
          </label>

          <Button
            className="auth-submit-button w-full shadow-[0_18px_50px_rgba(34,211,238,0.22)]"
            type="submit"
            size="lg"
            disabled={isSubmitting || !configured}
          >
            {isSubmitting ? "Updating password..." : "Update password"}
          </Button>
        </form>
      )}
    </div>
  );
}
