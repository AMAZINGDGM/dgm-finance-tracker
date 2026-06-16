"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { ConfirmTransactionModal } from "@/components/ai/confirm-transaction-modal";
import { FinanceAiRobotIcon } from "@/components/brand/finance-ai-robot-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ParsedTransaction } from "@/types/finance";

const examples = [
  "I spent 35000 on lunch today",
  "Aku keluar 35 ribu buat makan siang hari ini",
  "Tambah income 500k from jual parfum"
];

type AIQuickInputProps = {
  surface?: "card" | "plain";
};

export function AIQuickInput({ surface = "card" }: AIQuickInputProps) {
  const [message, setMessage] = useState("");
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim()) {
      toast.error("Type a transaction or question first.");
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

  const content = (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-2xl border border-accent/20 bg-sky/10 p-2.5 text-accent-soft">
          <FinanceAiRobotIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">AI Smart Capture</h2>
          <p className="text-sm text-muted">English, Indonesian, or mixed input.</p>
        </div>
      </div>

      <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleSubmit}>
        <Input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Aku beli kopi 25rb tadi pagi"
        />
        <Button type="submit" disabled={loading}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          {loading ? "Capturing..." : "Smart Capture"}
        </Button>
      </form>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            suppressHydrationWarning
            onClick={() => setMessage(example)}
            className="shrink-0 rounded-full border border-slate-800 bg-slate-950/50 px-3 py-1.5 text-xs text-slate-300 transition hover:border-accent/40 hover:text-accent-soft"
          >
            {example}
          </button>
        ))}
      </div>
    </>
  );

  return (
    <>
      {surface === "card" ? (
        <Card className="p-4">{content}</Card>
      ) : (
        <div className="rounded-[1.35rem] border border-slate-800/85 bg-slate-950/40 p-4">
          {content}
        </div>
      )}
      <ConfirmTransactionModal
        open={previewOpen}
        parsed={parsed}
        onClose={() => setPreviewOpen(false)}
        onSaved={() => setParsed(null)}
      />
    </>
  );
}
