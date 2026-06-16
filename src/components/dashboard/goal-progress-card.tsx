import { Target } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/format";
import { goalProgress } from "@/lib/finance/mock-data";

type GoalProgressCardProps = {
  goals?: typeof goalProgress;
};

export function GoalProgressCard({ goals = goalProgress }: GoalProgressCardProps) {
  return (
    <Card className="dashboard-secondary-card overflow-hidden p-4">
      <CardHeader className="mb-3 items-start">
        <div>
          <CardTitle>Goal Progress</CardTitle>
          <CardDescription>Savings targets and progress health.</CardDescription>
        </div>
        <div className="rounded-2xl border border-accent/20 bg-accent/10 p-2.5 text-accent-soft">
          <Target className="h-5 w-5" aria-hidden="true" />
        </div>
      </CardHeader>
      {goals.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-accent/22 bg-slate-950/35 p-4 text-sm leading-6 text-muted">
          Add your first savings goal to turn this panel into a progress tracker.
        </div>
      ) : (
        <div className="space-y-3">
        {goals.map((goal) => {
          const progress =
            goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;

          return (
            <div key={goal.name}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">{goal.name}</p>
                <p className="text-xs text-muted">{Math.round(progress)}%</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full shadow-[0_0_18px_rgba(34,211,238,0.16)]"
                  style={{ width: `${progress}%`, backgroundColor: goal.color }}
                />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {formatCurrency(goal.current)} of {formatCurrency(goal.target)}
              </p>
            </div>
          );
        })}
        </div>
      )}
    </Card>
  );
}
