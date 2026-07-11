import { db } from "@/lib/db";
import { companies, invoices, clients } from "@/lib/db/schema";
import { and, eq, isNull, desc } from "drizzle-orm";

export async function getCompanyBySlug(slug: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);
  return company ?? null;
}

export async function getAllCompanies() {
  return db.select().from(companies).orderBy(companies.name);
}

export async function getDashboardStats(companyId: number) {
  const active = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.companyId, companyId), isNull(invoices.disappearedAt)));

  const nonAnnulees = active.filter((i) => i.statutOdoo !== "Annulé");
  const impayees = nonAnnulees.filter(
    (i) => i.statutPaiement === "Non payées" || i.statutPaiement === "Partiellement réglé"
  );

  const totalFacture = nonAnnulees.reduce((sum, i) => sum + Number(i.montantTtc), 0);
  const totalImpaye = impayees.reduce((sum, i) => sum + Number(i.montantTtc), 0);
  const montantEchu = impayees
    .filter((i) => (i.echeanceJours ?? 0) < 0)
    .reduce((sum, i) => sum + Number(i.montantTtc), 0);
  const montantNonEchu = totalImpaye - montantEchu;

  const clientCount = await db
    .select()
    .from(clients)
    .where(eq(clients.companyId, companyId));

  return {
    totalFacture,
    totalImpaye,
    montantEchu,
    montantNonEchu,
    nombreFactures: nonAnnulees.length,
    nombreClients: clientCount.length,
    nombreImpayees: impayees.length,
  };
}

export async function getInvoicesForCompany(companyId: number) {
  return db
    .select({
      id: invoices.id,
      numero: invoices.numero,
      clientName: clients.name,
      montantTtc: invoices.montantTtc,
      dateEcheance: invoices.dateEcheance,
      echeanceJours: invoices.echeanceJours,
      statutOdoo: invoices.statutOdoo,
      statutPaiement: invoices.statutPaiement,
      statutInterne: invoices.statutInterne,
      disappearedAt: invoices.disappearedAt,
    })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.companyId, companyId))
    .orderBy(desc(invoices.dateFacturation));
}

export async function getInvoiceDetail(invoiceId: number) {
  const [row] = await db
    .select()
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.id, invoiceId))
    .limit(1);
  return row ?? null;
}

export async function getClientsForCompany(companyId: number) {
  return db
    .select()
    .from(clients)
    .where(eq(clients.companyId, companyId))
    .orderBy(clients.name);
}
