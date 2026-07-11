import {
  pgTable,
  serial,
  text,
  timestamp,
  numeric,
  integer,
  primaryKey,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// COMPANIES (NPONE / ONE CLOUD) — les deux sociétés, totalement séparées
// ---------------------------------------------------------------------------
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // "NPONE" | "ONE CLOUD"
  slug: text("slug").notNull().unique(), // "npone" | "one-cloud"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// USERS — comptes de connexion (NextAuth credentials)
// ---------------------------------------------------------------------------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"), // "admin" | "user"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Association many-to-many : quel utilisateur a accès à quelle société
export const userCompanies = pgTable(
  "user_companies",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.companyId] }),
  })
);

// ---------------------------------------------------------------------------
// CLIENTS — identifiés par société + nom (Odoo n'exporte pas de code client)
// ---------------------------------------------------------------------------
export const clients = pgTable(
  "clients",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(), // "Nom d'affichage du partenaire de la facture"

    // Champs internes — jamais touchés par l'import Odoo
    ice: text("ice"),
    ifNumber: text("if_number"),
    address: text("address"),
    phone: text("phone"),
    email: text("email"),
    responsable: text("responsable"),
    commercial: text("commercial"),
    gestionnaire: text("gestionnaire"),
    interventionPar: text("intervention_par"),
    plafond: numeric("plafond", { precision: 14, scale: 2 }),
    conditionsPaiement: text("conditions_paiement"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    companyNameIdx: uniqueIndex("clients_company_name_idx").on(
      t.companyId,
      t.name
    ),
  })
);

// ---------------------------------------------------------------------------
// INVOICES (FACTURES)
// Séparation stricte :
//   - champs "Odoo" -> écrasés à chaque import
//   - champs "internes" -> jamais touchés par l'import
// Clé de rapprochement : companyId + numero (numero peut être vide sur les
// brouillons Odoo ; dans ce cas on utilise draftKey, une empreinte stable
// basée sur client + date + montant, en attendant que la facture soit
// validée et obtienne un vrai numéro).
// ---------------------------------------------------------------------------
export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),

    // --- Champs Odoo (écrasés à chaque import) ---
    numero: text("numero"), // NULL si brouillon
    draftKey: text("draft_key"), // clé temporaire si numero est NULL
    dateFacturation: timestamp("date_facturation"),
    dateEcheance: timestamp("date_echeance"),
    echeanceJours: integer("echeance_jours"), // colonne "écheance" d'Odoo
    statutOdoo: text("statut_odoo").notNull(), // Brouillon / Comptabilisé / Annulé
    statutPaiement: text("statut_paiement").notNull(), // Payé / Non payées / ...
    montantHt: numeric("montant_ht", { precision: 14, scale: 2 }).notNull(),
    montantTtc: numeric("montant_ttc", { precision: 14, scale: 2 }).notNull(),
    lastImportedAt: timestamp("last_imported_at").notNull(),
    disappearedAt: timestamp("disappeared_at"), // rempli si absente d'un import -> "Historique"

    // --- Champs internes (jamais touchés par l'import) ---
    statutInterne: text("statut_interne").notNull().default("Nouvelle"),
    responsable: text("responsable"),
    priorite: text("priorite").default("Normale"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    companyNumeroIdx: uniqueIndex("invoices_company_numero_idx").on(
      t.companyId,
      t.numero
    ),
    companyDraftKeyIdx: uniqueIndex("invoices_company_draftkey_idx").on(
      t.companyId,
      t.draftKey
    ),
  })
);

// ---------------------------------------------------------------------------
// PROMESSES DE PAIEMENT — rattachées au client, pas à une facture précise
// ---------------------------------------------------------------------------
export const PRODUITS = [
  "Hébergement",
  "Infogérence",
  "Licence",
  "Azure",
  "AWS",
] as const;

export const PROMISE_STATUSES = [
  "En attente",
  "Respectée",
  "Partiellement respectée",
  "Non respectée",
] as const;

export const paymentPromises = pgTable("payment_promises", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  montantPromis: numeric("montant_promis", { precision: 14, scale: 2 }).notNull(),
  dateEcheance: timestamp("date_echeance").notNull(),
  statut: text("statut").notNull().default("En attente"),
  produit: text("produit"), // Hébergement / Infogérence / Licence / Azure / AWS
  commentaire: text("commentaire"),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// COMMENTAIRES — chronologiques, jamais supprimés
// ---------------------------------------------------------------------------
export const invoiceComments = pgTable("invoice_comments", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// IMPORT LOGS — rapport après chaque import Excel
// ---------------------------------------------------------------------------
export const importLogs = pgTable("import_logs", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  importedAt: timestamp("imported_at").defaultNow().notNull(),
  newCount: integer("new_count").notNull().default(0),
  updatedCount: integer("updated_count").notNull().default(0),
  disappearedCount: integer("disappeared_count").notNull().default(0),
  errorCount: integer("error_count").notNull().default(0),
  report: jsonb("report"), // détail complet (lignes en erreur, etc.)
});

// ---------------------------------------------------------------------------
// RELATIONS
// ---------------------------------------------------------------------------
export const companiesRelations = relations(companies, ({ many }) => ({
  clients: many(clients),
  invoices: many(invoices),
  userCompanies: many(userCompanies),
  importLogs: many(importLogs),
}));

export const usersRelations = relations(users, ({ many }) => ({
  userCompanies: many(userCompanies),
  comments: many(invoiceComments),
}));

export const userCompaniesRelations = relations(userCompanies, ({ one }) => ({
  user: one(users, { fields: [userCompanies.userId], references: [users.id] }),
  company: one(companies, {
    fields: [userCompanies.companyId],
    references: [companies.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  company: one(companies, {
    fields: [clients.companyId],
    references: [companies.id],
  }),
  invoices: many(invoices),
  promises: many(paymentPromises),
}));

export const paymentPromisesRelations = relations(paymentPromises, ({ one }) => ({
  client: one(clients, {
    fields: [paymentPromises.clientId],
    references: [clients.id],
  }),
  createdByUser: one(users, {
    fields: [paymentPromises.createdBy],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  comments: many(invoiceComments),
}));

export const invoiceCommentsRelations = relations(
  invoiceComments,
  ({ one }) => ({
    invoice: one(invoices, {
      fields: [invoiceComments.invoiceId],
      references: [invoices.id],
    }),
    user: one(users, {
      fields: [invoiceComments.userId],
      references: [users.id],
    }),
  })
);
