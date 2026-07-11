import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { paymentPromises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const promiseId = Number(id);
  const { statut, commentaire } = await req.json();

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (statut !== undefined) updates.statut = statut;
  if (commentaire !== undefined) updates.commentaire = commentaire;

  await db.update(paymentPromises).set(updates).where(eq(paymentPromises.id, promiseId));

  return NextResponse.json({ success: true });
}
