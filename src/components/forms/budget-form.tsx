"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function BudgetForm() {
  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-white">Budget</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input placeholder="Category" />
        <Input type="number" min="1" max="12" placeholder="Month" />
        <Input type="number" min="2000" placeholder="Year" />
        <Input type="number" min="0" placeholder="Limit amount" />
      </div>
      <Button className="mt-5">Save budget</Button>
    </Card>
  );
}
