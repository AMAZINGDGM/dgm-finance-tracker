import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <LoadingSkeleton className="h-7 w-28" />
        <LoadingSkeleton className="h-10 w-full max-w-md" />
        <LoadingSkeleton className="h-5 w-full max-w-2xl" />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Card key={index} className="p-4">
            <LoadingSkeleton className="h-4 w-24" />
            <LoadingSkeleton className="mt-4 h-8 w-32" />
            <LoadingSkeleton className="mt-3 h-4 w-40" />
          </Card>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <Card className="min-h-[320px]">
          <CardHeader>
            <CardTitle>Loading dashboard</CardTitle>
          </CardHeader>
          <LoadingSkeleton className="h-56" />
        </Card>
        <Card className="min-h-[320px]">
          <CardHeader>
            <CardTitle>Preparing insights</CardTitle>
          </CardHeader>
          <LoadingSkeleton className="h-56" />
        </Card>
      </section>
    </div>
  );
}
