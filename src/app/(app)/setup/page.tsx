import { DefaultSetupCard } from "@/components/setup/default-setup-card";
import { PageHeader } from "@/components/page/page-header";
import { defaultAccounts, defaultCategories } from "@/lib/finance/defaults";

export default function SetupPage() {
  return (
    <div>
      <PageHeader
        title="Workspace Setup"
        description="Create the default DFT profile data, accounts, and categories for a new finance workspace."
        badge="First Run"
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <DefaultSetupCard />
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-base font-semibold text-white">Default data</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-300">Accounts</p>
              <p className="mt-2 text-sm text-muted">
                {defaultAccounts.map((account) => account.name).join(", ")}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">Categories</p>
              <p className="mt-2 text-sm text-muted">
                {defaultCategories.map((category) => category.name).join(", ")}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
