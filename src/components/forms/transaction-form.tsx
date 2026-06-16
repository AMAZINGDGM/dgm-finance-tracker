"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function TransactionForm() {
  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-white">Transaction</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue="expense" aria-label="Transaction type">
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="transfer">Transfer</option>
        </Select>
        <Input type="number" min="0" placeholder="Amount" />
        <Input placeholder="Category" />
        <Input placeholder="Account" />
        <Input type="date" />
        <Input placeholder="Note" />
      </div>
      <Button className="mt-5">Save transaction</Button>
    </Card>
  );
}
