"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="mx-auto flex min-h-[420px] max-w-2xl flex-col items-center justify-center text-center">
      <div className="mb-5 rounded-2xl border border-expense/25 bg-expense/10 p-4 text-red-300">
        <AlertTriangle className="h-8 w-8" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-black text-white">Something needs a quick refresh</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">
        DFT could not finish loading this view. Try again, and if it keeps happening,
        check your Supabase connection and environment values.
      </p>
      {error.digest ? <p className="mt-3 text-xs text-slate-500">Error ID: {error.digest}</p> : null}
      <Button className="mt-6" onClick={reset}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Try again
      </Button>
    </Card>
  );
}
