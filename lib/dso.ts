import { isFactureImpayee } from "@/lib/invoices";

/**
 * Calcul du DSO (Days Sales Outstanding / Délai moyen de recouvrement).
 *
 * Règle demandée : seules les factures au statut Odoo "Comptabilisé" sont
 * prises en compte pour le chiffre d'affaires. Les brouillons et les
 * factures annulées sont exclus. L'impayé utilise la définition centrale
 * `isFactureImpayee` (voir lib/invoices.ts).
 *
 * Formule utilisée : DSO = (Total impayé / Total facturé) × nombre de jours
 * de la période couverte par les factures considérées (au minimum 30 jours,
 * pour éviter un DSO artificiellement énorme quand on n'a que quelques
 * jours de données).
 */
export interface DsoInvoiceInput {
  statutOdoo: string;
  statutPaiement: string;
  montantTtc: number;
  dateFacturation: Date | null;
  echeanceJours: number | null;
}

export function computeDSO(invoicesInput: DsoInvoiceInput[]): number {
  const comptabilisees = invoicesInput.filter(
    (i) => i.statutOdoo === "Comptabilisé"
  );
  if (comptabilisees.length === 0) return 0;

  const totalCA = comptabilisees.reduce((sum, i) => sum + i.montantTtc, 0);
  if (totalCA === 0) return 0;

  const totalImpaye = comptabilisees
    .filter(isFactureImpayee)
    .reduce((sum, i) => sum + i.montantTtc, 0);

  const dates = comptabilisees
    .map((i) => i.dateFacturation)
    .filter((d): d is Date => d !== null);

  let periodDays = 30;
  if (dates.length > 1) {
    const min = Math.min(...dates.map((d) => d.getTime()));
    const max = Math.max(...dates.map((d) => d.getTime()));
    periodDays = Math.max((max - min) / (1000 * 60 * 60 * 24), 30);
  }

  return (totalImpaye / totalCA) * periodDays;
}
