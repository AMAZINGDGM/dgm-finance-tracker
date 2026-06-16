import "server-only";

import { serverConfig } from "@/lib/config/server";
import { normalizeParsedTransaction, type ParserContext } from "@/lib/ai/rule-parser";
import type { ParsedTransaction } from "@/types/finance";

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

function extractJson(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);

  return fenced?.[1]?.trim() ?? trimmed;
}

export async function parseWithOpenAI(
  message: string,
  context: ParserContext
): Promise<ParsedTransaction | null> {
  if (!serverConfig.openAiApiKey || serverConfig.aiProvider !== "openai") {
    return null;
  }

  const accounts = context.accounts?.map((account) => account.name).join(", ") || "Cash";
  const incomeCategories =
    context.categories
      ?.filter((category) => category.type === "income")
      .map((category) => category.name)
      .join(", ") || "Other Income";
  const expenseCategories =
    context.categories
      ?.filter((category) => category.type === "expense")
      .map((category) => category.name)
      .join(", ") || "Other Expense";
  const today = (context.now ?? new Date()).toISOString().slice(0, 10);
  const workspaceType = context.workspaceType ?? "personal";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: controller.signal,
    headers: {
      Authorization: `Bearer ${serverConfig.openAiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: serverConfig.aiModel,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You parse personal finance messages for DFT, Dgm Finance Tracker.",
            "The user may write English, Indonesian, or mixed English-Indonesian.",
            "Return only valid JSON. Do not save anything.",
            "Schema: type, amount, category, date, account, transfer_from_account, transfer_to_account, note, languageDetected, confidence, clarificationQuestion.",
            "type must be income, expense, or transfer.",
            "amount must be an IDR number. Understand 25k, 25rb, 25 ribu, 2 juta, 1.5 juta, 500k.",
            `today is ${today}. hari ini/tadi pagi/tadi malam = today unless it clearly means yesterday. kemarin/yesterday = previous day.`,
            `Allowed accounts: ${accounts}.`,
            `Allowed income categories: ${incomeCategories}.`,
            `Allowed expense categories: ${expenseCategories}.`,
            `Active workspace type: ${workspaceType}.`,
            workspaceType === "business"
              ? "Business rules: owner capital is income category Owner Capital In, not sales revenue. Owner withdrawal and reimbursement are separate business categories, not generic expenses. Transfers between business accounts must be transfer, not income or expense. Stock/product purchases should use Inventory Purchase when available. Shopee sales should use Sales Revenue."
              : "Personal rules: daily spending should use personal categories. Money sent to Davenue should use Capital to Davenue when available. Money received from Davenue should use Money from Davenue when available.",
            "If unsure, include clarificationQuestion and a lower confidence score."
          ].join("\n")
        },
        { role: "user", content: message }
      ]
    })
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    return null;
  }

  try {
    const parsed = JSON.parse(extractJson(content)) as Partial<ParsedTransaction>;
    return normalizeParsedTransaction(
      {
        ...parsed,
        parser: "openai"
      },
      message,
      context
    );
  } catch {
    return null;
  }
}
