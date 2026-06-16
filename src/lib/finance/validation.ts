import { z } from "zod";

export const accountTypes = [
  "cash",
  "bank",
  "e-wallet",
  "savings",
  "business",
  "investment",
  "other"
] as const;

export const transactionTypes = ["income", "expense", "transfer"] as const;
export const categoryTypes = ["income", "expense"] as const;

export const accountSchema = z.object({
  name: z.string().trim().min(1, "Account name is required."),
  type: z.enum(accountTypes),
  initial_balance: z.coerce.number().min(0, "Initial balance cannot be negative.").default(0),
  current_balance: z.coerce.number().min(0, "Current balance cannot be negative.").optional(),
  color: z.string().trim().min(1).default("#38BDF8"),
  icon: z.string().trim().min(1).default("Wallet")
});

export const accountUpdateSchema = accountSchema.partial();

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required."),
  type: z.enum(categoryTypes),
  color: z.string().trim().min(1).default("#38BDF8"),
  icon: z.string().trim().min(1).default("CircleDollarSign")
});

export const categoryUpdateSchema = categorySchema.partial();

function idrNumber(schema: z.ZodNumber) {
  return z.preprocess((value) => {
    if (typeof value === "string") {
      const normalized = value.replace(/[^\d-]/g, "");
      return normalized ? Number(normalized) : 0;
    }

    return value;
  }, schema);
}

export const transactionSchema = z
  .object({
    type: z.enum(transactionTypes),
    amount: z.coerce.number().positive("Amount must be greater than zero."),
    category_id: z.string().uuid().nullable().optional(),
    account_id: z.string().uuid().nullable().optional(),
    transfer_from_account_id: z.string().uuid().nullable().optional(),
    transfer_to_account_id: z.string().uuid().nullable().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD date format."),
    note: z.string().trim().nullable().optional(),
    source: z.enum(["manual", "ai"]).default("manual")
  })
  .superRefine((value, context) => {
    if (value.type === "transfer") {
      if (!value.transfer_from_account_id) {
        context.addIssue({
          code: "custom",
          message: "Transfer source account is required.",
          path: ["transfer_from_account_id"]
        });
      }

      if (!value.transfer_to_account_id) {
        context.addIssue({
          code: "custom",
          message: "Transfer destination account is required.",
          path: ["transfer_to_account_id"]
        });
      }

      if (
        value.transfer_from_account_id &&
        value.transfer_to_account_id &&
        value.transfer_from_account_id === value.transfer_to_account_id
      ) {
        context.addIssue({
          code: "custom",
          message: "Transfer accounts must be different.",
          path: ["transfer_to_account_id"]
        });
      }

      return;
    }

    if (!value.account_id) {
      context.addIssue({
        code: "custom",
        message: "Account is required.",
        path: ["account_id"]
      });
    }
  });

export const transactionUpdateSchema = transactionSchema;

export const transactionMoveSchema = z
  .object({
    transaction_ids: z.array(z.string().uuid()).min(1, "Select at least one transaction."),
    target_workspace_id: z.string().uuid("Target workspace is required."),
    target_type: z.enum(transactionTypes),
    category_id: z.string().uuid().nullable().optional(),
    account_id: z.string().uuid().nullable().optional(),
    transfer_from_account_id: z.string().uuid().nullable().optional(),
    transfer_to_account_id: z.string().uuid().nullable().optional(),
    note: z.string().trim().nullable().optional(),
    copy: z.boolean().default(false)
  })
  .superRefine((value, context) => {
    if (value.target_type === "transfer") {
      if (!value.transfer_from_account_id) {
        context.addIssue({
          code: "custom",
          message: "Transfer source account is required.",
          path: ["transfer_from_account_id"]
        });
      }

      if (!value.transfer_to_account_id) {
        context.addIssue({
          code: "custom",
          message: "Transfer destination account is required.",
          path: ["transfer_to_account_id"]
        });
      }

      if (
        value.transfer_from_account_id &&
        value.transfer_to_account_id &&
        value.transfer_from_account_id === value.transfer_to_account_id
      ) {
        context.addIssue({
          code: "custom",
          message: "Transfer accounts must be different.",
          path: ["transfer_to_account_id"]
        });
      }

      return;
    }

    if (!value.account_id) {
      context.addIssue({
        code: "custom",
        message: "Target account is required.",
        path: ["account_id"]
      });
    }
  });

export const budgetSchema = z.object({
  category_id: z.string().uuid("Category is required."),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2200),
  limit_amount: z.coerce.number().positive("Budget limit must be greater than zero.")
});

export const budgetUpdateSchema = budgetSchema.partial();

export const goalSchema = z.object({
  name: z.string().trim().min(1, "Goal name is required."),
  target_amount: z.coerce.number().positive("Target amount must be greater than zero."),
  current_amount: z.coerce.number().min(0, "Current amount cannot be negative.").default(0),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  icon: z.string().trim().min(1).default("Target"),
  color: z.string().trim().min(1).default("#38BDF8")
});

export const goalUpdateSchema = goalSchema.partial();

export const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required."),
  brand: z.string().trim().nullable().optional(),
  category: z.string().trim().nullable().optional(),
  sku: z.string().trim().nullable().optional(),
  cost_price: idrNumber(z.number().min(0, "Cost price cannot be negative.")).default(0),
  selling_price: idrNumber(z.number().min(0, "Selling price cannot be negative.")).default(0),
  stock_quantity: idrNumber(
    z.number().int().min(0, "Stock quantity cannot be negative.")
  ).default(0),
  low_stock_threshold: idrNumber(
    z.number().int().min(0, "Low stock alert cannot be negative.")
  ).default(1),
  condition: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional()
});

export const capitalEntrySchema = z.object({
  type: z.enum(["owner_capital_in", "owner_withdrawal", "reimbursement"]),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  account_id: z.string().uuid().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD date format."),
  notes: z.string().trim().nullable().optional(),
  source: z.string().trim().nullable().optional(),
  reference: z.string().trim().nullable().optional(),
  payment_method: z.string().trim().nullable().optional()
});

export const accountReconcileSchema = z.object({
  account_id: z.string().uuid("Select a valid account."),
  real_balance: idrNumber(z.number().finite("Enter a valid balance.")),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD date format.")
    .optional(),
  note: z.string().trim().nullable().optional()
});

export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}
