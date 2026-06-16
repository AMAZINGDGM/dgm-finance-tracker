"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function CategoryForm() {
  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-white">Category</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input placeholder="Category name" />
        <Select defaultValue="expense" aria-label="Category type">
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </Select>
        <Input placeholder="Icon name" />
        <Input type="color" defaultValue="#38BDF8" aria-label="Category color" />
      </div>
      <Button className="mt-5">Save category</Button>
    </Card>
  );
}
