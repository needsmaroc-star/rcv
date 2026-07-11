"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PRODUITS = ["Hébergement", "Infogérence", "Licence", "Azure", "AWS"];

export function PromiseForm({ clientId }: { clientId: number }) {
  const [montant, setMontant] = useState("");
  const [dateEcheance, setDateEcheance] = useState("");
  const [produit, setProduit] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!montant || !dateEcheance) return;
    setLoading(true);

    await fetch(`/api/clients/${clientId}/promises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        montantPromis: montant,
        dateEcheance,
        produit: produit || null,
        commentaire: commentaire || null,
      }),
    });

    setMontant("");
    setDateEcheance("");
    setProduit("");
    setCommentaire("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Montant promis (MAD)</label>
          <input
            type="number"
            step="0.01"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date d&apos;échéance</label>
          <input
            type="date"
            value={dateEcheance}
            onChange={(e) => setDateEcheance(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Produit concerné</label>
        <select
          value={produit}
          onChange={(e) => setProduit(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        >
          <option value="">— Non précisé —</option>
          {PRODUITS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Commentaire</label>
        <input
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium"
      >
        {loading ? "Enregistrement..." : "Ajouter la promesse"}
      </button>
    </form>
  );
}
