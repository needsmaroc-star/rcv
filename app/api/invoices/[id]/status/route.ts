import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
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
  const invoiceId = Number(id);
  const { statutInterne } = await req.json();

  if (!statutInterne) {
    return NextResponse.json({ error: "Statut manquant" }, { status: 400 });
  }

  await db
    .update(invoices)
    .set({ statutInterne, updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId));

  return NextResponse.json({ success: true });
}
