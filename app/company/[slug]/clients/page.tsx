import { notFound } from "next/navigation";
import { getCompanyBySlug, getClientsForCompany } from "@/lib/data/queries";

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const clientsList = await getClientsForCompany(company.id);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Clients — {company.name}</h1>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Commercial</th>
              <th className="px-4 py-3">Gestionnaire</th>
              <th className="px-4 py-3">Conditions de paiement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientsList.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-500">{c.commercial ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.gestionnaire ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.conditionsPaiement ?? "—"}</td>
              </tr>
            ))}
            {clientsList.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  Aucun client. Importe un fichier Excel pour commencer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
