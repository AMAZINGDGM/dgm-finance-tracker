import { WalletCards } from "lucide-react";

import { AccountsManager } from "@/components/finance/accounts-manager";

export default function AccountsPage() {
  return (
    <div className="dashboard-enter space-y-5 pb-24 xl:pb-10">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-800/70 bg-slate-950/42 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.30),0_0_28px_rgba(34,211,238,0.04)] backdrop-blur-xl sm:p-6">
        <div className="dashboard-hero-grid" aria-hidden="true" />
        <div className="dashboard-hero-glow dashboard-hero-glow-one" aria-hidden="true" />
        <div className="relative max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
            <WalletCards className="h-3.5 w-3.5" aria-hidden="true" />
            Live Ledger
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Accounts
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            Track Cash, BCA, GoPay, OVO, Dana, savings, business, investment, and other balances.
          </p>
        </div>
      </section>
      <AccountsManager />
    </div>
  );
}
