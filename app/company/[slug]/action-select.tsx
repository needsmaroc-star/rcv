"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ACTIONS = [
  "Relance 1",
  "Relance 2",
  "Relance 3",
  "Avertissement 1",
  "Avertissement 2",
  "Avis de coupure",
];

function joursRestants(deadline: Date) {
  const diffMs = deadline.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function ActionSelect({
  clientId,
  currentAction,
  currentCoupureDeadline,
}: {
  clientId: number;
  currentAction: string | null;
  currentCoupureDeadline: Date | null;
}) {
  const [action, setAction] = useState(currentAction ?? "");
  const [loading, setLoading] = useState(false);
  const [pendingDeadline, setPendingDeadline] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState("");
  const router = useRouter();

  async function submitAction(type: string, coupureDeadline?: string) {
    setLoading(true);
    await fetch(`/api/clients/${clientId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, coupureDeadline }),
    });
    setLoading(false);
    setPendingDeadline(false);
    router.refresh();
  }

  async function handleChange(newAction: string) {
    setAction(newAction);
    if (newAction === "Avis de coupure") {
      setPendingDeadline(true);
      return;
    }
    await submitAction(newAction);
  }

  return (
    <div className="space-y-1">
      <select
        value={action}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="text-xs rounded border border-gray-200 px-2 py-1 bg-white"
      >
        <option value="" disabled>
          —
        </option>
        {ACTIONS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      {pendingDeadline && (
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={deadlineInput}
            onChange={(e) => setDeadlineInput(e.target.value)}
            className="text-xs rounded border border-blue-400 px-1 py-0.5"
          />
          <button
            type="button"
            disabled={!deadlineInput || loading}
            onClick={() => submitAction("Avis de coupure", deadlineInput)}
            className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white disabled:opacity-40"
          >
            OK
          </button>
        </div>
      )}

      {!pendingDeadline && action === "Avis de coupure" && currentCoupureDeadline && (
        <div
          className={
            joursRestants(currentCoupureDeadline) < 0
              ? "text-xs font-medium text-red-600"
              : "text-xs text-gray-500"
          }
        >
          {joursRestants(currentCoupureDeadline) < 0
            ? `Délai dépassé de ${Math.abs(joursRestants(currentCoupureDeadline))} j`
            : `${joursRestants(currentCoupureDeadline)} j avant coupure`}
        </div>
      )}
    </div>
  );
}
