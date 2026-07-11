import { notFound } from "next/navigation";
import { getCompanyBySlug, getDashboardStats } from "@/lib/data/queries";

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

  const cards = [
    { label: "Total facturé", value: formatMAD(stats.totalFacture) },
    { label: "Total impayé", value: formatMAD(stats.totalImpaye), accent: "text-red-600" },
    { label: "Montant échu", value: formatMAD(stats.montantEchu), accent: "text-orange-600" },
    { label: "Montant non échu", value: formatMAD(stats.montantNonEchu) },
    { label: "Nombre de clients", value: stats.nombreClients },
    { label: "Nombre de factures", value: stats.nombreFactures },
    { label: "Factures impayées", value: stats.nombreImpayees },
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
    </div>
  );
}
