"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BLOCAGES = ["Facturation", "Lettrage", "Chef de projet", "Sales", "Sans blocage"];

const COLORS: Record<string, string> = {
  "Sans blocage": "bg-gray-100 text-gray-700",
  Facturation: "bg-red-100 text-red-800",
  Lettrage: "bg-orange-100 text-orange-800",
  "Chef de projet": "bg-yellow-100 text-yellow-800",
  Sales: "bg-purple-100 text-purple-800",
};

export function BlocageSelect({
  clientId,
  currentBlocage,
}: {
  clientId: number;
  currentBlocage: string;
}) {
  const [blocage, setBlocage] = useState(currentBlocage);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleChange(newBlocage: string) {
    setBlocage(newBlocage);
    setLoading(true);
    await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocage: newBlocage }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <select
      value={blocage}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className={`text-xs rounded-full px-2 py-1 border-0 ${COLORS[blocage] ?? "bg-gray-100 text-gray-700"}`}
    >
      {BLOCAGES.map((b) => (
        <option key={b} value={b}>
          {b}
        </option>
      ))}
    </select>
  );
}
