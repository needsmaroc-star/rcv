"use client";

import { useState } from "react";

export function InlineEditField({
  clientId,
  field,
  initialValue,
  placeholder,
}: {
  clientId: number;
  field: "responsable" | "commercial" | "interventionPar";
  initialValue: string | null;
  placeholder: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/clients/${clientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setValue(initialValue ?? "");
            setEditing(false);
          }
        }}
        disabled={saving}
        className="w-full rounded border border-blue-400 px-1.5 py-0.5 text-sm focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className="w-full text-left text-sm text-gray-700 hover:bg-gray-100 rounded px-1.5 py-0.5 -mx-1.5 transition-colors"
    >
      {value || <span className="text-gray-400">{placeholder}</span>}
    </button>
  );
}
