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
import { departamento, municipio } from '../schema'
import { departamentosHonduras } from './departamentos'
import { municipiosHonduras } from './municipios'

async function seed() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('La variable de entorno DATABASE_URL no está configurada')
  }

  console.log('🌱 Iniciando siembra de base de datos...')

  const client = postgres(connectionString, { prepare: false })
  const db = drizzle(client)

  try {
    // Sembrar departamentos
    console.log('📍 Sembrando departamentos...')
    await db.insert(departamento).values(departamentosHonduras).onConflictDoNothing()
    console.log(`   ✓ ${departamentosHonduras.length} departamentos`)

    // Sembrar municipios
    console.log('🏘️  Sembrando municipios...')
    await db.insert(municipio).values(municipiosHonduras).onConflictDoNothing()
    console.log(`   ✓ ${municipiosHonduras.length} municipios`)

    console.log('')
    console.log('📋 Nota: Los centros de votación y JRVs deben')
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
