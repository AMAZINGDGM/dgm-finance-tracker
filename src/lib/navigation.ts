export type NavItem = {
  id?: string;
  label: string;
  href: string;
  icon: string;
};

export type NavigationLanguage = "en" | "id";

export const mainNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "AI Assistant", href: "/ai-assistant", icon: "Sparkles" },
  { label: "Transactions", href: "/transactions", icon: "ArrowLeftRight" },
  { label: "Accounts", href: "/accounts", icon: "WalletCards" },
  { label: "Budgets", href: "/budgets", icon: "Gauge" },
  { label: "Goals", href: "/goals", icon: "Target" },
  { label: "Reports", href: "/reports", icon: "FileText" },
  { label: "Calendar", href: "/calendar", icon: "CalendarDays" },
  { label: "Settings", href: "/settings", icon: "Settings" }
];

export const topNavigation: NavItem[] = mainNavigation.filter(
  (item) => item.href !== "/ai-assistant"
);

export const topPrimaryNavigation: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { id: "transactions", label: "Transactions", href: "/transactions", icon: "ArrowLeftRight" },
  { id: "accounts", label: "Accounts", href: "/accounts", icon: "WalletCards" },
  { id: "reports", label: "Reports", href: "/reports", icon: "FileText" }
];

export const topMoreNavigation: NavItem[] = [
  { id: "budgets", label: "Budgets", href: "/budgets", icon: "Gauge" },
  { id: "goals", label: "Goals", href: "/goals", icon: "Target" },
  { id: "calendar", label: "Calendar", href: "/calendar", icon: "CalendarDays" },
  { id: "ai-assistant", label: "AI Assistant", href: "/ai-assistant", icon: "Sparkles" },
  { id: "settings", label: "Settings", href: "/settings", icon: "Settings" }
];

export const businessTopPrimaryNavigation: NavItem[] = [
  { id: "business-dashboard", label: "Business Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { id: "business-transactions", label: "Sales & Expenses", href: "/transactions", icon: "ArrowLeftRight" },
  { id: "business-inventory", label: "Inventory", href: "/inventory", icon: "Package" },
  { id: "business-reports", label: "Reports", href: "/reports", icon: "FileText" }
];

export const businessTopMoreNavigation: NavItem[] = [
  { id: "business-capital", label: "Capital", href: "/capital", icon: "WalletCards" },
  { id: "business-accounts", label: "Accounts", href: "/accounts", icon: "WalletCards" },
  { id: "business-ai-assistant", label: "AI Assistant", href: "/ai-assistant", icon: "Sparkles" },
  { id: "business-settings", label: "Settings", href: "/settings", icon: "Settings" }
];

export const businessTopNavigation: NavItem[] = [
  ...businessTopPrimaryNavigation,
  ...businessTopMoreNavigation
];

export const mobileNavigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Add", href: "/transactions", icon: "CirclePlus" },
  { label: "Budgets", href: "/budgets", icon: "Gauge" },
  { label: "Reports", href: "/reports", icon: "FileText" },
  { label: "Settings", href: "/settings", icon: "Settings" }
];

const navigationLabels: Record<NavigationLanguage, Record<string, string>> = {
  en: {
    "/accounts": "Accounts",
    "ai-assistant": "AI Assistant",
    "/ai-assistant": "AI Assistant",
    "/budgets": "Budgets",
    "/calendar": "Calendar",
    "/dashboard": "Dashboard",
    "/goals": "Goals",
    "/reports": "Reports",
    "/settings": "Settings",
    "/transactions": "Transactions",
    "business-ai-assistant": "AI Assistant",
    "business-accounts": "Accounts",
    "business-capital": "Capital",
    "business-dashboard": "Business Dashboard",
    "business-inventory": "Inventory",
    "business-reports": "Reports",
    "business-settings": "Settings",
    "business-transactions": "Sales & Expenses",
    "mobile-add": "Add"
  },
  id: {
    "/accounts": "Akun",
    "ai-assistant": "Asisten AI",
    "/ai-assistant": "Asisten AI",
    "/budgets": "Anggaran",
    "/calendar": "Kalender",
    "/dashboard": "Dasbor",
    "/goals": "Tujuan",
    "/reports": "Laporan",
    "/settings": "Pengaturan",
    "/transactions": "Transaksi",
    "business-ai-assistant": "Asisten AI",
    "business-accounts": "Akun",
    "business-capital": "Modal",
    "business-dashboard": "Dasbor Bisnis",
    "business-inventory": "Inventaris",
    "business-reports": "Laporan",
    "business-settings": "Pengaturan",
    "business-transactions": "Penjualan & Pengeluaran",
    "mobile-add": "Tambah"
  }
};

export function localizeNavigationItems(
  items: NavItem[],
  language: NavigationLanguage,
  mode: "business" | "personal" = "personal"
) {
  return items.map((item) => {
    const key =
      item.label === "Add"
        ? "mobile-add"
        : mode === "business"
          ? item.id ?? `business-${item.href}`
          : item.id ?? item.href;

    return {
      ...item,
      label: navigationLabels[language][key] ?? item.label
    };
  });
}
