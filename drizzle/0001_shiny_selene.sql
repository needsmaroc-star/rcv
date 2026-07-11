CREATE TABLE "payment_promises" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"montant_promis" numeric(14, 2) NOT NULL,
	"date_echeance" timestamp NOT NULL,
	"statut" text DEFAULT 'En attente' NOT NULL,
	"produit" text,
	"commentaire" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "responsable" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "intervention_par" text;--> statement-breakpoint
ALTER TABLE "payment_promises" ADD CONSTRAINT "payment_promises_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_promises" ADD CONSTRAINT "payment_promises_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;