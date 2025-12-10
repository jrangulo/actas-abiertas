ALTER TYPE "public"."estado_acta" ADD VALUE 'bajo_revision';--> statement-breakpoint
CREATE TABLE "comentario_discrepancia" (
	"id" serial PRIMARY KEY NOT NULL,
	"acta_id" integer NOT NULL,
	"usuario_id" uuid NOT NULL,
	"contenido" text NOT NULL,
	"padre_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"editado_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "comentario_discrepancia" ADD CONSTRAINT "comentario_discrepancia_acta_id_acta_id_fk" FOREIGN KEY ("acta_id") REFERENCES "public"."acta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comentario_discrepancia" ADD CONSTRAINT "comentario_discrepancia_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comentario_discrepancia_acta_idx" ON "comentario_discrepancia" USING btree ("acta_id");--> statement-breakpoint
CREATE INDEX "comentario_discrepancia_usuario_idx" ON "comentario_discrepancia" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "comentario_discrepancia_padre_idx" ON "comentario_discrepancia" USING btree ("padre_id");