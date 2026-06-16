import type { ParsedTransaction, TransactionType } from "@/types/finance";

export type ParserAccount = {
  id?: string;
  name: string;
};

export type ParserCategory = {
  id?: string;
  name: string;
  type: "income" | "expense";
};

export type ParserContext = {
  accounts?: ParserAccount[];
  categories?: ParserCategory[];
  now?: Date;
  workspaceType?: "business" | "personal";
};

const fallbackCategories: ParserCategory[] = [
  { name: "Allowance", type: "income" },
  { name: "Salary", type: "income" },
  { name: "Freelance", type: "income" },
  { name: "Business", type: "income" },
  { name: "Other Income", type: "income" },
  { name: "Food & Drinks", type: "expense" },
  { name: "Transport", type: "expense" },
  { name: "Shopping", type: "expense" },
  { name: "Bills", type: "expense" },
  { name: "Subscription", type: "expense" },
  { name: "Other Expense", type: "expense" }
];

const fallbackAccounts: ParserAccount[] = [
  { name: "Cash" },
  { name: "BCA" },
  { name: "GoPay" },
  { name: "Savings" }
];

const categoryKeywords = [
  {
    category: "Food & Drinks",
    keywords: ["lunch", "dinner", "breakfast", "coffee", "kopi", "makan", "gofood", "food", "snack", "jajan"]
  },
  { category: "Transport", keywords: ["transport", "grab", "gojek", "bensin", "parkir", "taxi", "ojek", "tol"] },
  { category: "Shopping", keywords: ["shopping", "belanja", "shopee", "tokopedia", "mall", "baju"] },
  { category: "Education", keywords: ["education", "school", "course", "kelas", "kuliah", "buku"] },
  { category: "Entertainment", keywords: ["movie", "cinema", "game", "entertainment", "nonton"] },
  { category: "Bills", keywords: ["bill", "tagihan", "listrik", "phone", "pulsa", "internet", "air", "pln"] },
  { category: "Health", keywords: ["health", "doctor", "obat", "dokter", "rumah sakit", "vitamin"] },
  { category: "Subscription", keywords: ["subscription", "netflix", "spotify", "langganan", "icloud"] },
  { category: "Freelance", keywords: ["freelance", "client", "project", "proyek"] },
  { category: "Salary", keywords: ["salary", "gaji", "paycheck"] },
  { category: "Business", keywords: ["jual", "business", "bisnis", "parfum", "jualan", "profit"] },
  { category: "Gift", keywords: ["gift", "hadiah", "bonus"] },
  { category: "Investment", keywords: ["investment", "dividend", "dividen", "saham"] }
];

const businessCategoryKeywords = [
  { category: "Sales Revenue", keywords: ["shopee sale", "sale", "sales", "jualan", "jual", "terjual", "revenue"] },
  { category: "Owner Capital In", keywords: ["capital entry", "owner capital", "modal", "setor modal", "capital in"] },
  { category: "Inventory Purchase", keywords: ["stock", "stok", "inventory", "parfum", "beli barang", "barang jualan"] },
  { category: "Packaging", keywords: ["packaging", "packing", "bubble wrap", "box", "dus"] },
  { category: "Shipping", keywords: ["shipping", "ongkir", "kirim", "kurir"] },
  { category: "Ads/Promotion", keywords: ["ads", "iklan", "promotion", "promo"] },
  { category: "Shopee Fee", keywords: ["shopee fee", "admin fee", "biaya admin", "fee shopee"] },
  { category: "Refund/Cashback", keywords: ["refund", "cashback"] },
  { category: "Owner Withdrawal", keywords: ["withdraw", "withdrawal", "tarik", "profit to personal", "ke gopay pribadi"] },
  { category: "Reimbursement", keywords: ["reimbursement", "paid me back", "bayar balik", "diganti"] }
];

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s.-]/gu, " ").replace(/\s+/g, " ").trim();
}

function parseNumericValue(raw: string, hasSuffix: boolean) {
  const normalized = raw.trim();

  if (hasSuffix) {
    return Number(normalized.replace(",", "."));
  }

  if (/^\d{1,3}([.,]\d{3})+$/.test(normalized)) {
    return Number(normalized.replace(/[.,]/g, ""));
  }

  return Number(normalized.replace(",", "."));
}

