import * as XLSX from "xlsx";
import crypto from "crypto";

/**
 * Une ligne brute telle qu'exportée par Odoo, colonnes A à J de "Sheet1" :
 * Société | Nom d'affichage du partenaire de la facture | Numéro |
 * Date de facturation | Date d'échéance | écheance | Statut |
 * Statut du paiement | Montant HT Signé | Total signé en devises
 */
export interface ParsedInvoiceRow {
  companyName: string;
  clientName: string;
  numero: string | null;
  draftKey: string | null;
  dateFacturation: Date | null;
  dateEcheance: Date | null;
  echeanceJours: number | null;
  statutOdoo: string;
  statutPaiement: string;
  montantHt: number;
  montantTtc: number;
  rowIndex: number; // pour signaler les erreurs avec précision
}

export interface ParseResult {
  rows: ParsedInvoiceRow[];
  errors: { rowIndex: number; reason: string }[];
}

const EXPECTED_HEADERS = [
  "Société",
  "Nom d'affichage du partenaire de la facture",
  "Numéro",
  "Date de facturation",
  "Date d'échéance",
  "écheance",
  "Statut",
  "Statut du paiement",
  "Montant HT Signé",
  "Total signé en devises",
];

function excelDateToJsDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    // Numéro de série Excel -> date JS
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

/**
 * Génère une clé stable pour une facture brouillon (sans Numéro),
 * basée sur client + date de facturation + montant HT.
 * Reste stable tant que la facture n'est pas modifiée, ce qui permet
 * de la retrouver d'un import à l'autre même sans numéro officiel.
 */
function buildDraftKey(clientName: string, dateFacturation: Date | null, montantHt: number): string {
  const raw = `${clientName}|${dateFacturation?.toISOString() ?? ""}|${montantHt}`;
  return crypto.createHash("sha1").update(raw).digest("hex").slice(0, 16);
}

export function parseOdooExport(fileBuffer: Buffer): ParseResult {
  const workbook = XLSX.read(fileBuffer, { type: "buffer", cellDates: true });

  // On cible explicitement "Sheet1" (données brutes), jamais un onglet de
  // tableau croisé dynamique comme "Feuil1".
  const sheetName = workbook.SheetNames.includes("Sheet1")
    ? "Sheet1"
    : workbook.SheetNames[workbook.SheetNames.length - 1];
  const sheet = workbook.Sheets[sheetName];

  const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  if (raw.length === 0) {
    return { rows: [], errors: [{ rowIndex: 0, reason: "Feuille vide" }] };
  }

  const headerRow = (raw[0] as unknown[]).map((h) => String(h ?? "").trim());
  const headerIndex: Record<string, number> = {};
  EXPECTED_HEADERS.forEach((expected) => {
    const idx = headerRow.findIndex(
      (h) => h.toLowerCase() === expected.toLowerCase()
    );
    headerIndex[expected] = idx;
  });

  const missingHeaders = EXPECTED_HEADERS.filter(
    (h) => headerIndex[h] === -1
  );
  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: [
        {
          rowIndex: 0,
          reason: `Colonnes manquantes ou renommées dans le fichier : ${missingHeaders.join(", ")}`,
        },
      ],
    };
  }

  const rows: ParsedInvoiceRow[] = [];
  const errors: { rowIndex: number; reason: string }[] = [];

  for (let i = 1; i < raw.length; i++) {
    const line = raw[i] as unknown[];
    if (!line || line.every((c) => c === null || c === "")) continue; // ligne vide

    const companyName = String(line[headerIndex["Société"]] ?? "").trim();
    const clientName = String(
      line[headerIndex["Nom d'affichage du partenaire de la facture"]] ?? ""
    ).trim();
    const numeroRaw = line[headerIndex["Numéro"]];
    const numero =
      numeroRaw === null || String(numeroRaw).trim() === ""
        ? null
        : String(numeroRaw).trim();
    const dateFacturation = excelDateToJsDate(
      line[headerIndex["Date de facturation"]]
    );
    const dateEcheance = excelDateToJsDate(
      line[headerIndex["Date d'échéance"]]
    );
    const echeanceRaw = line[headerIndex["écheance"]];
    const echeanceJours =
      typeof echeanceRaw === "number" ? echeanceRaw : null;
    const statutOdoo = String(line[headerIndex["Statut"]] ?? "").trim();
    const statutPaiement = String(
      line[headerIndex["Statut du paiement"]] ?? ""
    ).trim();
    const montantHt = Number(line[headerIndex["Montant HT Signé"]] ?? 0);
    const montantTtc = Number(
      line[headerIndex["Total signé en devises"]] ?? 0
    );

    if (!companyName) {
      errors.push({ rowIndex: i + 1, reason: "Société manquante" });
      continue;
    }
    if (!clientName) {
      errors.push({ rowIndex: i + 1, reason: "Client manquant" });
      continue;
    }
    if (!statutOdoo) {
      errors.push({ rowIndex: i + 1, reason: "Statut manquant" });
      continue;
    }
    if (isNaN(montantHt) || isNaN(montantTtc)) {
      errors.push({ rowIndex: i + 1, reason: "Montant invalide" });
      continue;
    }

    const draftKey = numero
      ? null
      : buildDraftKey(clientName, dateFacturation, montantHt);

    rows.push({
      companyName,
      clientName,
      numero,
      draftKey,
      dateFacturation,
      dateEcheance,
      echeanceJours,
      statutOdoo,
      statutPaiement,
      montantHt,
      montantTtc,
      rowIndex: i + 1,
    });
  }

  return { rows, errors };
}
