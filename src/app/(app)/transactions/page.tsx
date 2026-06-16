import { ReceiptText } from "lucide-react";
import { cookies } from "next/headers";

import { TransactionsManager } from "@/components/finance/transactions-manager";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabase/server";
import {
  activeWorkspaceCookieName,
  getUserWorkspaces,
  pickActiveWorkspace
} from "@/lib/workspaces";

async function getIsBusinessWorkspace() {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return false;
  }

  const workspaces = await getUserWorkspaces(supabase, user.id);
  const cookieStore = await cookies();
  const activeWorkspace = pickActiveWorkspace(
    workspaces,
    cookieStore.get(activeWorkspaceCookieName)?.value
  );

  return activeWorkspace?.type === "business";
}

export default async function TransactionsPage() {
  const isBusinessWorkspace = await getIsBusinessWorkspace();
  const title = isBusinessWorkspace ? "Sales & Expenses" : "Transactions";
  const description = isBusinessWorkspace
    ? "Track business sales, operating expenses, transfers, and ledger movement in one clean workspace."
    : "Add, edit, filter, and review every income, expense, and transfer in a cleaner IDR-first finance workspace.";

  return (
    <div className="dashboard-enter space-y-5 pb-24 xl:pb-10">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-800/70 bg-slate-950/42 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.30),0_0_28px_rgba(34,211,238,0.04)] backdrop-blur-xl sm:p-6">
        <div className="dashboard-hero-grid" aria-hidden="true" />
        <div className="relative max-w-4xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">
            <ReceiptText className="h-3.5 w-3.5" aria-hidden="true" />
            Live Ledger
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            {description}
          </p>
        </div>
      </section>
      <TransactionsManager />
    </div>
  );
}
