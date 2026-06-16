"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { ArrowLeft, Calculator, Copy, PiggyBank, Percent, ReceiptText, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const calculatorKeys = [
  { label: "C", kind: "utility" },
  { label: "Back", kind: "utility" },
  { label: ":", kind: "operator" },
  { label: "x", kind: "operator" },
  { label: "7", kind: "number" },
  { label: "8", kind: "number" },
  { label: "9", kind: "number" },
  { label: "-", kind: "operator" },
  { label: "4", kind: "number" },
  { label: "5", kind: "number" },
  { label: "6", kind: "number" },
  { label: "+", kind: "operator" },
  { label: "1", kind: "number" },
  { label: "2", kind: "number" },
  { label: "3", kind: "number" },
  { label: "0", kind: "number" },
  { label: "00", kind: "number" },
  { label: ".", kind: "number" },
  { label: "=", kind: "equals" }
] as const;

function formatNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "Invalid";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6
  }).format(value);
}

function formatRupiah(value: number) {
  if (!Number.isFinite(value)) {
    return "Rp 0";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  })
    .format(value)
    .replace(/\s+/g, " ");
}

function displayExpression(expression: string) {
  return expression.replace(/\*/g, "x").replace(/\//g, ":");
}

function tokenize(expression: string) {
  const tokens: (number | string)[] = [];
  let current = "";
  const input = expression.replace(/\s+/g, "").replace(/:/g, "/");

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const previous = input[index - 1];
    const unaryMinus = char === "-" && (index === 0 || "+-*/".includes(previous));

    if (/\d/.test(char) || char === "." || unaryMinus) {
      current += char;
      continue;
    }

    if ("+-*/".includes(char)) {
      if (!current || current === "-" || current === ".") {
        return null;
      }

      tokens.push(Number(current), char);
      current = "";
      continue;
    }

    return null;
  }

  if (!current || current === "-" || current === ".") {
    return null;
  }

  tokens.push(Number(current));
  return tokens.some((token) => typeof token === "number" && !Number.isFinite(token))
    ? null
    : tokens;
}

function evaluateExpression(expression: string) {
  const tokens = tokenize(expression);

  if (!tokens) {
    return null;
  }

  const firstPass: (number | string)[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === "*" || token === "/") {
      const left = firstPass.pop();
      const right = tokens[index + 1];

      if (typeof left !== "number" || typeof right !== "number") {
        return null;
      }

      if (token === "/" && right === 0) {
        return null;
      }

      firstPass.push(token === "*" ? left * right : left / right);
      index += 1;
    } else {
      firstPass.push(token);
    }
  }

  let result = firstPass[0];

  if (typeof result !== "number") {
    return null;
  }

  for (let index = 1; index < firstPass.length; index += 2) {
    const operator = firstPass[index];
    const next = firstPass[index + 1];

    if (typeof operator !== "string" || typeof next !== "number") {
      return null;
    }

    result = operator === "+" ? result + next : result - next;
  }

  return Number.isFinite(result) ? result : null;
}

function appendToken(expression: string, token: string) {
  const normalized = token === "x" ? "*" : token === ":" ? "/" : token;
  const last = expression.at(-1);

  if ("+-*/".includes(normalized)) {
    if (expression === "0" && normalized !== "-") {
      return expression;
    }

    if (last && "+-*/".includes(last)) {
      return `${expression.slice(0, -1)}${normalized}`;
    }

    return `${expression}${normalized}`;
  }

  if (normalized === ".") {
    const currentNumber = expression.split(/[+\-*/]/).at(-1) ?? "";

    if (currentNumber.includes(".")) {
      return expression;
    }

    return `${expression}.`;
  }

  if (expression === "0") {
    return normalized;
  }

  return `${expression}${normalized}`;
}

