"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function AccountForm() {
  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-white">Account</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input placeholder="Account name" />
        <Select defaultValue="cash" aria-label="Account type">
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
          <option value="e-wallet">E-wallet</option>
          <option value="savings">Savings</option>
          <option value="business">Business</option>
          <option value="investment">Investment</option>
          <option value="other">Other</option>
        </Select>
        <Input type="number" min="0" placeholder="Initial balance" />
        <Input type="color" defaultValue="#38BDF8" aria-label="Account color" />
      </div>
      <Button className="mt-5">Save account</Button>
    </Card>
  );
}
