-- Add autoban system: estado_usuario enum and tracking tables
CREATE TYPE "public"."estado_usuario" AS ENUM('activo', 'advertido', 'restringido', 'baneado');--> statement-breakpoint
CREATE TABLE "historial_usuario_estado" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" uuid NOT NULL,
	"estado_anterior" "estado_usuario" NOT NULL,
	"estado_nuevo" "estado_usuario" NOT NULL,
	"razon" text NOT NULL,
	"validaciones_totales" integer NOT NULL,
	"correcciones_recibidas" integer NOT NULL,
	"porcentaje_acierto" integer,
	"es_automatico" boolean DEFAULT true NOT NULL,
	"modificado_por" uuid,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "estadistica_usuario" ADD COLUMN "estado" "estado_usuario" DEFAULT 'activo' NOT NULL;--> statement-breakpoint
ALTER TABLE "estadistica_usuario" ADD COLUMN "estado_cambiado_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "estadistica_usuario" ADD COLUMN "razon_estado" text;--> statement-breakpoint
ALTER TABLE "estadistica_usuario" ADD COLUMN "ultima_advertencia_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "estadistica_usuario" ADD COLUMN "conteo_advertencias" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "estadistica_usuario" ADD COLUMN "estado_bloqueado_por_admin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "estadistica_usuario" ADD COLUMN "estado_modificado_por" uuid;--> statement-breakpoint
ALTER TABLE "historial_usuario_estado" ADD CONSTRAINT "historial_usuario_estado_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_usuario_estado" ADD CONSTRAINT "historial_usuario_estado_modificado_por_users_id_fk" FOREIGN KEY ("modificado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "historial_estado_usuario_idx" ON "historial_usuario_estado" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "historial_estado_fecha_idx" ON "historial_usuario_estado" USING btree ("creado_en");--> statement-breakpoint
ALTER TABLE "estadistica_usuario" ADD CONSTRAINT "estadistica_usuario_estado_modificado_por_users_id_fk" FOREIGN KEY ("estado_modificado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "estadistica_estado_idx" ON "estadistica_usuario" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "estadistica_accuracy_idx" ON "estadistica_usuario" USING btree ("actas_validadas","correcciones_recibidas");