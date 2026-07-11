"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ImportSummary {
  newCount: number;
  updatedCount: number;
  disappearedCount: number;
  errorCount: number;
}

export function ImportForm({ companySlug }: { companySlug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("companySlug", companySlug);

    const res = await fetch("/api/import", { method: "POST", body: formData });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erreur lors de l'import");
      return;
    }

    setResult(data.summary);
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm hover:file:bg-blue-100"
        />
        <button
          type="submit"
          disabled={!file || loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          {loading ? "Import en cours..." : "Importer"}
        </button>
      </form>

      {error && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-medium mb-3">Rapport d&apos;import</h2>
          <ul className="text-sm space-y-1">
            <li>Nouvelles factures : <span className="font-medium">{result.newCount}</span></li>
            <li>Factures mises à jour : <span className="font-medium">{result.updatedCount}</span></li>
            <li>Basculées en historique : <span className="font-medium">{result.disappearedCount}</span></li>
            <li className={result.errorCount > 0 ? "text-red-600" : ""}>
              Lignes en erreur : <span className="font-medium">{result.errorCount}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
