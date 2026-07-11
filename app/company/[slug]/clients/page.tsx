import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug, getClientsForCompany } from "@/lib/data/queries";
import { InlineEditField } from "./inline-edit-field";

const PROMISE_STATUT_COLORS: Record<string, string> = {
  "En attente": "bg-gray-100 text-gray-700",
  "Respectée": "bg-green-100 text-green-800",
  "Partiellement respectée": "bg-orange-100 text-orange-800",
  "Non respectée": "bg-red-100 text-red-800",
};

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
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Responsable</th>
              <th className="px-4 py-3">Commercial</th>
              <th className="px-4 py-3">Intervention par</th>
              <th className="px-4 py-3">Total impayé</th>
              <th className="px-4 py-3">DSO</th>
              <th className="px-4 py-3">Promesse en cours</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientsList.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/company/${slug}/clients/${c.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-2 py-1.5">
                  <InlineEditField
                    clientId={c.id}
                    field="responsable"
                    initialValue={c.responsable}
                    placeholder="—"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <InlineEditField
                    clientId={c.id}
                    field="commercial"
                    initialValue={c.commercial}
                    placeholder="—"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <InlineEditField
                    clientId={c.id}
                    field="interventionPar"
                    initialValue={c.interventionPar}
                    placeholder="—"
                  />
                </td>
                <td className="px-4 py-3">
                  {c.totalImpaye > 0 ? (
                    <span className="text-red-600 font-medium">
                      {c.totalImpaye.toLocaleString("fr-MA")} MAD
                    </span>
                  ) : (
                    <span className="text-gray-400">0 MAD</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {c.dso > 0 ? `${Math.round(c.dso)} j` : "—"}
                </td>
                <td className="px-4 py-3">
                  {c.latestPromise ? (
                    <div className="text-xs">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full ${
                          PROMISE_STATUT_COLORS[c.latestPromise.statut] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {c.latestPromise.statut}
                      </span>
                      <div className="text-gray-500 mt-1">
                        {Number(c.latestPromise.montantPromis).toLocaleString("fr-MA")} MAD ·{" "}
                        {new Date(c.latestPromise.dateEcheance).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Aucune</span>
                  )}
                </td>
              </tr>
            ))}
            {clientsList.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
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
