import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { invoiceComments } from "@/lib/db/schema";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const invoiceId = Number(id);
  const { content } = await req.json();

  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Commentaire vide" }, { status: 400 });
  }

  await db.insert(invoiceComments).values({
    invoiceId,
    userId: Number(session.user.id),
    content: content.trim(),
  });

  return NextResponse.json({ success: true });
}
