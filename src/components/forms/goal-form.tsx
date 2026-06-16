"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function GoalForm() {
  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-white">Goal</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input placeholder="Goal name" />
        <Input type="number" min="0" placeholder="Target amount" />
        <Input type="number" min="0" placeholder="Current amount" />
        <Input type="date" />
        <Input placeholder="Icon name" />
        <Input type="color" defaultValue="#38BDF8" aria-label="Goal color" />
      </div>
      <Button className="mt-5">Save goal</Button>
    </Card>
  );
}
