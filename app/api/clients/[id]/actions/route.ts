import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { collectionActions, COLLECTION_ACTION_TYPES } from "@/lib/db/schema";

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
  const { type, comment, coupureDeadline } = await req.json();

  if (!COLLECTION_ACTION_TYPES.includes(type)) {
    return NextResponse.json({ error: "Type d'action invalide" }, { status: 400 });
  }

  if (type === "Avis de coupure" && !coupureDeadline) {
    return NextResponse.json(
      { error: "Délai avant coupure requis" },
      { status: 400 }
    );
  }

  await db.insert(collectionActions).values({
    clientId,
    type,
    coupureDeadline: coupureDeadline ? new Date(coupureDeadline) : null,
    comment: comment || null,
    createdBy: Number(session.user.id),
  });

  return NextResponse.json({ success: true });
}