function parseAmount(message: string) {
  const normalized = normalizeText(message);
  const match = normalized.match(/(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(juta|jt|million|rb|ribu|k)?/i);

  if (!match) {
    return null;
  }

  const suffix = match[2]?.toLowerCase();
  const value = parseNumericValue(match[1], Boolean(suffix));

  if (Number.isNaN(value)) {
    return null;
  }

  if (suffix === "juta" || suffix === "jt" || suffix === "million") {
    return Math.round(value * 1_000_000);
  }

  if (suffix === "rb" || suffix === "ribu" || suffix === "k") {
    return Math.round(value * 1_000);
  }

  return Math.round(value);
}

function detectType(message: string): TransactionType {
  const lower = normalizeText(message);

  if (/(transfer|move|pindah|kirim|top up|topup|isi saldo|saldo)/.test(lower)) {
    return "transfer";
  }

  if (/(income|salary|gaji|freelance|pemasukan|masuk|dapat|terima|jual|jualan|paid me|bayaran|bonus)/.test(lower)) {
    return "income";
  }

  return "expense";
}

function detectBusinessType(message: string): TransactionType {
  const lower = normalizeText(message);

  if (/(transfer|pindah|kirim|to seabank|ke seabank|seller balance to|dari shopee seller)/.test(lower)) {
    return "transfer";
  }

  if (/(sale|sales|jualan|jual|revenue|refund received|modal|capital in|owner capital|setor modal)/.test(lower)) {
    return "income";
  }

  return "expense";
}

function detectDate(message: string, now = new Date()) {
  const lower = normalizeText(message);
  const date = new Date(now);

  if (/(yesterday|kemarin|last night|tadi malam)/.test(lower)) {
    date.setDate(date.getDate() - 1);
    return toIsoDate(date);
  }

  return toIsoDate(date);
}

function detectLanguage(message: string): ParsedTransaction["languageDetected"] {
  const lower = normalizeText(message);
  const hasIndonesian = /(aku|saya|buat|makan|keluar|tambah|pemasukan|pengeluaran|kemarin|hari ini|tadi|rb|ribu|juta|gaji|belanja|bayar)/.test(lower);
  const hasEnglish = /(spent|add|income|expense|salary|lunch|today|yesterday|paid|transfer|saving|freelance)/.test(lower);

  if (hasIndonesian && hasEnglish) {
    return "mixed";
  }

  return hasIndonesian ? "id" : "en";
}

function pickByKeyword<T extends { keywords: string[] }>(items: T[], message: string) {
  const lower = normalizeText(message);
  return items.find((item) => item.keywords.some((keyword) => lower.includes(keyword)));
}

function findByName<T extends { name: string }>(items: T[], name?: string | null) {
  if (!name) {
    return undefined;
  }

  const normalizedName = normalizeText(name);
  return items.find((item) => normalizeText(item.name) === normalizedName);
}

function findAccountByMessage(accounts: ParserAccount[], message: string) {
  const lower = normalizeText(message);
  const direct = accounts.find((account) => lower.includes(normalizeText(account.name)));

  if (direct) {
    return direct;
  }

  const aliases = [
    { name: "Cash", keywords: ["cash", "tunai"] },
    { name: "BCA", keywords: ["bca"] },
    { name: "GoPay", keywords: ["gopay", "gojek"] },
    { name: "OVO", keywords: ["ovo"] },
    { name: "Dana", keywords: ["dana"] },
    { name: "Savings", keywords: ["saving", "savings", "tabungan"] }
  ];
  const alias = pickByKeyword(aliases, message);

  return findByName(accounts, alias?.name);
}

function detectTransferAccounts(accounts: ParserAccount[], message: string) {
  const lower = normalizeText(message);
  const matched = accounts.filter((account) => lower.includes(normalizeText(account.name)));

  if (matched.length >= 2) {
    return { from: matched[0], to: matched[1] };
  }

  const fromMatch = lower.match(/(?:from|dari)\s+([\p{L}\p{N}\s-]+?)(?:\s+(?:to|ke|menuju)\s+|$)/u);
  const toMatch = lower.match(/(?:to|ke|menuju)\s+([\p{L}\p{N}\s-]+)/u);

  return {
    from: findAccountByMessage(accounts, fromMatch?.[1] ?? ""),
    to: findAccountByMessage(accounts, toMatch?.[1] ?? "")
  };
}

function findCategory(categories: ParserCategory[], type: TransactionType, message: string) {
  if (type === "transfer") {
    return undefined;
  }

  const allowed = categories.filter((category) => category.type === type);
  const lower = normalizeText(message);
  const direct = allowed.find((category) => lower.includes(normalizeText(category.name)));

  if (direct) {
    return direct;
  }

  const keywordMatch = pickByKeyword(categoryKeywords, message);
  const byKeyword = findByName(allowed, keywordMatch?.category);

  if (byKeyword) {
    return byKeyword;
  }

  return (
    findByName(allowed, type === "income" ? "Other Income" : "Other Expense") ??
    allowed[0]
  );
}

function findBusinessCategory(categories: ParserCategory[], type: TransactionType, message: string) {
  if (type === "transfer") {
    return undefined;
  }

  const allowed = categories.filter((category) => category.type === type);
  const keywordMatch = pickByKeyword(businessCategoryKeywords, message);
  const byKeyword = findByName(allowed, keywordMatch?.category);

  if (byKeyword) {
    return byKeyword;
  }

  return (
    findByName(allowed, type === "income" ? "Sales Revenue" : "Other Business Expense") ??
    findCategory(categories, type, message)
  );
}

export function parseFinanceMessage(message: string, context: ParserContext = {}): ParsedTransaction {
  const accounts = context.accounts?.length ? context.accounts : fallbackAccounts;
  const categories = context.categories?.length ? context.categories : fallbackCategories;
  const amount = parseAmount(message);
  const isBusiness = context.workspaceType === "business";
  const type = isBusiness ? detectBusinessType(message) : detectType(message);
  const category = isBusiness
    ? findBusinessCategory(categories, type, message)
    : findCategory(categories, type, message);
  const account = findAccountByMessage(accounts, message) ?? findByName(accounts, "Cash") ?? accounts[0];
  const transferAccounts: {
    from?: ParserAccount;
    to?: ParserAccount;
  } = type === "transfer" ? detectTransferAccounts(accounts, message) : {};
  const missingAmount = amount === null || amount <= 0;
  const missingAccount =
    type === "transfer" ? !transferAccounts.from || !transferAccounts.to : !account;

  const confidenceParts = [
    !missingAmount ? 0.4 : 0,
    category || type === "transfer" ? 0.18 : 0,
    !missingAccount ? 0.18 : 0,
    type ? 0.14 : 0,
    0.1
  ];
  const confidence = Number(confidenceParts.reduce((total, part) => total + part, 0).toFixed(2));

  let clarificationQuestion: string | undefined;
  if (missingAmount) {
    clarificationQuestion = "How much should I record for this transaction?";
  } else if (type === "transfer" && (!transferAccounts.from || !transferAccounts.to)) {
    clarificationQuestion = "Which accounts should I use for this transfer?";
  } else if (type !== "transfer" && !account) {
    clarificationQuestion = "Which account should I use?";
  } else if (confidence < 0.7) {
    clarificationQuestion = "Please review this preview before confirming.";
  }

  return {
    type,
    amount: amount ?? 0,
    category: category?.name,
    category_id: category?.id ?? null,
    date: detectDate(message, context.now),
    account: type === "transfer" ? undefined : account?.name,
    account_id: type === "transfer" ? null : account?.id ?? null,
    transfer_from_account: transferAccounts.from?.name,
    transfer_from_account_id: transferAccounts.from?.id ?? null,
    transfer_to_account: transferAccounts.to?.name,
    transfer_to_account_id: transferAccounts.to?.id ?? null,
    note: message,
    languageDetected: detectLanguage(message),
    confidence,
    clarificationQuestion,
    parser: "rule-based-fallback",
    rawMessage: message
  };
}

export function normalizeParsedTransaction(
  parsed: Partial<ParsedTransaction>,
  message: string,
  context: ParserContext = {}
): ParsedTransaction {
  const fallback = parseFinanceMessage(message, context);
  const accounts = context.accounts?.length ? context.accounts : fallbackAccounts;
  const categories = context.categories?.length ? context.categories : fallbackCategories;
  const type = parsed.type ?? fallback.type;
  const category = findByName(
    categories.filter((item) => item.type === type),
    parsed.category
  ) ?? findByName(categories, fallback.category);
  const account = findByName(accounts, parsed.account) ?? findByName(accounts, fallback.account);
  const fromAccount =
    findByName(accounts, parsed.transfer_from_account) ??
    findByName(accounts, fallback.transfer_from_account);
  const toAccount =
    findByName(accounts, parsed.transfer_to_account) ??
    findByName(accounts, fallback.transfer_to_account);
  const amount = Number(parsed.amount ?? fallback.amount ?? 0);

  return {
    ...fallback,
    ...parsed,
    type,
    amount: Number.isFinite(amount) ? amount : fallback.amount,
    category: type === "transfer" ? undefined : category?.name ?? parsed.category ?? fallback.category,
    category_id: type === "transfer" ? null : category?.id ?? parsed.category_id ?? fallback.category_id ?? null,
    account: type === "transfer" ? undefined : account?.name ?? parsed.account ?? fallback.account,
    account_id: type === "transfer" ? null : account?.id ?? parsed.account_id ?? fallback.account_id ?? null,
    transfer_from_account: type === "transfer" ? fromAccount?.name ?? parsed.transfer_from_account : undefined,
    transfer_from_account_id:
      type === "transfer" ? fromAccount?.id ?? parsed.transfer_from_account_id ?? null : null,
    transfer_to_account: type === "transfer" ? toAccount?.name ?? parsed.transfer_to_account : undefined,
    transfer_to_account_id:
      type === "transfer" ? toAccount?.id ?? parsed.transfer_to_account_id ?? null : null,
    date: parsed.date || fallback.date,
    note: parsed.note || fallback.note,
    confidence: parsed.confidence ?? fallback.confidence,
    parser: parsed.parser ?? fallback.parser,
    rawMessage: message
  };
}
