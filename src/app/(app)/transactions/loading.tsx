import { ReceiptText } from "lucide-react";

import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function TransactionsLoading() {
  return (
    <div className="dashboard-enter space-y-5 pb-24 xl:pb-10">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-800/70 bg-slate-950/42 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.30),0_0_28px_rgba(34,211,238,0.04)] backdrop-blur-xl sm:p-6">
        <div className="dashboard-hero-grid" aria-hidden="true" />
        <div className="relative max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
            <ReceiptText className="h-3.5 w-3.5" aria-hidden="true" />
            Live Ledger
          </div>
          <LoadingSkeleton className="h-10 w-56" />
          <LoadingSkeleton className="mt-4 h-5 w-full max-w-3xl" />
        </div>
      </section>

      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <LoadingSkeleton className="h-11" />
          <LoadingSkeleton className="h-11" />
          <LoadingSkeleton className="h-11" />
        </div>
        <LoadingSkeleton className="h-72" />
      </Card>
    </div>
  );
}
