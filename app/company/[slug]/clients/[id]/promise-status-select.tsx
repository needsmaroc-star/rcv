"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUTS = ["En attente", "Respectée", "Partiellement respectée", "Non respectée"];

const COLORS: Record<string, string> = {
  "En attente": "bg-gray-100 text-gray-700",
  "Respectée": "bg-green-100 text-green-800",
  "Partiellement respectée": "bg-orange-100 text-orange-800",
  "Non respectée": "bg-red-100 text-red-800",
};

export function PromiseStatusSelect({
  promiseId,
  currentStatus,
}: {
  promiseId: number;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleChange(newStatus: string) {
    setStatus(newStatus);
    setLoading(true);
    await fetch(`/api/promises/${promiseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className={`text-xs rounded-full px-2 py-1 border-0 ${COLORS[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {STATUTS.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
