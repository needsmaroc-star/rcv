import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

/**
 * Route protégée d'initialisation : /api/setup?token=...
 * Crée les deux sociétés (NPONE, ONE CLOUD) et un compte admin par défaut.
 * Le token doit correspondre à la variable d'environnement SETUP_TOKEN.
 * Cette route ne fait rien si les données existent déjà (idempotente).
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!process.env.SETUP_TOKEN || token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ error: "Token invalide" }, { status: 403 });
  }

  const results: string[] = [];

  // 1. Sociétés
  for (const [name, slug] of [
    ["NPONE", "npone"],
    ["ONE CLOUD", "one-cloud"],
  ] as const) {
    const [existing] = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);
    if (!existing) {
      await db.insert(companies).values({ name, slug });
      results.push(`Société créée : ${name}`);
    } else {
      results.push(`Société déjà présente : ${name}`);
    }
  }

  // 2. Compte admin par défaut
  const adminEmail = "admin@npone.local";
  const [existingAdmin] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("changeme123", 10);
    await db.insert(users).values({
      email: adminEmail,
      passwordHash,
      name: "Administrateur",
      role: "admin",
    });
    results.push(
      `Compte admin créé : ${adminEmail} / changeme123 (à changer après la première connexion)`
    );
  } else {
    results.push("Compte admin déjà présent");
  }

  return NextResponse.json({ success: true, results });
}
