-- Add value columns to validacion table for consensus tracking
-- These store the values each validator confirmed/submitted

ALTER TABLE "validacion" ADD COLUMN "votos_pn" integer;
ALTER TABLE "validacion" ADD COLUMN "votos_plh" integer;
ALTER TABLE "validacion" ADD COLUMN "votos_pl" integer;
ALTER TABLE "validacion" ADD COLUMN "votos_pinu" integer;
ALTER TABLE "validacion" ADD COLUMN "votos_dc" integer;
ALTER TABLE "validacion" ADD COLUMN "votos_nulos" integer;
ALTER TABLE "validacion" ADD COLUMN "votos_blancos" integer;
ALTER TABLE "validacion" ADD COLUMN "votos_total" integer;

-- Backfill existing validations with values from acta at time of validation
-- For existing "correct" validations, use the acta's current digitado values (or oficial if no digitado)
-- This is a best-effort backfill - new validations will always have accurate values
UPDATE "validacion" v
SET 
  votos_pn = COALESCE(a.votos_pn_digitado, a.votos_pn_oficial, 0),
  votos_plh = COALESCE(a.votos_plh_digitado, a.votos_plh_oficial, 0),
  votos_pl = COALESCE(a.votos_pl_digitado, a.votos_pl_oficial, 0),
  votos_pinu = COALESCE(a.votos_pinu_digitado, a.votos_pinu_oficial, 0),
  votos_dc = COALESCE(a.votos_dc_digitado, a.votos_dc_oficial, 0),
  votos_nulos = COALESCE(a.votos_nulos_digitado, a.votos_nulos_oficial, 0),
  votos_blancos = COALESCE(a.votos_blancos_digitado, a.votos_blancos_oficial, 0),
  votos_total = COALESCE(a.votos_total_digitado, a.votos_total_oficial, 0)
FROM "acta" a
WHERE v.acta_id = a.id;

-- Now make them NOT NULL after backfill
ALTER TABLE "validacion" ALTER COLUMN "votos_pn" SET NOT NULL;
ALTER TABLE "validacion" ALTER COLUMN "votos_plh" SET NOT NULL;
ALTER TABLE "validacion" ALTER COLUMN "votos_pl" SET NOT NULL;
ALTER TABLE "validacion" ALTER COLUMN "votos_pinu" SET NOT NULL;
ALTER TABLE "validacion" ALTER COLUMN "votos_dc" SET NOT NULL;
ALTER TABLE "validacion" ALTER COLUMN "votos_nulos" SET NOT NULL;
ALTER TABLE "validacion" ALTER COLUMN "votos_blancos" SET NOT NULL;
ALTER TABLE "validacion" ALTER COLUMN "votos_total" SET NOT NULL;



