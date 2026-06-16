"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { ConfirmTransactionModal } from "@/components/ai/confirm-transaction-modal";
import { AIMessage } from "@/components/ai/ai-message";
import { FinanceAiRobotIcon } from "@/components/brand/finance-ai-robot-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ParsedTransaction } from "@/types/finance";

export function AIChat() {
  const [message, setMessage] = useState("");
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim()) {
      toast.error("Type a message first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Smart Capture failed.");
      }

      setParsed(result.parsed);
      setPreviewOpen(true);
      setMessage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Smart Capture failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="space-y-4">
        <AIMessage role="assistant">
          <span className="inline-flex items-center gap-2 font-semibold text-white">
            <FinanceAiRobotIcon className="h-5 w-5 text-accent-soft" />
            Send a transaction in English, Indonesian, or mixed language for Smart Capture.
          </span>
        </AIMessage>
        {parsed ? (
          <AIMessage role="assistant">
            Smart Capture found a {parsed.type} preview for {parsed.amount ? `Rp ${parsed.amount.toLocaleString("en-US")}` : "an unknown amount"}. Review it before saving.
          </AIMessage>
        ) : null}
        <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleSubmit}>
          <Input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Add expense 50rb buat GoFood tadi malam"
          />
          <Button type="submit" disabled={loading}>
            <Send className="h-4 w-4" aria-hidden="true" />
            {loading ? "Capturing..." : "Send"}
          </Button>
        </form>
      </Card>
      <ConfirmTransactionModal
        open={previewOpen}
        parsed={parsed}
        onClose={() => setPreviewOpen(false)}
        onSaved={() => setParsed(null)}
      />
    </>
  );
}
