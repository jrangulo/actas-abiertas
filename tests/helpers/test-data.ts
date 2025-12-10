/**
 * Helpers de datos de prueba
 *
 * Utilidades para crear y limpiar datos de prueba en la base de datos
 */

import { db } from '@/db'
import {
  acta,
  validacion,
  historialDigitacion,
  estadisticaUsuario,
  historialUsuarioEstado,
} from '@/db/schema'
import { eq, like, inArray } from 'drizzle-orm'

// Prefijo para datos de prueba para identificar y limpiar fácilmente
export const TEST_PREFIX = 'TEST-'

// Valores de votos estándar para pruebas
export const STANDARD_VOTES = {
  pn: 100,
  plh: 80,
  pl: 60,
  pinu: 10,
  dc: 5,
  nulos: 3,
  blancos: 2,
}

export const DIFFERENT_VOTES_1 = {
  pn: 101, // ¡Diferente!
  plh: 80,
  pl: 60,
  pinu: 10,
  dc: 5,
  nulos: 3,
  blancos: 2,
}

export const DIFFERENT_VOTES_2 = {
  pn: 100,
  plh: 81, // ¡Diferente!
  pl: 60,
  pinu: 10,
  dc: 5,
  nulos: 3,
  blancos: 2,
}

/**
 * Generar un ID de prueba único
 */
export function generateTestId(): string {
  return `${TEST_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export interface TestActa {
  id: number
  uuid: string
  cneId: string
}

/**
 * Crear un acta de prueba en la base de datos
 * El acta tendrá valores CNE configurados y estará lista para validación
 */
export async function createTestActa(votes = STANDARD_VOTES): Promise<TestActa> {
  const testCneId = generateTestId()
  const total =
    votes.pn + votes.plh + votes.pl + votes.pinu + votes.dc + votes.nulos + votes.blancos

  const [inserted] = await db
    .insert(acta)
    .values({
      cneId: testCneId,
      tipoZona: 'urbano',
      escrutadaEnCne: true,
      // Establecer valores oficiales CNE
      votosPnOficial: votes.pn,
      votosPlhOficial: votes.plh,
      votosPlOficial: votes.pl,
      votosPinuOficial: votes.pinu,
      votosDcOficial: votes.dc,
      votosNulosOficial: votes.nulos,
      votosBlancosOficial: votes.blancos,
      votosTotalOficial: total,
      // También establecer como "digitado" para que la validación pueda usar estos valores
      votosPnDigitado: votes.pn,
      votosPlhDigitado: votes.plh,
      votosPlDigitado: votes.pl,
      votosPinuDigitado: votes.pinu,
      votosDcDigitado: votes.dc,
      votosNulosDigitado: votes.nulos,
      votosBlancosDigitado: votes.blancos,
      votosTotalDigitado: total,
      estado: 'digitada',
      cantidadValidaciones: 0,
      cantidadValidacionesCorrectas: 0,
    })
    .returning({ id: acta.id, uuid: acta.uuid, cneId: acta.cneId })

  return {
    id: inserted.id,
    uuid: inserted.uuid!,
    cneId: inserted.cneId!,
  }
}

/**
 * Obtener un acta por ID
 */
export async function getTestActa(actaId: number) {
  const [result] = await db.select().from(acta).where(eq(acta.id, actaId)).limit(1)
  return result
}

/**
 * Obtener estadísticas de usuario
 */
export async function getUserStats(userId: string) {
  const [result] = await db
    .select()
    .from(estadisticaUsuario)
    .where(eq(estadisticaUsuario.usuarioId, userId))
    .limit(1)
  return result
}

/**
 * Limpiar un acta de prueba específica y sus datos relacionados
 */
export async function cleanupTestActa(actaId: number): Promise<void> {
  // Eliminar validaciones primero (restricción FK)
  await db.delete(validacion).where(eq(validacion.actaId, actaId))
  // Eliminar historial
  await db.delete(historialDigitacion).where(eq(historialDigitacion.actaId, actaId))
  // Eliminar acta
  await db.delete(acta).where(eq(acta.id, actaId))
}

/**
 * Limpiar todas las actas de prueba (por prefijo en cneId)
 */
export async function cleanupAllTestActas(): Promise<void> {
  // Encontrar todas las actas de prueba
  const testActas = await db
    .select({ id: acta.id })
    .from(acta)
    .where(like(acta.cneId, `${TEST_PREFIX}%`))

  const actaIds = testActas.map((a) => a.id)

  if (actaIds.length === 0) return

  // Eliminar validaciones
  await db.delete(validacion).where(inArray(validacion.actaId, actaIds))
  // Eliminar historial
  await db.delete(historialDigitacion).where(inArray(historialDigitacion.actaId, actaIds))
  // Eliminar actas
  await db.delete(acta).where(inArray(acta.id, actaIds))

  console.log(`Se limpiaron ${actaIds.length} actas de prueba`)
}

/**
 * Limpiar estadísticas de usuarios de prueba
 */
export async function cleanupUserStats(userIds: string[]): Promise<void> {
  if (userIds.length === 0) return
  await db.delete(historialUsuarioEstado).where(inArray(historialUsuarioEstado.usuarioId, userIds))
  await db.delete(estadisticaUsuario).where(inArray(estadisticaUsuario.usuarioId, userIds))
}

/**
 * Actualizar manualmente las estadísticas de un usuario
 */
export async function updateUserStats(
  userId: string,
  stats: {
    actasValidadas?: number
    correccionesRecibidas?: number
    estado?: 'activo' | 'advertido' | 'restringido' | 'baneado'
    estadoBloqueadoPorAdmin?: boolean
  }
): Promise<void> {
  const existing = await getUserStats(userId)

  if (existing) {
    await db
      .update(estadisticaUsuario)
      .set({
        ...stats,
        ultimaActividad: new Date(),
      })
      .where(eq(estadisticaUsuario.usuarioId, userId))
  } else {
    await db.insert(estadisticaUsuario).values({
      usuarioId: userId,
      actasDigitadas: 0,
      actasValidadas: stats.actasValidadas ?? 0,
      validacionesCorrectas: 0,
      discrepanciasReportadas: 0,
      correccionesRecibidas: stats.correccionesRecibidas ?? 0,
      estado: stats.estado ?? 'activo',
      estadoBloqueadoPorAdmin: stats.estadoBloqueadoPorAdmin ?? false,
      conteoAdvertencias: 0,
      primeraActividad: new Date(),
      ultimaActividad: new Date(),
    })
  }
}
