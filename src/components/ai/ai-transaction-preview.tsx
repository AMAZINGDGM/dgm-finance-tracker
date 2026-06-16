import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/format";
import type { ParsedTransaction } from "@/types/finance";

type AITransactionPreviewProps = {
  parsed: ParsedTransaction;
  onConfirm?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  confirmDisabled?: boolean;
  confirmLabel?: string;
};

export function AITransactionPreview({
  parsed,
  onConfirm,
  onEdit,
  onCancel,
  confirmDisabled = false,
  confirmLabel = "Confirm"
}: AITransactionPreviewProps) {
  const isTransfer = parsed.type === "transfer";

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-white">Transaction Preview</h3>
        <Badge tone={parsed.type === "income" ? "green" : parsed.type === "expense" ? "red" : "blue"}>
          {parsed.type}
        </Badge>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Amount</dt>
          <dd className="mt-1 font-semibold text-white">{formatCurrency(parsed.amount)}</dd>
        </div>
        <div>
          <dt className="text-muted">{isTransfer ? "Transfer" : "Category"}</dt>
          <dd className="mt-1 font-semibold text-white">
            {isTransfer
              ? `${parsed.transfer_from_account ?? "Needs source"} to ${
                  parsed.transfer_to_account ?? "Needs destination"
                }`
              : parsed.category ?? "Uncategorized"}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Date</dt>
          <dd className="mt-1 font-semibold text-white">{parsed.date ?? "Today"}</dd>
        </div>
        <div>
          <dt className="text-muted">Account</dt>
          <dd className="mt-1 font-semibold text-white">
            {isTransfer ? "Transfer movement" : parsed.account ?? "Needs account"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted">Note</dt>
          <dd className="mt-1 font-semibold text-white">{parsed.note ?? parsed.rawMessage ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted">Language</dt>
          <dd className="mt-1 font-semibold text-white">{parsed.languageDetected ?? "mixed"}</dd>
        </div>
        <div>
          <dt className="text-muted">Confidence</dt>
          <dd className="mt-1 font-semibold text-white">
            {Math.round((parsed.confidence ?? 0) * 100)}%
          </dd>
        </div>
      </dl>
      {parsed.clarificationQuestion ? (
        <p className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-amber-100">
          {parsed.clarificationQuestion}
        </p>
      ) : null}
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        <Button onClick={onConfirm} disabled={confirmDisabled}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}
