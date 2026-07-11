import { notFound } from "next/navigation";
import { getClientDetail } from "@/lib/data/queries";
import { PromiseForm } from "./promise-form";
import { PromiseStatusSelect } from "./promise-status-select";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { id } = await params;
  const clientId = Number(id);
  if (isNaN(clientId)) notFound();

  const detail = await getClientDetail(clientId);
  if (!detail) notFound();

  const { client, invoices, promises, dso, totalImpaye } = detail;
  const activeInvoices = invoices.filter((i) => !i.disappearedAt);

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold mb-1">{client.name}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {client.responsable && <>Responsable : {client.responsable} · </>}
        {client.commercial && <>Commercial : {client.commercial} · </>}
        {client.interventionPar && <>Intervention par : {client.interventionPar}</>}
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-500 mb-1">Total impayé</div>
          <div className="text-2xl font-semibold text-red-600">
            {totalImpaye.toLocaleString("fr-MA")} MAD
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-500 mb-1">DSO</div>
          <div className="text-2xl font-semibold">
            {dso > 0 ? `${Math.round(dso)} jours` : "—"}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-500 mb-1">Nombre de factures</div>
          <div className="text-2xl font-semibold">{activeInvoices.length}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-medium mb-3">Promesses de paiement</h2>

        <div className="space-y-3 mb-5">
          {promises.map((p) => (
            <div key={p.id} className="border border-gray-100 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">
                  {Number(p.montantPromis).toLocaleString("fr-MA")} MAD — échéance{" "}
                  {new Date(p.dateEcheance).toLocaleDateString("fr-FR")}
                </div>
                <PromiseStatusSelect promiseId={p.id} currentStatus={p.statut} />
              </div>
              {p.produit && (
                <div className="text-xs text-gray-500 mb-1">Produit : {p.produit}</div>
              )}
              {p.commentaire && (
                <div className="text-sm text-gray-600">{p.commentaire}</div>
              )}
            </div>
          ))}
          {promises.length === 0 && (
            <p className="text-sm text-gray-400">Aucune promesse enregistrée.</p>
          )}
        </div>

        <PromiseForm clientId={client.id} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <h2 className="text-sm font-medium px-5 pt-5 pb-3">Factures</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-left text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2">Numéro</th>
              <th className="px-4 py-2">Montant TTC</th>
              <th className="px-4 py-2">Échéance</th>
              <th className="px-4 py-2">Statut</th>
              <th className="px-4 py-2">Paiement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeInvoices.map((inv) => (
              <tr key={inv.id}>
                <td className="px-4 py-2">{inv.numero ?? "(brouillon)"}</td>
                <td className="px-4 py-2">{Number(inv.montantTtc).toLocaleString("fr-MA")}</td>
                <td className="px-4 py-2">
                  {inv.dateEcheance
                    ? new Date(inv.dateEcheance).toLocaleDateString("fr-FR")
                    : "—"}
                </td>
                <td className="px-4 py-2 text-gray-500">{inv.statutOdoo}</td>
                <td className="px-4 py-2 text-gray-500">{inv.statutPaiement}</td>
              </tr>
            ))}
            {activeInvoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Aucune facture.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
