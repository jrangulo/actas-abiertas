ALTER TABLE "acta" ADD COLUMN "tiene_imagen" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "validacion" DROP COLUMN "tiene_imagen";