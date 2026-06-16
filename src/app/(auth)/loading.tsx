import { Card } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function AuthLoading() {
  return (
    <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <section className="max-w-2xl">
        <LoadingSkeleton className="h-12 w-48" />
        <LoadingSkeleton className="mt-8 h-12 w-full max-w-xl" />
        <LoadingSkeleton className="mt-4 h-24 w-full max-w-xl" />
      </section>
      <Card className="rounded-3xl p-7">
        <LoadingSkeleton className="h-8 w-40" />
        <LoadingSkeleton className="mt-8 h-11 w-full" />
        <LoadingSkeleton className="mt-4 h-11 w-full" />
        <LoadingSkeleton className="mt-6 h-12 w-full" />
      </Card>
    </div>
  );
}
