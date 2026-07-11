import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { companies } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseOdooExport } from "@/lib/import/parseOdooExport";
import { reconcileImport } from "@/lib/import/reconcile";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const companySlug = formData.get("companySlug") as string | null;

  if (!file || !companySlug) {
    return NextResponse.json(
      { error: "Fichier ou société manquant" },
      { status: 400 }
    );
  }

  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, companySlug))
    .limit(1);

  if (!company) {
    return NextResponse.json({ error: "Société inconnue" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { rows, errors } = parseOdooExport(buffer);

  // Sécurité : le fichier doit correspondre à la société sélectionnée
  const wrongCompanyRows = rows.filter(
    (r) => r.companyName.trim().toLowerCase() !== company.name.toLowerCase()
  );
  if (rows.length > 0 && wrongCompanyRows.length === rows.length) {
    return NextResponse.json(
      {
        error: `Ce fichier semble contenir des données pour "${rows[0].companyName}", pas pour "${company.name}". Vérifie le fichier sélectionné.`,
      },
      { status: 400 }
    );
  }

  const validRows = rows.filter(
    (r) => r.companyName.trim().toLowerCase() === company.name.toLowerCase()
  );

  const summary = await reconcileImport(company.id, validRows, errors);

  return NextResponse.json({ success: true, summary });
}
