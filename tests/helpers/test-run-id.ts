/**
 * Identificador único de ejecución de tests
 *
 * Cada ejecución de tests (local o CI) genera un ID único que se usa para:
 * - Prefijo de datos de prueba (actas, etc.)
 * - Identificar usuarios de prueba
 * - Limpiar SOLO los datos de esta ejecución específica
 *
 * Esto permite que múltiples ejecuciones de tests corran en paralelo
 * contra la misma base de datos sin interferirse.
 */

// Generar ID único para esta ejecución (timestamp + random para evitar colisiones)
const timestamp = Date.now()
const random = Math.random().toString(36).slice(2, 8)
export const TEST_RUN_ID = `${timestamp}-${random}`

// Prefijo completo para datos de prueba de esta ejecución
export const TEST_PREFIX = `TEST-${TEST_RUN_ID}-`

// Tiempo máximo de vida de datos de prueba huérfanos (1 hora)
export const STALE_TEST_DATA_MAX_AGE_MS = 60 * 60 * 1000

/**
 * Verificar si un ID de prueba es de esta ejecución
 */
export function isCurrentRunTestId(testId: string): boolean {
  return testId.startsWith(TEST_PREFIX)
}

/**
 * Verificar si un ID de prueba es antiguo (huérfano de una ejecución anterior)
 * Los IDs tienen formato: TEST-{timestamp}-{random}-{suffix}
 */
export function isStaleTestId(testId: string): boolean {
  if (!testId.startsWith('TEST-')) return false

  // Extraer timestamp del ID
  const parts = testId.split('-')
  if (parts.length < 3) return false

  const timestamp = parseInt(parts[1], 10)
  if (isNaN(timestamp)) return false

  const age = Date.now() - timestamp
  return age > STALE_TEST_DATA_MAX_AGE_MS
}

console.log(`Test run ID: ${TEST_RUN_ID}`)
console.log(`Test prefix: ${TEST_PREFIX}`)
