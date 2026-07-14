CREATE TABLE "collection_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"type" text NOT NULL,
	"action_date" timestamp DEFAULT now() NOT NULL,
	"coupure_deadline" timestamp,
	"comment" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "blocage" text DEFAULT 'Sans blocage' NOT NULL;--> statement-breakpoint
ALTER TABLE "collection_actions" ADD CONSTRAINT "collection_actions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_actions" ADD CONSTRAINT "collection_actions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
