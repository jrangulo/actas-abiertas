CREATE TABLE "comentario_blog" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"usuario_id" uuid NOT NULL,
	"contenido" text NOT NULL,
	"padre_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"editado_en" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "comentario_blog" ADD CONSTRAINT "comentario_blog_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comentario_blog_slug_idx" ON "comentario_blog" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "comentario_blog_usuario_idx" ON "comentario_blog" USING btree ("usuario_id");--> statement-breakpoint
CREATE INDEX "comentario_blog_creado_idx" ON "comentario_blog" USING btree ("creado_en");