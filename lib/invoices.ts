/**
 * Définition centrale de la "facture impayée".
 *
 * Une facture est impayée si et seulement si elle est aussi échue :
 *   - Statut Odoo = "Comptabilisé" (les brouillons et annulées ne comptent jamais)
 *   - ET statut du paiement = "Non payées" ou "Partiellement réglé"
 *   - ET jours d'échéance < 0 (retard effectif ; pas encore échue = pas impayée)
 */
export interface FactureImpayeeInput {
  statutOdoo: string;
  statutPaiement: string;
  echeanceJours: number | null;
}

export function isFactureImpayee(invoice: FactureImpayeeInput): boolean {
  return (
    invoice.statutOdoo === "Comptabilisé" &&
    (invoice.statutPaiement === "Non payées" ||
      invoice.statutPaiement === "Partiellement réglé") &&
    (invoice.echeanceJours ?? 0) < 0
  );
}
