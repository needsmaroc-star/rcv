import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompanyBySlug, getDashboardStats, getClientsForCompany } from "@/lib/data/queries";
import { ActionSelect } from "./action-select";
import { BlocageSelect } from "./blocage-select";

const PROMISE_STATUT_COLORS: Record<string, string> = {
  "En attente": "bg-gray-100 text-gray-700",
  "Respectée": "bg-green-100 text-green-800",
  "Partiellement respectée": "bg-orange-100 text-orange-800",
  "Non respectée": "bg-red-100 text-red-800",
};

function formatMAD(amount: number) {
  return new Intl.NumberFormat("fr-MA", {
    maximumFractionDigits: 0,
  }).format(amount) + " MAD";
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const stats = await getDashboardStats(company.id);
  const clientsList = (await getClientsForCompany(company.id))
    .filter((c) => c.montantEchu > 0)
    .sort((a, b) => b.montantEchu - a.montantEchu);

  const cards = [
    { label: "Total facturé", value: formatMAD(stats.totalFacture) },
    { label: "Total impayé", value: formatMAD(stats.totalImpaye), accent: "text-red-600" },
    { label: "Montant échu", value: formatMAD(stats.montantEchu), accent: "text-orange-600" },
    { label: "Montant non échu", value: formatMAD(stats.montantNonEchu) },
    { label: "Nombre de clients", value: stats.nombreClients },
    { label: "Nombre de factures", value: stats.nombreFactures },
    { label: "Factures impayées", value: stats.nombreImpayees },
    { label: "Factures échues", value: stats.nombreEchues, accent: "text-orange-600" },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Dashboard — {company.name}</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <div className="text-xs text-gray-500 mb-1">{c.label}</div>
            <div className={`text-2xl font-semibold ${c.accent ?? ""}`}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mt-10 mb-4">Clients en retard de paiement</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Montant impayé échu</th>
              <th className="px-4 py-3">Action de recouvrement</th>
              <th className="px-4 py-3">Dernière action</th>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Blocage</th>
              <th className="px-4 py-3">Promesse de paiement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientsList.map((c) => {
              const lastAction = c.lastAction;
              const coupureDepassee =
                !!lastAction &&
                lastAction.type === "Avis de coupure" &&
                !!lastAction.coupureDeadline &&
                new Date(lastAction.coupureDeadline).getTime() < Date.now();

              return (
              <tr key={c.id} className={coupureDepassee ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}>
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/company/${slug}/clients/${c.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-red-600 font-medium">
                  {formatMAD(c.montantEchu)}
                </td>
                <td className="px-2 py-1.5">
                  <ActionSelect
                    clientId={c.id}
                    currentAction={c.lastAction?.type ?? null}
                    currentCoupureDeadline={c.lastAction?.coupureDeadline ?? null}
                  />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {c.lastAction
                    ? new Date(c.lastAction.actionDate).toLocaleDateString("fr-FR")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {c.latestPromise?.produit ?? "—"}
                </td>
                <td className="px-2 py-1.5">
                  <BlocageSelect clientId={c.id} currentBlocage={c.blocage} />
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
              );
            })}
            {clientsList.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Aucun client en retard de paiement.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