export function SmartCalculator() {
  const [expression, setExpression] = useState("0");
  const [splitTotal, setSplitTotal] = useState("");
  const [splitPeople, setSplitPeople] = useState("2");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");
  const [goalMonths, setGoalMonths] = useState("6");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [budgetUsed, setBudgetUsed] = useState("");
  const [percentBase, setPercentBase] = useState("");
  const [percentValue, setPercentValue] = useState("10");

  const result = useMemo(() => evaluateExpression(expression), [expression]);
  const numericResult = result ?? 0;
  const splitPerPerson =
    Number(splitPeople) > 0 ? Number(splitTotal || 0) / Number(splitPeople) : 0;
  const monthlySavings =
    Number(goalMonths) > 0
      ? Math.max(0, Number(goalTarget || 0) - Number(goalCurrent || 0)) / Number(goalMonths)
      : 0;
  const budgetRemaining = Number(budgetLimit || 0) - Number(budgetUsed || 0);
  const budgetPercentage =
    Number(budgetLimit) > 0 ? (Number(budgetUsed || 0) / Number(budgetLimit)) * 100 : 0;
  const percentageAmount = (Number(percentBase || 0) * Number(percentValue || 0)) / 100;

  function handleKeyPress(key: string) {
    if (key === "C") {
      setExpression("0");
      return;
    }

    if (key === "Back") {
      setExpression((current) => (current.length > 1 ? current.slice(0, -1) : "0"));
      return;
    }

    if (key === "=") {
      if (result === null) {
        toast.error("This calculation is not valid yet.");
        return;
      }

      setExpression(String(Number(result.toFixed(6))));
      return;
    }

    setExpression((current) => appendToken(current, key));
  }

  function copyResult() {
    void navigator.clipboard?.writeText(String(numericResult));
    toast.success("Calculator result copied.");
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-[1.35rem] border border-cyan-300/18 bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.12),transparent_32%),linear-gradient(145deg,rgba(2,6,23,0.90),rgba(8,13,30,0.94))] p-3.5 shadow-[0_18px_54px_rgba(0,0,0,0.24),0_0_26px_rgba(34,211,238,0.055)]">
        <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-accent/20 bg-sky/10 text-accent-soft shadow-[0_0_18px_rgba(34,211,238,0.08)]">
              <Calculator className="h-[1.05rem] w-[1.05rem]" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Smart Calculator</h3>
              <p className="text-[11px] leading-4 text-muted">Compact IDR finance utility</p>
            </div>
          </div>
          <span className="rounded-xl border border-slate-800/80 bg-slate-950/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-100">
            Live
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[1.1rem] border border-accent/18 bg-[linear-gradient(145deg,rgba(2,6,23,0.90),rgba(15,23,42,0.70))] p-3.5 text-right shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_0_20px_rgba(34,211,238,0.035)]">
          <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/35 to-transparent" />
          <div className="flex items-center justify-between gap-2 text-left">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Live Result
            </span>
            <span className="rounded-lg border border-cyan-300/14 bg-cyan-300/8 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">
              IDR Preview
            </span>
          </div>
          <p className="mt-2.5 min-h-5 break-all text-xs leading-5 text-slate-400">
            {displayExpression(expression)}
          </p>
          <p
            className={cn(
              "mt-1.5 break-all text-[1.7rem] font-black leading-tight tracking-tight",
              result === null ? "text-red-300" : "text-white"
            )}
          >
            {result === null ? "Invalid" : formatNumber(numericResult)}
          </p>
          <p className="mt-2.5 break-all rounded-xl border border-accent/16 bg-[linear-gradient(135deg,rgba(34,211,238,0.10),rgba(99,102,241,0.08))] px-3 py-2 text-xs font-bold text-cyan-100">
            {formatRupiah(numericResult)}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {calculatorKeys.map((key) => (
            <CalculatorKeyButton
              key={key.label}
              label={key.label}
              kind={key.kind}
              onClick={() => handleKeyPress(key.label)}
            />
          ))}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" onClick={copyResult} className="h-10 justify-center text-xs">
            <Copy className="h-4 w-4" aria-hidden="true" />
            Copy result
          </Button>
          <Button disabled title="Coming soon" className="h-10 text-xs">
            Use as transaction amount
          </Button>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <FinanceToolCard
          icon={ReceiptText}
          title="Split Bill"
          result={`${formatRupiah(splitPerPerson)} each`}
        >
          <Input
            type="number"
            min="0"
            value={splitTotal}
            onChange={(event) => setSplitTotal(event.target.value)}
            placeholder="Total bill"
          />
          <Input
            type="number"
            min="1"
            value={splitPeople}
            onChange={(event) => setSplitPeople(event.target.value)}
            placeholder="People"
          />
        </FinanceToolCard>

        <FinanceToolCard
          icon={PiggyBank}
          title="Savings Goal"
          result={`${formatRupiah(monthlySavings)} / month`}
        >
          <Input
            type="number"
            min="0"
            value={goalTarget}
            onChange={(event) => setGoalTarget(event.target.value)}
            placeholder="Target amount"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min="0"
              value={goalCurrent}
              onChange={(event) => setGoalCurrent(event.target.value)}
              placeholder="Saved"
            />
            <Input
              type="number"
              min="1"
              value={goalMonths}
              onChange={(event) => setGoalMonths(event.target.value)}
              placeholder="Months"
            />
          </div>
        </FinanceToolCard>

        <FinanceToolCard
          icon={WalletCards}
          title="Budget Remaining"
          result={`${formatRupiah(budgetRemaining)} left`}
          helper={`${Math.round(budgetPercentage)}% used`}
        >
          <Input
            type="number"
            min="0"
            value={budgetLimit}
            onChange={(event) => setBudgetLimit(event.target.value)}
            placeholder="Budget limit"
          />
          <Input
            type="number"
            min="0"
            value={budgetUsed}
            onChange={(event) => setBudgetUsed(event.target.value)}
            placeholder="Used amount"
          />
        </FinanceToolCard>

        <FinanceToolCard
          icon={Percent}
          title="Percentage"
          result={`${formatRupiah(percentageAmount)}`}
          helper={`${percentValue || 0}% of ${formatRupiah(Number(percentBase || 0))}`}
        >
          <Input
            type="number"
            min="0"
            value={percentBase}
            onChange={(event) => setPercentBase(event.target.value)}
            placeholder="Base amount"
          />
          <Input
            type="number"
            value={percentValue}
            onChange={(event) => setPercentValue(event.target.value)}
            placeholder="Percent"
          />
        </FinanceToolCard>
      </div>
    </div>
  );
}

