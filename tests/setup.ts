/**
 * Archivo de configuración de tests para Vitest
 *
 * Se ejecuta antes de todos los tests para verificar que la base de datos esté lista.
 */

import { beforeAll } from 'vitest'
import 'dotenv/config'

// Registrar qué variables de entorno están disponibles (para depuración)
const hasDbUrl = !!process.env.DATABASE_URL
const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Test environment:', {
  DATABASE_URL: hasDbUrl ? '✓ configurado' : '✗ falta',
  SUPABASE_SERVICE_ROLE_KEY: hasServiceKey
    ? '✓ configurado'
    : '✗ falta (tests de integración serán omitidos)',
})

// Solo verificar conexión a BD si DATABASE_URL está configurado
beforeAll(async () => {
  if (!hasDbUrl) {
    console.warn('⚠️  DATABASE_URL no configurado - los tests de base de datos fallarán')
    return
  }

  try {
    // Import dinámico para evitar problemas de carga de módulos
    const { db } = await import('@/db')
    const { sql } = await import('drizzle-orm')

    await db.execute(sql`SELECT 1`)
    console.log('✓ Conexión a base de datos establecida')
  } catch (error) {
    console.error('✗ Error al conectar a la base de datos:', error)
    // No lanzar error - dejar que los tests individuales manejen fallos de conexión
  }
}, 30000) // 30s timeout para conexión
