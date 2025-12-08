CREATE TYPE "public"."estado_acta" AS ENUM('pendiente', 'en_proceso', 'digitada', 'en_validacion', 'validada', 'con_discrepancia');--> statement-breakpoint
CREATE TYPE "public"."tipo_cambio" AS ENUM('digitacion_inicial', 'correccion_validador', 'rectificacion');--> statement-breakpoint
CREATE TYPE "public"."tipo_discrepancia" AS ENUM('ilegible', 'adulterada', 'datos_inconsistentes', 'imagen_incompleta', 'valores_incorrectos', 'otro');--> statement-breakpoint
CREATE TYPE "public"."tipo_zona" AS ENUM('urbano', 'rural');--> statement-breakpoint
CREATE TABLE "acta" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"cne_id" text,
	"departamento_codigo" smallint,
	"municipio_codigo" smallint,
	"centro_codigo" smallint,
	"tipo_zona" "tipo_zona" NOT NULL,
	"jrv_numero" smallint,
	"votos_nulos_oficial" integer,
	"votos_blancos_oficial" integer,
	"votos_pn_oficial" integer,
	"votos_plh_oficial" integer,
	"votos_pl_oficial" integer,
	"votos_pinu_oficial" integer,
	"votos_dc_oficial" integer,
	"votos_total_oficial" integer,
	"votos_pn_digitado" integer,
	"votos_plh_digitado" integer,
	"votos_pl_digitado" integer,
	"votos_pinu_digitado" integer,
	"votos_dc_digitado" integer,
	"votos_nulos_digitado" integer,
	"votos_blancos_digitado" integer,
	"votos_total_digitado" integer,
	"votantes_registrados" integer,
	"papeletas_recibidas" integer,
	"papeletas_utilizadas" integer,
	"papeletas_no_utilizadas" integer,
	"votantes_ciudadanos" integer,
	"votantes_jrv" integer,
	"votantes_custodios" integer,
	"total_votantes" integer,
	"publicada_en_cne" boolean,
	"escrutada_en_cne" boolean,
	"digitalizada_en_cne" boolean,
	"etiquetas_cne" json,
	"estado" "estado_acta" DEFAULT 'pendiente' NOT NULL,
	"digitado_por" uuid,
	"digitado_en" timestamp with time zone,
	"bloqueado_hasta" timestamp with time zone,
	"bloqueado_por" uuid,
	"cantidad_validaciones" integer DEFAULT 0 NOT NULL,
	"cantidad_validaciones_correctas" integer DEFAULT 0 NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "acta_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "acta_cne_id_unique" UNIQUE("cne_id"),
	CONSTRAINT "acta_jrv_unique" UNIQUE("departamento_codigo","municipio_codigo","centro_codigo","jrv_numero")
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "centro_votacion" (
	"departamento_codigo" smallint NOT NULL,
	"municipio_codigo" smallint NOT NULL,
	"codigo" smallint NOT NULL,
	"nombre" text NOT NULL,
	"tipo_zona" "tipo_zona" NOT NULL,
	"direccion" text,
	CONSTRAINT "centro_votacion_pkey" PRIMARY KEY("departamento_codigo","municipio_codigo","codigo","tipo_zona")
);
--> statement-breakpoint
CREATE TABLE "departamento" (
	"codigo" smallint PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discrepancia" (
	"id" serial PRIMARY KEY NOT NULL,
	"acta_id" integer NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo" "tipo_discrepancia" NOT NULL,
	"descripcion" text,
	"resuelta" boolean DEFAULT false NOT NULL,
	"resuelta_por" uuid,
	"resolucion_comentario" text,
	"resuelta_en" timestamp with time zone,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estadistica_usuario" (
	"usuario_id" uuid PRIMARY KEY NOT NULL,
	"actas_digitadas" integer DEFAULT 0 NOT NULL,
	"actas_validadas" integer DEFAULT 0 NOT NULL,
	"validaciones_correctas" integer DEFAULT 0 NOT NULL,
	"discrepancias_reportadas" integer DEFAULT 0 NOT NULL,
	"correcciones_recibidas" integer DEFAULT 0 NOT NULL,
	"primera_actividad" timestamp with time zone,
	"ultima_actividad" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "historial_digitacion" (
	"id" serial PRIMARY KEY NOT NULL,
	"acta_id" integer NOT NULL,
	"usuario_id" uuid NOT NULL,
	"tipo_cambio" "tipo_cambio" NOT NULL,
	"votos_pn" integer,
	"votos_plh" integer,
	"votos_pl" integer,
	"votos_pinu" integer,
	"votos_dc" integer,
	"votos_total" integer,
	"comentario" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jrv" (
	"departamento_codigo" smallint NOT NULL,
	"municipio_codigo" smallint NOT NULL,
	"centro_codigo" smallint NOT NULL,
	"tipo_zona" "tipo_zona" NOT NULL,
	"numero" smallint NOT NULL,
	"votantes_registrados" integer,
	CONSTRAINT "jrv_pkey" PRIMARY KEY("departamento_codigo","municipio_codigo","centro_codigo","numero")
);
--> statement-breakpoint
CREATE TABLE "municipio" (
	"departamento_codigo" smallint NOT NULL,
	"codigo" smallint NOT NULL,
	"nombre" text NOT NULL,
	CONSTRAINT "municipio_departamento_codigo_codigo_pk" PRIMARY KEY("departamento_codigo","codigo")
);
--> statement-breakpoint
CREATE TABLE "validacion" (
	"acta_id" integer NOT NULL,
	"usuario_id" uuid NOT NULL,
	"es_correcto" boolean NOT NULL,
	"historial_correccion_id" integer,
	"comentario" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "validacion_acta_id_usuario_id_pk" PRIMARY KEY("acta_id","usuario_id")
);
--> statement-breakpoint
ALTER TABLE "acta" ADD CONSTRAINT "acta_digitado_por_users_id_fk" FOREIGN KEY ("digitado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acta" ADD CONSTRAINT "acta_bloqueado_por_users_id_fk" FOREIGN KEY ("bloqueado_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acta" ADD CONSTRAINT "acta_jrv_fk" FOREIGN KEY ("departamento_codigo","municipio_codigo","centro_codigo","jrv_numero") REFERENCES "public"."jrv"("departamento_codigo","municipio_codigo","centro_codigo","numero") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centro_votacion" ADD CONSTRAINT "centro_votacion_municipio_fk" FOREIGN KEY ("departamento_codigo","municipio_codigo") REFERENCES "public"."municipio"("departamento_codigo","codigo") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discrepancia" ADD CONSTRAINT "discrepancia_acta_id_acta_id_fk" FOREIGN KEY ("acta_id") REFERENCES "public"."acta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discrepancia" ADD CONSTRAINT "discrepancia_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discrepancia" ADD CONSTRAINT "discrepancia_resuelta_por_users_id_fk" FOREIGN KEY ("resuelta_por") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estadistica_usuario" ADD CONSTRAINT "estadistica_usuario_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_digitacion" ADD CONSTRAINT "historial_digitacion_acta_id_acta_id_fk" FOREIGN KEY ("acta_id") REFERENCES "public"."acta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_digitacion" ADD CONSTRAINT "historial_digitacion_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jrv" ADD CONSTRAINT "jrv_centro_votacion_fk" FOREIGN KEY ("departamento_codigo","municipio_codigo","centro_codigo","tipo_zona") REFERENCES "public"."centro_votacion"("departamento_codigo","municipio_codigo","codigo","tipo_zona") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "municipio" ADD CONSTRAINT "municipio_departamento_codigo_departamento_codigo_fk" FOREIGN KEY ("departamento_codigo") REFERENCES "public"."departamento"("codigo") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validacion" ADD CONSTRAINT "validacion_acta_id_acta_id_fk" FOREIGN KEY ("acta_id") REFERENCES "public"."acta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validacion" ADD CONSTRAINT "validacion_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validacion" ADD CONSTRAINT "validacion_historial_correccion_id_historial_digitacion_id_fk" FOREIGN KEY ("historial_correccion_id") REFERENCES "public"."historial_digitacion"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "acta_estado_idx" ON "acta" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "acta_disponible_idx" ON "acta" USING btree ("estado","bloqueado_hasta");--> statement-breakpoint
CREATE INDEX "acta_para_validar_idx" ON "acta" USING btree ("estado","cantidad_validaciones");--> statement-breakpoint
CREATE INDEX "acta_departamento_idx" ON "acta" USING btree ("departamento_codigo");--> statement-breakpoint
CREATE INDEX "acta_municipio_idx" ON "acta" USING btree ("departamento_codigo","municipio_codigo");--> statement-breakpoint
CREATE INDEX "acta_centro_idx" ON "acta" USING btree ("departamento_codigo","municipio_codigo","centro_codigo");--> statement-breakpoint
CREATE INDEX "acta_jrv_idx" ON "acta" USING btree ("departamento_codigo","municipio_codigo","centro_codigo","jrv_numero");--> statement-breakpoint
CREATE INDEX "discrepancia_acta_idx" ON "discrepancia" USING btree ("acta_id");--> statement-breakpoint
CREATE INDEX "discrepancia_tipo_idx" ON "discrepancia" USING btree ("tipo");--> statement-breakpoint
CREATE INDEX "discrepancia_resuelta_idx" ON "discrepancia" USING btree ("resuelta");--> statement-breakpoint
CREATE INDEX "estadistica_digitadas_idx" ON "estadistica_usuario" USING btree ("actas_digitadas");--> statement-breakpoint
CREATE INDEX "estadistica_validadas_idx" ON "estadistica_usuario" USING btree ("actas_validadas");--> statement-breakpoint
CREATE INDEX "estadistica_ultima_actividad_idx" ON "estadistica_usuario" USING btree ("ultima_actividad");--> statement-breakpoint
CREATE INDEX "historial_acta_idx" ON "historial_digitacion" USING btree ("acta_id");--> statement-breakpoint
CREATE INDEX "historial_usuario_idx" ON "historial_digitacion" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "validacion_acta_idx" ON "validacion" USING btree ("acta_id");