type FinanceToolCardProps = {
  icon: typeof Calculator;
  title: string;
  result: string;
  helper?: string;
  children: ReactNode;
};

type CalculatorKeyButtonProps = {
  label: string;
  kind: "equals" | "number" | "operator" | "utility";
  className?: string;
  onClick: () => void;
};

function CalculatorKeyButton({ label, kind, className, onClick }: CalculatorKeyButtonProps) {
  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={onClick}
      className={cn(
        "calculator-key h-10 rounded-[0.95rem] border border-slate-800 bg-slate-950/58 text-sm font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] transition hover:-translate-y-0.5 hover:border-accent/35 hover:bg-slate-900/72 hover:shadow-[0_10px_26px_rgba(34,211,238,0.055)] active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-accent/40",
        kind === "operator" &&
          "border-accent/20 bg-gradient-to-br from-cyan-400/14 to-indigo-500/14 text-cyan-100",
        kind === "utility" &&
          "border-slate-700/80 bg-slate-900/48 text-slate-300 hover:text-white",
        kind === "equals" &&
          "border-cyan-300/36 bg-gradient-to-br from-cyan-300 via-sky-400 to-indigo-500 text-slate-950 shadow-[0_12px_34px_rgba(34,211,238,0.18)] hover:border-cyan-200/60 hover:shadow-[0_16px_44px_rgba(34,211,238,0.28)]",
        className
      )}
      aria-label={label === "Back" ? "Backspace" : label}
    >
      {label === "Back" ? <ArrowLeft className="mx-auto h-4 w-4" aria-hidden="true" /> : label}
    </button>
  );
}

function FinanceToolCard({ icon: Icon, title, result, helper, children }: FinanceToolCardProps) {
  return (
    <div className="rounded-[1.1rem] border border-slate-800/85 bg-slate-950/35 p-3">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-accent/20 bg-accent/10 p-2 text-accent-soft">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{title}</p>
            {helper ? <p className="text-xs text-muted">{helper}</p> : null}
          </div>
        </div>
        <p className="max-w-36 text-right text-xs font-bold leading-5 text-cyan-200">{result}</p>
      </div>
      <div className="grid gap-2">{children}</div>
    </div>
  );
}
