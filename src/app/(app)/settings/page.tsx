"use client";

import {
  BellRing,
  CheckCircle2,
  DatabaseBackup,
  Languages,
  LockKeyhole,
  Palette,
  Repeat,
  ShieldCheck,
  UserRound,
  WalletCards
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CategoriesManager, type CategoryStats } from "@/components/finance/categories-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  defaultPreferences,
  readPreferencesFromStorage,
  savePreferencesToStorage,
  type DftLanguage,
  type DftPreferences
} from "@/lib/preferences";

const fieldLabelClass =
  "mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/95";
const controlClass =
  "h-12 rounded-2xl border-cyan-400/15 bg-[#050816]/78 px-4 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.035),0_12px_34px_rgba(0,0,0,0.18)] placeholder:text-slate-500/70 hover:border-cyan-300/28 hover:bg-slate-950/82 focus:border-cyan-300/55 focus:bg-[#050816]/90 focus:ring-accent-soft/20";

const settingsCopy = {
  en: {
    heroBadge: "Dgm Finance Tracker",
    title: "Settings",
    description:
      "Configure DFT preferences, categories, recurring plans, export tools, security, and workspace appearance from one polished control center.",
    chips: {
      currency: ["Currency", "IDR", "Rupiah first"],
      language: ["Language", "EN / ID", "English default"],
      theme: ["Theme", "Black Navy", "Dark command center"],
      categories: "Categories",
      categoryHelper: (income: number, expense: number) => `${income} income - ${expense} expense`,
      total: (total: number) => `${total} total`
    },
    preferences: {
      label: "Preferences",
      title: "Personal Defaults",
      description: "Core workspace behavior for DFT.",
      currency: "Currency",
      language: "Language",
      dateFormat: "Date Format",
      defaultView: "Default View",
      save: "Save preferences",
      saved: "Preferences saved.",
      currencyValue: "IDR - Indonesian Rupiah",
      english: "English",
      indonesian: "Indonesian",
      dashboard: "Dashboard",
      transactions: "Transactions",
      reports: "Reports"
    },
    overview: {
      label: "Workspace Signals",
      title: "Settings Overview",
      description: "Compact control status for your DFT workspace.",
      categories: (total: number) => `${total} categories`,
      income: "Income",
      expense: "Expense",
      mode: "Mode",
      premium: "Premium",
      labels: "labels",
      workspace: "workspace",
      checks: [
        "IDR-first money format",
        "Bilingual English/Indonesian UI",
        "Dark AI finance command center"
      ],
      workflowLabel: "Finance Workflow",
      workflow:
        "Preferences, categories, reports, and exports stay aligned across DFT."
    },
    modules: [
      {
        title: "Profile",
        label: "Identity",
        icon: UserRound,
        content: "Name, email, and avatar workspace controls for your personal finance profile."
      },
      {
        title: "Recurring Transactions",
        label: "Automation",
        icon: Repeat,
        content: "Prepare monthly allowances, subscriptions, weekly transport, and recurring bills."
      },
      {
        title: "Export Data",
        label: "Portability",
        icon: DatabaseBackup,
        content: "Export transactions, reports, and finance records into clean external files."
      },
      {
        title: "Security",
        label: "Protection",
        icon: LockKeyhole,
        content: "Password settings, account protection, logout, and delete-account warnings."
      },
      {
        title: "Theme",
        label: "Appearance",
        icon: Palette,
        content: "Black navy command-center styling with cyan, blue, and indigo accents."
      },
      {
        title: "Notifications",
        label: "Signals",
        icon: BellRing,
        content: "Future budget alerts, goal nudges, and recurring payment reminders."
      }
    ],
    ready: "Ready for build-out"
  },
  id: {
    heroBadge: "Dgm Finance Tracker",
    title: "Pengaturan",
    description:
      "Atur preferensi DFT, kategori, rencana berulang, ekspor, keamanan, dan tampilan workspace dari satu pusat kontrol.",
    chips: {
      currency: ["Mata Uang", "IDR", "Rupiah utama"],
      language: ["Bahasa", "EN / ID", "Indonesia aktif"],
      theme: ["Tema", "Black Navy", "Command center gelap"],
      categories: "Kategori",
      categoryHelper: (income: number, expense: number) => `${income} pemasukan - ${expense} pengeluaran`,
      total: (total: number) => `${total} total`
    },
    preferences: {
      label: "Preferensi",
      title: "Default Personal",
      description: "Perilaku utama workspace DFT.",
      currency: "Mata Uang",
      language: "Bahasa",
      dateFormat: "Format Tanggal",
      defaultView: "Tampilan Default",
      save: "Simpan preferensi",
      saved: "Preferensi tersimpan.",
      currencyValue: "IDR - Rupiah Indonesia",
      english: "Inggris",
      indonesian: "Indonesia",
      dashboard: "Dasbor",
      transactions: "Transaksi",
      reports: "Laporan"
    },
    overview: {
      label: "Sinyal Workspace",
      title: "Ringkasan Pengaturan",
      description: "Status ringkas untuk workspace DFT.",
      categories: (total: number) => `${total} kategori`,
      income: "Pemasukan",
      expense: "Pengeluaran",
      mode: "Mode",
      premium: "Premium",
      labels: "label",
      workspace: "workspace",
      checks: [
        "Format uang berbasis IDR",
        "UI dua bahasa Inggris/Indonesia",
        "Command center finansial AI gelap"
      ],
      workflowLabel: "Alur Finansial",
      workflow:
        "Preferensi, kategori, laporan, dan ekspor tetap selaras di seluruh DFT."
    },
    modules: [
      {
        title: "Profil",
        label: "Identitas",
        icon: UserRound,
        content: "Kontrol nama, email, dan avatar untuk profil finansial personal kamu."
      },
      {
        title: "Transaksi Berulang",
        label: "Otomasi",
        icon: Repeat,
        content: "Siapkan uang bulanan, langganan, transport mingguan, dan tagihan berulang."
      },
      {
        title: "Ekspor Data",
        label: "Portabilitas",
        icon: DatabaseBackup,
        content: "Ekspor transaksi, laporan, dan catatan finansial ke file eksternal yang rapi."
      },
      {
        title: "Keamanan",
        label: "Proteksi",
        icon: LockKeyhole,
        content: "Pengaturan password, proteksi akun, logout, dan peringatan hapus akun."
      },
      {
        title: "Tema",
        label: "Tampilan",
        icon: Palette,
        content: "Tampilan command-center black navy dengan aksen cyan, biru, dan indigo."
      },
      {
        title: "Notifikasi",
        label: "Sinyal",
        icon: BellRing,
        content: "Pengingat budget, tujuan, dan pembayaran berulang untuk pengembangan berikutnya."
      }
    ],
    ready: "Siap dikembangkan"
  }
} satisfies Record<DftLanguage, {
  heroBadge: string;
  title: string;
  description: string;
  chips: {
    currency: [string, string, string];
    language: [string, string, string];
    theme: [string, string, string];
    categories: string;
    categoryHelper: (income: number, expense: number) => string;
    total: (total: number) => string;
  };
  preferences: Record<string, string>;
  overview: {
    label: string;
    title: string;
    description: string;
    categories: (total: number) => string;
    income: string;
    expense: string;
    mode: string;
    premium: string;
    labels: string;
    workspace: string;
    checks: string[];
    workflowLabel: string;
    workflow: string;
  };
  modules: Array<{
    title: string;
    label: string;
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
    content: string;
  }>;
  ready: string;
}>;

