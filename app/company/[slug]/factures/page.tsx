import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug, getInvoicesForCompany } from "@/lib/data/queries";

const STATUT_COLORS: Record<string, string> = {
  Nouvelle: "bg-gray-100 text-gray-700",
  "A relancer": "bg-yellow-100 text-yellow-800",
  "Relance 1": "bg-orange-100 text-orange-800",
  "Relance 2": "bg-orange-100 text-orange-800",
  "Relance 3": "bg-red-100 text-red-800",
  Contentieux: "bg-red-100 text-red-800",
  Promesse: "bg-blue-100 text-blue-800",
  Réglée: "bg-green-100 text-green-800",
};

export default async function FacturesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const invoicesList = await getInvoicesForCompany(company.id);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Factures — {company.name}</h1>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">Numéro</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Montant TTC</th>
              <th className="px-4 py-3">Échéance</th>
              <th className="px-4 py-3">Statut Odoo</th>
              <th className="px-4 py-3">Paiement</th>
              <th className="px-4 py-3">Statut interne</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoicesList.map((inv) => (
              <tr
                key={inv.id}
                className={inv.disappearedAt ? "opacity-40" : "hover:bg-gray-50"}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/company/${slug}/factures/${inv.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {inv.numero ?? "(brouillon)"}
                  </Link>
                </td>
                <td className="px-4 py-3">{inv.clientName}</td>
                <td className="px-4 py-3">{Number(inv.montantTtc).toLocaleString("fr-MA")}</td>
                <td className="px-4 py-3">
                  {inv.dateEcheance
                    ? new Date(inv.dateEcheance).toLocaleDateString("fr-FR")
                    : "—"}
                  {inv.echeanceJours !== null && inv.echeanceJours < 0 && (
                    <span className="ml-1 text-xs text-red-600">
                      ({Math.abs(inv.echeanceJours)}j de retard)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{inv.statutOdoo}</td>
                <td className="px-4 py-3 text-gray-500">{inv.statutPaiement}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                      STATUT_COLORS[inv.statutInterne] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {inv.statutInterne}
                  </span>
                </td>
              </tr>
            ))}
            {invoicesList.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Aucune facture. Importe un fichier Excel pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
