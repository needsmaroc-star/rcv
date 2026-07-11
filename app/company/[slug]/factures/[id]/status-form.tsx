"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function InvoiceStatusForm({
  invoiceId,
  currentStatus,
  options,
}: {
  invoiceId: number;
  currentStatus: string;
  options: string[];
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleChange(newStatus: string) {
    setStatus(newStatus);
    await fetch(`/api/invoices/${invoiceId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statutInterne: newStatus }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isPending}
      className="w-full sm:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
