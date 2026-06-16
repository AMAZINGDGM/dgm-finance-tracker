import { cn } from "@/lib/utils";

type AIMessageProps = {
  role: "user" | "assistant";
  children: React.ReactNode;
};

export function AIMessage({ role, children }: AIMessageProps) {
  return (
    <div
      className={cn(
        "max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-6",
        role === "user"
          ? "ml-auto border-accent/30 bg-sky/10 text-cyan-100"
          : "border-slate-800 bg-slate-950/60 text-slate-200"
      )}
    >
      {children}
    </div>
  );
}
