import {
  BrainCircuit,
  ChartNoAxesCombined,
  LockKeyhole,
  ShieldCheck
} from "lucide-react";

import { DftLogo } from "@/components/brand/dft-logo";

type AuthShellProps = {
  children: React.ReactNode;
  mode: "login" | "register";
};

const topStream = [
  "AI Finance",
  "Smart Reports",
  "Budget Control",
  "Secure Workspace",
  "Goals Tracking",
  "Rupiah First"
];

const bottomStream = [
  "cashflow sync",
  "budget signal",
  "goal velocity",
  "risk scan",
  "report engine",
  "secure ledger"
];

export function AuthShell({ children, mode }: AuthShellProps) {
  const isLogin = mode === "login";
  const cardTitle = isLogin ? "Access DFT" : "Create Your DFT Account";
  const cardSubtitle = isLogin
    ? "Sign in to continue your finance command session."
    : "Create your secure Dgm Finance Tracker workspace.";
  const features = [
    { icon: BrainCircuit, label: "AI Finance Assistant" },
    { icon: ChartNoAxesCombined, label: "Smart Monthly Reports" },
    { icon: ShieldCheck, label: "Secure RLS Protection" }
  ];

  return (
    <div className="auth-shell-enter flex min-h-[calc(100vh-3rem)] w-full flex-col items-center justify-between gap-6 py-5 text-center sm:py-6">
      <div className="auth-slide-strip auth-slide-strip-top">
        <div className="auth-slide-track">
          {[...topStream, ...topStream].map((item, index) => (
            <span className="auth-slide-chip" key={`${item}-${index}`}>
              {item}
            </span>
          ))}
        </div>
      </div>

      <section className="relative flex w-full flex-col items-center overflow-visible pt-4 sm:pt-6">
        <div className="auth-beam auth-beam-one" aria-hidden="true" />
        <div className="auth-beam auth-beam-two" aria-hidden="true" />

        <div className="auth-card-rise flex flex-col items-center">
          <DftLogo size="lg" />
          <p className="auth-kicker mt-4 text-xs font-semibold uppercase tracking-[0.45em] text-cyan-100/80">
            Dgm Finance Tracker
          </p>
        </div>

        <h1 className="auth-headline-shimmer mt-7 max-w-5xl overflow-visible pb-3 pt-1 text-4xl font-black leading-[1.1] text-white sm:text-6xl lg:text-[4rem] xl:text-[5.25rem]">
          Command Your Wealth With Intelligence
        </h1>
        <p className="auth-subtitle auth-card-rise auth-card-delay mt-6 max-w-3xl text-base leading-7 sm:text-lg">
          Track your cash, banks, e-wallets, budgets, goals, and AI-assisted transactions
          in one intelligent finance command center.
        </p>

        <div className="auth-card-rise auth-card-delay mt-6 flex w-full max-w-3xl flex-col items-center justify-center gap-3 sm:flex-row">
          {features.map((item, index) => (
            <div
              key={item.label}
              className="auth-feature-badge flex w-full items-center justify-center gap-2 rounded-full border border-cyan-300/15 bg-slate-950/55 px-4 py-3 text-sm font-semibold text-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:w-auto"
              style={{ animationDelay: `${index * 140}ms` }}
            >
              <item.icon className="h-4 w-4 text-accent-soft" aria-hidden="true" />
              {item.label}
            </div>
          ))}
        </div>
      </section>

      <section className="auth-login-card auth-card-rise auth-card-delay relative w-full max-w-md overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-slate-950/62 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.58),0_0_60px_rgba(34,211,238,0.11)] backdrop-blur-2xl sm:p-7">
        <div
          className="auth-card-border-glow absolute inset-0 rounded-[2rem]"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="mb-6 text-center">
            <DftLogo className="mb-4 justify-center" size="xs" />
            <h2 className="auth-card-title text-2xl font-bold text-white sm:text-3xl">
              {cardTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{cardSubtitle}</p>
          </div>
          {children}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4 text-xs leading-5 text-slate-300">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />
            <p>Protected by Supabase Auth and Row Level Security.</p>
          </div>
        </div>
      </section>

      <div className="auth-slide-strip auth-slide-strip-bottom">
        <div className="auth-slide-track auth-slide-track-reverse">
          {[...bottomStream, ...bottomStream].map((item, index) => (
            <span className="auth-data-chip" key={`${item}-${index}`}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
