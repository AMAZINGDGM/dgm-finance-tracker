"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Mail, UserRound } from "lucide-react";
import { toast } from "sonner";

import { DftLogo } from "@/components/brand/dft-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured } from "@/lib/config/public";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const configured = isSupabaseConfigured();

  async function playSuccessEffect() {
    setShowSuccess(true);
    await new Promise((resolve) => setTimeout(resolve, 950));
    setShowSuccess(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      toast.error("Add Supabase credentials to .env.local first.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          throw error;
        }

        await playSuccessEffect();
        toast.success("Logged in successfully.");
        router.replace(next);
        router.refresh();
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/setup`
        }
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        await playSuccessEffect();
        toast.success("Account created. Let's prepare your finance workspace.");
        router.replace("/setup");
        router.refresh();
      } else {
        await playSuccessEffect();
        toast.success("Check your email to confirm your DFT account.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="relative space-y-4" onSubmit={handleSubmit}>
      {showSuccess ? (
        <div className="auth-success-overlay" role="status" aria-live="polite">
          <div className="auth-success-core">
            <DftLogo size="md" />
            <p>Welcome to DFT.</p>
          </div>
        </div>
      ) : null}

      {!configured ? (
        <div className="rounded-2xl border border-warning/35 bg-warning/10 p-4 text-sm leading-6 text-amber-100">
          Supabase is not connected yet. Add values from your Supabase project to
          <span className="font-semibold"> .env.local</span>, then restart the dev server.
        </div>
      ) : null}

      {mode === "register" ? (
        <label className="block">
          <span className="auth-form-label mb-2 block text-sm font-medium">Full name</span>
          <span className="relative block">
            <UserRound
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <Input
              className="h-12 border-cyan-300/15 bg-slate-950/70 pl-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-cyan-300/70"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Dgm"
              required
            />
          </span>
        </label>
      ) : null}

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

      <label className="block">
        <span className="auth-form-label mb-2 block text-sm font-medium">Password</span>
        <span className="relative block">
          <button
            type="button"
            suppressHydrationWarning
            className="absolute left-2.5 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-cyan-100/80 transition duration-200 hover:bg-cyan-300/10 hover:text-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-300/45"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <Input
            className="h-12 border-cyan-300/15 bg-slate-950/70 pl-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-cyan-300/70"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 6 characters"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            required
          />
        </span>
      </label>

      <Button
        className="auth-submit-button mt-2 w-full shadow-[0_18px_50px_rgba(34,211,238,0.22)]"
        type="submit"
        size="lg"
        disabled={!configured || isSubmitting}
      >
        {isSubmitting
          ? "Please wait..."
          : mode === "login"
            ? "Login to DFT"
            : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? "New to DFT?" : "Already have an account?"}{" "}
        <Link
          className="font-semibold text-accent-soft hover:text-cyan-100"
          href={mode === "login" ? "/register" : "/login"}
        >
          {mode === "login" ? "Create an account" : "Login"}
        </Link>
      </p>
    </form>
  );
}
