import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { invoiceComments, users } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getInvoiceDetail } from "@/lib/data/queries";
import { InvoiceStatusForm } from "./status-form";
import { CommentForm } from "./comment-form";

const STATUTS_INTERNES = [
  "Nouvelle",
  "A relancer",
  "Relance 1",
  "Relance 2",
  "Relance 3",
  "Avis de coupure",
  "Contentieux",
  "Suspendu",
  "Promesse",
  "En négociation",
  "Réglée",
  "Litige",
  "Annulée",
];

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { id } = await params;
  const invoiceId = Number(id);
  if (isNaN(invoiceId)) notFound();

  const row = await getInvoiceDetail(invoiceId);
  if (!row) notFound();

  const { invoices: invoice, clients: client } = row;

  const comments = await db
    .select({
      id: invoiceComments.id,
      content: invoiceComments.content,
      createdAt: invoiceComments.createdAt,
      userName: users.name,
    })
    .from(invoiceComments)
    .leftJoin(users, eq(invoiceComments.userId, users.id))
    .where(eq(invoiceComments.invoiceId, invoiceId))
    .orderBy(asc(invoiceComments.createdAt));

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-1">
        {invoice.numero ?? "(Facture brouillon)"}
      </h1>
      <p className="text-sm text-gray-500 mb-6">{client.name}</p>

      {invoice.disappearedAt && (
        <div className="mb-6 text-sm bg-gray-100 text-gray-600 rounded-lg px-3 py-2">
          Cette facture n&apos;apparaît plus dans le dernier import Odoo — elle est
          conservée en historique.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Field label="Montant HT" value={`${Number(invoice.montantHt).toLocaleString("fr-MA")} MAD`} />
        <Field label="Montant TTC" value={`${Number(invoice.montantTtc).toLocaleString("fr-MA")} MAD`} />
        <Field
          label="Date de facturation"
          value={invoice.dateFacturation ? new Date(invoice.dateFacturation).toLocaleDateString("fr-FR") : "—"}
        />
        <Field
          label="Date d'échéance"
          value={invoice.dateEcheance ? new Date(invoice.dateEcheance).toLocaleDateString("fr-FR") : "—"}
        />
        <Field label="Statut Odoo" value={invoice.statutOdoo} />
        <Field label="Statut du paiement" value={invoice.statutPaiement} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-medium mb-3">Statut interne</h2>
        <InvoiceStatusForm
          invoiceId={invoice.id}
          currentStatus={invoice.statutInterne}
          options={STATUTS_INTERNES}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-medium mb-3">Commentaires</h2>
        <div className="space-y-3 mb-4">
          {comments.map((c) => (
            <div key={c.id} className="text-sm border-b border-gray-100 pb-2">
              <div className="text-gray-400 text-xs mb-0.5">
                {c.userName ?? "Utilisateur"} · {new Date(c.createdAt).toLocaleString("fr-FR")}
              </div>
              <div>{c.content}</div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-gray-400">Aucun commentaire pour l&apos;instant.</p>
          )}
        </div>
        <CommentForm invoiceId={invoice.id} />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
