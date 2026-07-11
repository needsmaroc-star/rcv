import { db } from "@/lib/db";
import { clients, invoices, importLogs } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { ParsedInvoiceRow } from "./parseOdooExport";

export interface ReconcileSummary {
  newCount: number;
  updatedCount: number;
  disappearedCount: number;
  errorCount: number;
  report: Record<string, unknown>;
}

/**
 * Importe les lignes analysées pour UNE société.
 *
 * Règles :
 * - Le client est retrouvé (ou créé) par company + nom.
 * - La facture est retrouvée par company + numero (ou company + draftKey
 *   si la facture est un brouillon sans numéro).
 * - Si elle existe déjà : seuls les champs "Odoo" sont écrasés. Les champs
 *   internes (statutInterne, responsable, priorite) ne sont JAMAIS touchés.
 * - Si elle n'existe pas : elle est créée avec le statut interne "Nouvelle".
 * - Toute facture présente en base pour cette société mais absente de ce
 *   nouvel import est marquée `disappearedAt` (bascule en "Historique").
 */
export async function reconcileImport(
  companyId: number,
  parsedRows: ParsedInvoiceRow[],
  parseErrors: { rowIndex: number; reason: string }[]
): Promise<ReconcileSummary> {
  let newCount = 0;
  let updatedCount = 0;
  const seenInvoiceIds = new Set<number>();

  for (const row of parsedRows) {
    // 1. Client : trouver ou créer
    let [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.companyId, companyId), eq(clients.name, row.clientName)))
      .limit(1);

    if (!client) {
      [client] = await db
        .insert(clients)
        .values({ companyId, name: row.clientName })
        .returning();
    }

    // 2. Facture : trouver par numero ou draftKey
    const matchCondition = row.numero
      ? and(eq(invoices.companyId, companyId), eq(invoices.numero, row.numero))
      : and(
          eq(invoices.companyId, companyId),
          eq(invoices.draftKey, row.draftKey!)
        );

    const [existing] = await db
      .select()
      .from(invoices)
      .where(matchCondition)
      .limit(1);

    const odooFields = {
      clientId: client.id,
      numero: row.numero,
      draftKey: row.draftKey,
      dateFacturation: row.dateFacturation,
      dateEcheance: row.dateEcheance,
      echeanceJours: row.echeanceJours,
      statutOdoo: row.statutOdoo,
      statutPaiement: row.statutPaiement,
      montantHt: String(row.montantHt),
      montantTtc: String(row.montantTtc),
      lastImportedAt: new Date(),
      disappearedAt: null, // elle est présente dans cet import -> plus en historique
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(invoices)
        .set(odooFields) // les champs internes ne sont pas dans cet objet -> jamais écrasés
        .where(eq(invoices.id, existing.id));
      updatedCount++;
      seenInvoiceIds.add(existing.id);
    } else {
      const [created] = await db
        .insert(invoices)
        .values({
          companyId,
          ...odooFields,
          statutInterne: "Nouvelle",
        })
        .returning();
      newCount++;
      seenInvoiceIds.add(created.id);
    }
  }

  // 3. Factures absentes de ce nouvel import -> Historique
  const allActive = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(and(eq(invoices.companyId, companyId), isNull(invoices.disappearedAt)));

  const disappearedIds = allActive
    .map((r) => r.id)
    .filter((id) => !seenInvoiceIds.has(id));

  let disappearedCount = 0;
  for (const id of disappearedIds) {
    await db
      .update(invoices)
      .set({ disappearedAt: new Date() })
      .where(eq(invoices.id, id));
    disappearedCount++;
  }

  const summary: ReconcileSummary = {
    newCount,
    updatedCount,
    disappearedCount,
    errorCount: parseErrors.length,
    report: { parseErrors },
  };

  await db.insert(importLogs).values({
    companyId,
    newCount,
    updatedCount,
    disappearedCount,
    errorCount: parseErrors.length,
    report: summary.report,
  });

  return summary;
}