function SettingsChip({
  helper,
  label,
  value
}: {
  helper: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-cyan-400/12 bg-slate-950/52 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
      <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
      <p className="truncate text-[11px] leading-4 text-muted">{helper}</p>
    </div>
  );
}

function ModuleCard({
  content,
  icon: Icon,
  label,
  readyLabel,
  title
}: {
  content: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  readyLabel: string;
  title: string;
}) {
  return (
    <Card className="group relative overflow-hidden rounded-[1.35rem] border-cyan-400/10 bg-[linear-gradient(145deg,rgba(2,6,23,0.72),rgba(15,23,42,0.42))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
      <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-cyan-300/6 blur-2xl" />
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/8 text-cyan-200 shadow-[0_0_26px_rgba(34,211,238,0.08)] transition group-hover:-translate-y-0.5 group-hover:border-cyan-300/30 group-hover:bg-cyan-300/11">
            <Icon className="h-4.5 w-4.5" aria-hidden />
          </div>
          <Badge tone="slate" className="rounded-xl bg-slate-950/58 text-[11px] text-slate-300">
            {readyLabel}
          </Badge>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-cyan-200/80">
            {label}
          </p>
          <h2 className="mt-1 text-base font-black tracking-tight text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{content}</p>
        </div>
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const [categoryStats, setCategoryStats] = useState<CategoryStats>({
    expense: 0,
    income: 0,
    total: 0
  });
  const [activePreferences, setActivePreferences] = useState<DftPreferences>(defaultPreferences);
  const [draftPreferences, setDraftPreferences] = useState<DftPreferences>(defaultPreferences);

  useEffect(() => {
    const storedPreferences = readPreferencesFromStorage();
    setActivePreferences(storedPreferences);
    setDraftPreferences(storedPreferences);
  }, []);

  const copy = settingsCopy[activePreferences.language];
  const draftCopy = settingsCopy[draftPreferences.language];

  function updateDraftPreference<Key extends keyof DftPreferences>(
    key: Key,
    value: DftPreferences[Key]
  ) {
    setDraftPreferences((current) => ({
      ...current,
      [key]: value
    }));
  }

  function savePreferences() {
    const savedPreferences = savePreferencesToStorage(draftPreferences);
    setActivePreferences(savedPreferences);
    setDraftPreferences(savedPreferences);
    toast.success(settingsCopy[savedPreferences.language].preferences.saved);
  }

  return (
    <div className="space-y-4 pb-10">
      <section className="relative overflow-hidden rounded-[1.35rem] border border-cyan-400/12 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(99,102,241,0.13),transparent_24%),linear-gradient(135deg,rgba(3,7,18,0.99),rgba(5,8,22,0.95)_54%,rgba(15,23,42,0.86))] p-4 shadow-[0_18px_58px_rgba(0,0,0,0.26),0_0_26px_rgba(34,211,238,0.04)] sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-24 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-44 w-44 rounded-full bg-indigo-500/8 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/32 to-transparent" />
        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.88fr)] lg:items-start">
          <div>
            <Badge tone="accent" className="rounded-xl uppercase tracking-[0.12em]">
              {copy.heroBadge}
            </Badge>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-[2.2rem]">
              {copy.title}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-300">
              {copy.description}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-4 lg:self-start">
            <SettingsChip
              helper={copy.chips.currency[2]}
              label={copy.chips.currency[0]}
              value={copy.chips.currency[1]}
            />
            <SettingsChip
              helper={copy.chips.language[2]}
              label={copy.chips.language[0]}
              value={copy.chips.language[1]}
            />
            <SettingsChip
              helper={copy.chips.theme[2]}
              label={copy.chips.theme[0]}
              value={copy.chips.theme[1]}
            />
            <SettingsChip
              helper={copy.chips.categoryHelper(categoryStats.income, categoryStats.expense)}
              label={copy.chips.categories}
              value={copy.chips.total(categoryStats.total)}
            />
          </div>
        </div>
      </section>

      <section className="grid items-start gap-3 xl:grid-cols-[390px_minmax(0,1fr)]">
        <Card className="relative overflow-hidden rounded-[1.35rem] border-cyan-400/12 bg-[linear-gradient(145deg,rgba(2,6,23,0.78),rgba(15,23,42,0.46))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
          <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-cyan-300/6 blur-3xl" />
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-cyan-400/10 bg-slate-950/42 p-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/8 text-cyan-200 shadow-[0_0_26px_rgba(34,211,238,0.08)]">
              <Languages className="h-4.5 w-4.5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-cyan-200/80">
                {copy.preferences.label}
              </p>
              <h2 className="text-lg font-black tracking-tight text-white">
                {copy.preferences.title}
              </h2>
              <p className="text-sm text-muted">{copy.preferences.description}</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block">
              <span className={fieldLabelClass}>{copy.preferences.currency}</span>
              <Input className={controlClass} value={copy.preferences.currencyValue} readOnly />
            </label>
            <label className="block">
              <span className={fieldLabelClass}>{copy.preferences.language}</span>
              <Select
                className={`${controlClass} appearance-none`}
                value={draftPreferences.language}
                onChange={(event) =>
                  updateDraftPreference("language", event.target.value === "id" ? "id" : "en")
                }
              >
                <option value="en">{draftCopy.preferences.english}</option>
                <option value="id">{draftCopy.preferences.indonesian}</option>
              </Select>
            </label>
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
              <label className="block">
                <span className={fieldLabelClass}>{copy.preferences.dateFormat}</span>
                <Select
                  className={`${controlClass} appearance-none`}
                  value={draftPreferences.dateFormat}
                  onChange={(event) => updateDraftPreference("dateFormat", event.target.value)}
                >
                  <option value="dd-mm-yyyy">DD/MM/YYYY</option>
                  <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                </Select>
              </label>
              <label className="block">
                <span className={fieldLabelClass}>{copy.preferences.defaultView}</span>
                <Select
                  className={`${controlClass} appearance-none`}
                  value={draftPreferences.defaultView}
                  onChange={(event) => updateDraftPreference("defaultView", event.target.value)}
                >
                  <option value="dashboard">{draftCopy.preferences.dashboard}</option>
                  <option value="transactions">{draftCopy.preferences.transactions}</option>
                  <option value="reports">{draftCopy.preferences.reports}</option>
                </Select>
              </label>
            </div>
          </div>

          <Button className="mt-3 w-full" type="button" onClick={savePreferences}>
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            {draftCopy.preferences.save}
          </Button>
        </Card>

        <Card className="relative overflow-hidden self-start rounded-[1.35rem] border-cyan-400/12 bg-[linear-gradient(145deg,rgba(2,6,23,0.76),rgba(15,23,42,0.42))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-indigo-500/7 blur-3xl" />
          <div className="rounded-2xl border border-cyan-400/10 bg-slate-950/42 p-2.5">
            <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/8 text-cyan-200 shadow-[0_0_26px_rgba(34,211,238,0.08)]">
                  <WalletCards className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-cyan-200/80">
                    {copy.overview.label}
                  </p>
                  <h2 className="text-lg font-black tracking-tight text-white">
                    {copy.overview.title}
                  </h2>
                  <p className="text-sm text-muted">{copy.overview.description}</p>
                </div>
              </div>
              <Badge tone="accent" className="w-fit">
                {copy.overview.categories(categoryStats.total)}
              </Badge>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                {
                  label: copy.overview.income,
                  value: categoryStats.income,
                  tone: "text-green-300",
                  helper: copy.overview.labels
                },
                {
                  label: copy.overview.expense,
                  value: categoryStats.expense,
                  tone: "text-expense",
                  helper: copy.overview.labels
                },
                {
                  label: copy.overview.mode,
                  value: copy.overview.premium,
                  tone: "text-cyan-100",
                  helper: copy.overview.workspace
                }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-cyan-400/10 bg-slate-950/50 p-2.5"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {item.label}
                  </p>
                  <p className={`mt-1 text-base font-black tracking-tight ${item.tone}`}>
                    {item.value}
                  </p>
                  <p className="text-[11px] text-muted">{item.helper}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 grid gap-2 lg:grid-cols-[minmax(0,1fr)_230px]">
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {copy.overview.checks.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-2"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-200" aria-hidden="true" />
                  <span className="text-xs font-semibold leading-5 text-slate-300">{item}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-indigo-400/12 bg-indigo-400/5 p-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-200/90">
                {copy.overview.workflowLabel}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">{copy.overview.workflow}</p>
            </div>
          </div>
        </Card>
      </section>

      <CategoriesManager language={activePreferences.language} onStatsChange={setCategoryStats} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {copy.modules.map((section) => (
          <ModuleCard key={section.title} {...section} readyLabel={copy.ready} />
        ))}
      </section>
    </div>
  );
}
