"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { BellRing, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ReminderRepeat = "None" | "Daily" | "Weekly" | "Monthly";
type ReminderType = "Bill" | "Saving" | "Budget Check" | "Goal" | "Custom";

type Reminder = {
  id: string;
  title: string;
  amount: string;
  dueDate: string;
  repeat: ReminderRepeat;
  type: ReminderType;
  done: boolean;
};

const repeatOptions: ReminderRepeat[] = ["None", "Daily", "Weekly", "Monthly"];
const typeOptions: ReminderType[] = ["Bill", "Saving", "Budget Check", "Goal", "Custom"];

function formatRupiah(value: string) {
  const amount = Number(value || 0);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  })
    .format(amount)
    .replace(/\s+/g, " ");
}

function nextId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function RemindersPanel() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [repeat, setRepeat] = useState<ReminderRepeat>("None");
  const [type, setType] = useState<ReminderType>("Bill");
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const sortedReminders = useMemo(
    () =>
      [...reminders].sort((first, second) => {
        if (first.done !== second.done) {
          return first.done ? 1 : -1;
        }

        return first.dueDate.localeCompare(second.dueDate);
      }),
    [reminders]
  );

  function addReminder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("Add a reminder title first.");
      return;
    }

    setReminders((current) => [
      {
        id: nextId(),
        title: title.trim(),
        amount,
        dueDate,
        repeat,
        type,
        done: false
      },
      ...current
    ]);
    setTitle("");
    setAmount("");
    setDueDate("");
    setRepeat("None");
    setType("Bill");
    toast.success("Reminder added locally.");
  }

  function toggleDone(id: string) {
    setReminders((current) =>
      current.map((reminder) =>
        reminder.id === id ? { ...reminder, done: !reminder.done } : reminder
      )
    );
  }

  function deleteReminder(id: string) {
    setReminders((current) => current.filter((reminder) => reminder.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.35rem] border border-accent/18 bg-slate-950/45 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-2xl border border-accent/20 bg-sky/10 p-3 text-accent-soft">
            <BellRing className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Finance Reminders</h3>
            <p className="text-sm text-muted">Local future-ready reminders for money routines.</p>
          </div>
        </div>

        <form className="grid gap-3" onSubmit={addReminder}>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Pay internet bill"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Optional amount"
            />
            <Input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              value={repeat}
              onChange={(event) => setRepeat(event.target.value as ReminderRepeat)}
              aria-label="Reminder repeat"
            >
              {repeatOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <Select
              value={type}
              onChange={(event) => setType(event.target.value as ReminderType)}
              aria-label="Reminder type"
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add reminder
          </Button>
        </form>
      </div>

      <div className="rounded-[1.35rem] border border-slate-800/85 bg-slate-950/35 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white">Reminder list</h3>
            <p className="text-xs text-muted">Stored in this session for now.</p>
          </div>
          <Badge tone="accent">{reminders.length} items</Badge>
        </div>

        {sortedReminders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-accent/20 bg-slate-950/35 p-5 text-center">
            <p className="font-semibold text-white">No reminders yet</p>
            <p className="mt-1 text-sm text-muted">Add a bill, saving, or budget check above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedReminders.map((reminder) => (
              <div
                key={reminder.id}
                className={cn(
                  "rounded-2xl border border-slate-800/80 bg-slate-950/45 p-3 transition hover:border-accent/30",
                  reminder.done && "opacity-60"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={cn(
                          "truncate text-sm font-bold text-white",
                          reminder.done && "line-through"
                        )}
                      >
                        {reminder.title}
                      </p>
                      <Badge tone={reminder.done ? "slate" : "blue"}>{reminder.type}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {reminder.dueDate ? `Due ${reminder.dueDate}` : "No due date"}
                      {reminder.repeat !== "None" ? ` - ${reminder.repeat}` : ""}
                      {reminder.amount ? ` - ${formatRupiah(reminder.amount)}` : ""}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleDone(reminder.id)}
                      aria-label={reminder.done ? "Mark reminder not done" : "Mark reminder done"}
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReminder(reminder.id)}
                      aria-label="Delete reminder"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
