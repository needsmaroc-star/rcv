import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { paymentPromises } from "@/lib/db/schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const clientId = Number(id);
  const { montantPromis, dateEcheance, produit, commentaire } = await req.json();

  if (!montantPromis || !dateEcheance) {
    return NextResponse.json(
      { error: "Montant et date d'échéance requis" },
      { status: 400 }
    );
  }

  await db.insert(paymentPromises).values({
    clientId,
    montantPromis: String(montantPromis),
    dateEcheance: new Date(dateEcheance),
    produit: produit || null,
    commentaire: commentaire || null,
    createdBy: Number(session.user.id),
  });

  return NextResponse.json({ success: true });
}
