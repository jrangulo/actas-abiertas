CREATE TYPE "public"."tipo_logro" AS ENUM('validaciones_totales', 'racha_sesion', 'reportes_totales');--> statement-breakpoint
CREATE TABLE "logro" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" "tipo_logro" NOT NULL,
	"valor_objetivo" integer NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text NOT NULL,
	"icono" text,
	"orden" integer NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "logro_tipo_valor_unique" UNIQUE("tipo","valor_objetivo")
);
--> statement-breakpoint
CREATE TABLE "usuario_logro" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario_id" uuid NOT NULL,
	"logro_id" integer NOT NULL,
	"obtenido_en" timestamp with time zone DEFAULT now() NOT NULL,
	"valor_alcanzado" integer,
	CONSTRAINT "usuario_logro_unique" UNIQUE("usuario_id","logro_id")
);
--> statement-breakpoint
ALTER TABLE "usuario_logro" ADD CONSTRAINT "usuario_logro_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_logro" ADD CONSTRAINT "usuario_logro_logro_id_logro_id_fk" FOREIGN KEY ("logro_id") REFERENCES "public"."logro"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "logro_tipo_idx" ON "logro" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "logro_orden_idx" ON "logro" USING btree ("orden");--> statement-breakpoint
CREATE INDEX "usuario_logro_usuario_idx" ON "usuario_logro" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "usuario_logro_logro_idx" ON "usuario_logro" USING btree ("logro_id");--> statement-breakpoint
CREATE INDEX "usuario_logro_obtenido_idx" ON "usuario_logro" USING btree ("obtenido_en");