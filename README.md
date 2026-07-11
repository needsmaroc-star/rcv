# Recouvrement — NPONE & ONE CLOUD

Application de gestion du recouvrement des factures, pour deux sociétés
totalement séparées (NPONE et ONE CLOUD), alimentée par des exports Excel
Odoo.

## Stack

Next.js (App Router) · TypeScript · TailwindCSS v4 · Drizzle ORM · Neon
(PostgreSQL) · NextAuth v5

## Déploiement

1. **Neon** — créer un projet, copier la chaîne de connexion dans
   `DATABASE_URL`.
2. **Vercel** — importer ce dépôt GitHub, renseigner les variables
   d'environnement (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`,
   `SETUP_TOKEN`), déployer.
3. **Créer les tables** — depuis un terminal avec ce dépôt et les variables
   d'environnement chargées :
   ```
   npx drizzle-kit push
   ```
4. **Initialiser les données** — visiter
   `https://TON-APP.vercel.app/api/setup?token=LE_SETUP_TOKEN` une seule
   fois. Ça crée les sociétés NPONE / ONE CLOUD et un compte admin
   (`admin@npone.local` / `changeme123` — à changer après la première
   connexion).

## Import Excel

Chaque société a sa propre page d'import (`/company/npone/import` ou
`/company/one-cloud/import`). Le fichier attendu est l'export Odoo tel
quel, avec l'onglet `Sheet1` contenant les colonnes : Société, Nom
d'affichage du partenaire de la facture, Numéro, Date de facturation,
Date d'échéance, écheance, Statut, Statut du paiement, Montant HT Signé,
Total signé en devises.

Les champs saisis manuellement (statut interne, commentaires) ne sont
jamais écrasés par un import.
