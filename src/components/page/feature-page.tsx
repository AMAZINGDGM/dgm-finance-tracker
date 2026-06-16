import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page/page-header";

type FeaturePageProps = {
  title: string;
  description: string;
  badge: string;
  icon: LucideIcon;
  included: string[];
  statusNote?: string;
};

export function FeaturePage({
  title,
  description,
  badge,
  icon,
  included,
  statusNote
}: FeaturePageProps) {
  return (
    <div>
      <PageHeader title={title} description={description} badge={badge} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <EmptyState
          icon={icon}
          title={`${title} workspace`}
          description={statusNote ?? "This workspace is ready for the next build pass and will connect to live Supabase finance data."}
        />
        <Card>
          <h2 className="text-base font-semibold text-white">Planned in this module</h2>
          <div className="mt-4 space-y-3">
            {included.map((item) => (
              <div key={item} className="flex gap-3 text-sm text-slate-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent-soft" aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
