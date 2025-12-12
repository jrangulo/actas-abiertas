/**
 * Script de Siembra de Base de Datos
 *
 * Ejecutar con: pnpm db:seed
 *
 * Este script llena la base de datos con datos de referencia iniciales
 * como departamentos y municipios.
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { logro } from '../schema'
import { logrosSistema } from './logros'

async function seed() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('La variable de entorno DATABASE_URL no está configurada')
  }

  console.log('🌱 Iniciando siembra de base de datos...')

  const client = postgres(connectionString, { prepare: false })
  const db = drizzle(client)

  try {
    // Nota: Departamentos/municipios/centros se pueden sembrar aquí si se habilita más adelante.

    // 4. Logros (Achievements)
    console.log('🏆 Sembrando logros del sistema...')
    await db.insert(logro).values(logrosSistema).onConflictDoNothing()
    console.log(`   ✓ ${logrosSistema.length} logros disponibles`)

    console.log('')
    console.log('📋 Nota: Las JRVs deben')
    console.log('   importarse de datos oficiales del CNE cuando estén disponibles.')
    console.log('')
    console.log('✅ ¡Siembra completada exitosamente!')
  } catch (error) {
    console.error('❌ Siembra fallida:', error)
    throw error
  } finally {
    await client.end()
  }
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
