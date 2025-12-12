/**
 * Backfill acta.actualizado_en basado en timestamps reales de validación.
 *
 * Contexto:
 * - Hubo un bulk update que puso acta.actualizado_en = NOW() para muchas filas,
 *   lo cual rompe cualquier análisis temporal (p. ej. progresión).
 *
 * Estrategia:
 * - Para actas con validaciones: actualizado_en = MAX(validacion.creado_en)
 * - Para actas sin validaciones: NO tocamos actualizado_en (por seguridad).
 *
 * Uso:
 *   pnpm tsx scripts/backfill-acta-actualizado-en.ts            # dry-run (default)
 *   pnpm tsx scripts/backfill-acta-actualizado-en.ts --apply    # ejecuta el update
 */

import 'dotenv/config'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'

function hasFlag(name: string) {
  return process.argv.includes(name)
}

async function main() {
  const apply = hasFlag('--apply')
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('La variable de entorno DATABASE_URL no está configurada')
  }

  const client = postgres(connectionString, { prepare: false })
  const db = drizzle(client)

  try {
    const [preview] = await db.execute(sql`
      WITH per_acta AS (
        SELECT
          v.acta_id,
          MAX(v.creado_en) AS validada_en
        FROM validacion v
        GROUP BY v.acta_id
      )
      SELECT
        COUNT(*)::int AS actas_con_validacion,
        COUNT(*) FILTER (WHERE a.actualizado_en IS DISTINCT FROM per_acta.validada_en)::int AS actas_a_cambiar
      FROM per_acta
      JOIN acta a ON a.id = per_acta.acta_id;
    `)

    console.log('Backfill acta.actualizado_en (basado en MAX(validacion.creado_en))')
    console.log(`- Actas con al menos 1 validación: ${preview?.actas_con_validacion ?? 0}`)
    console.log(`- Actas donde actualizado_en cambiaría: ${preview?.actas_a_cambiar ?? 0}`)
    console.log(`- Modo: ${apply ? 'APPLY' : 'DRY-RUN'}`)

    if (!apply) {
      return
    }

    const updatedRows = await db.execute(sql`
      WITH per_acta AS (
        SELECT
          v.acta_id,
          MAX(v.creado_en) AS validada_en
        FROM validacion v
        GROUP BY v.acta_id
      )
      UPDATE acta a
      SET actualizado_en = per_acta.validada_en
      FROM per_acta
      WHERE a.id = per_acta.acta_id
        AND a.actualizado_en IS DISTINCT FROM per_acta.validada_en
      RETURNING a.id;
    `)

    // drizzle/postgres-js returns an array of rows
    const count = Array.isArray(updatedRows) ? updatedRows.length : 0
    console.log(`✅ actualizado_en actualizado para ${count} actas.`)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
