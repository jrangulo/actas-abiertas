/**
 * Funciones para consultar y gestionar actas
 */

import { db } from '@/db'
import {
  acta,
  validacion,
  discrepancia,
  estadisticaUsuario,
  authUsers,
  municipio,
  departamento,
  centroVotacion,
  usuarioLogro,
} from '@/db/schema'
import {
  eq,
  and,
  or,
  isNull,
  isNotNull,
  lt,
  gt,
  ne,
  notExists,
  sql,
  count,
  desc,
  countDistinct,
} from 'drizzle-orm'
import { LOCK_DURATION_MINUTES } from './utils'

/**
 * Obtener estadísticas de actas para el dashboard
 */
export async function getActasStats() {
  // Total de actas
  const [total] = await db.select({ count: count() }).from(acta)

  // Por digitalizar (no escrutadas Y no digitadas por nosotros)
  const [porDigitalizar] = await db
    .select({ count: count() })
    .from(acta)
    .where(and(eq(acta.escrutadaEnCne, false), isNull(acta.digitadoPor)))

  // Por validar (escrutadas O digitadas por nosotros, pero no validadas completamente)
  const [porValidar] = await db
    .select({ count: count() })
    .from(acta)
    .where(
      and(
        or(eq(acta.escrutadaEnCne, true), isNotNull(acta.digitadoPor)),
        lt(acta.cantidadValidaciones, 3)
      )
    )

  // Validadas (3+ validaciones)
  const [validadas] = await db
    .select({ count: count() })
    .from(acta)
    .where(eq(acta.estado, 'validada'))

  // En validación (1-2 validaciones, en proceso)
  const [enValidacion] = await db
    .select({ count: count() })
    .from(acta)
    .where(eq(acta.estado, 'en_validacion'))

  // Actas con problemas (bajo_revision por reportes de usuarios + con_discrepancia por falta de consenso)
  const [actasConProblemas] = await db
    .select({ count: count() })
    .from(acta)
    .where(or(eq(acta.estado, 'bajo_revision'), eq(acta.estado, 'con_discrepancia')))

  // Todas las actas están disponibles para validación
  const totalActas = Number(total.count)

  // Total validaciones necesarias = todas las actas * 3 (cada acta necesita 3 validaciones)
  const validacionesNecesarias = totalActas * 3

  // Total validaciones realizadas (suma de cantidadValidaciones de TODAS las actas)
  const [validacionesRealizadas] = await db
    .select({
      sum: sql<number>`COALESCE(SUM(${acta.cantidadValidaciones}), 0)`,
    })
    .from(acta)

  return {
    total: totalActas,
    porDigitalizar: Number(porDigitalizar.count),
    porValidar: Number(porValidar.count),
    validadas: Number(validadas.count),
    enValidacion: Number(enValidacion.count), // Actas con 1-2 validaciones (en proceso)
    conProblemas: Number(actasConProblemas.count), // bajo_revision + con_discrepancia
    // Validation progress stats
    validacionesNecesarias,
    validacionesRealizadas: Number(validacionesRealizadas.sum),
  }
}

/**
 * Obtener el acta que el usuario tiene bloqueada actualmente (si existe)
 * Esto permite retomar el trabajo si navegaron fuera
 */
export async function getActaBloqueadaPorUsuario(userId: string) {
  const now = new Date()

  const [actaBloqueada] = await db
    .select()
    .from(acta)
    .where(
      and(
        eq(acta.bloqueadoPor, userId),
        gt(acta.bloqueadoHasta, now) // Bloqueo aún vigente
      )
    )
    .limit(1)

  return actaBloqueada || null
}

/**
 * Obtener una acta aleatoria para digitalizar
 * (no escrutada Y no digitada por nosotros Y no bloqueada)
 */
export async function getActaParaDigitalizar(userId: string) {
  const now = new Date()

  const [actaDisponible] = await db
    .select()
    .from(acta)
    .where(
      and(
        eq(acta.digitalizadaEnCne, true),
        eq(acta.escrutadaEnCne, false),
        isNull(acta.digitadoPor),
        or(
          isNull(acta.bloqueadoHasta),
          lt(acta.bloqueadoHasta, now),
          eq(acta.bloqueadoPor, userId) // Ya la tiene bloqueada este usuario
        )
      )
    )
    .orderBy(sql`RANDOM()`)
    .limit(1)

  return actaDisponible || null
}

/**
 * Obtener una acta aleatoria para validar
 * (escrutada O digitada por nosotros, no validada/reportada por este usuario, no bloqueada)
 */
export async function getActaParaValidar(userId: string) {
  const now = new Date()

  // Excluimos actas que el usuario ya digitó, validó o reportó
  const [actaDisponible] = await db
    .select()
    .from(acta)
    .where(
      and(
        // Escrutada por CNE O digitada por nosotros
        or(eq(acta.escrutadaEnCne, true), isNotNull(acta.digitadoPor)),
        // Menos de 3 validaciones
        lt(acta.cantidadValidaciones, 3),
        // No digitada por este usuario (IMPORTANTE: no puede validar lo que él mismo digitó)
        or(isNull(acta.digitadoPor), ne(acta.digitadoPor, userId)),
        // No bloqueada o bloqueo expirado o bloqueada por este usuario
        or(
          isNull(acta.bloqueadoHasta),
          lt(acta.bloqueadoHasta, now),
          eq(acta.bloqueadoPor, userId)
        ),
        // No validada por este usuario
        notExists(
          db
            .select({ one: sql`1` })
            .from(validacion)
            .where(and(eq(validacion.actaId, acta.id), eq(validacion.usuarioId, userId)))
        ),
        // No reportada por este usuario (1 interacción por acta por persona)
        notExists(
          db
            .select({ one: sql`1` })
            .from(discrepancia)
            .where(and(eq(discrepancia.actaId, acta.id), eq(discrepancia.usuarioId, userId)))
        )
      )
    )
    .orderBy(sql`RANDOM()`)
    .limit(1)

  return actaDisponible || null
}

/**
 * Obtener acta por UUID
 */
export async function getActaByUuid(uuid: string) {
  const [result] = await db
    .select()
    .from(acta)
    .leftJoin(
      municipio,
      and(
        eq(acta.municipioCodigo, municipio.codigo),
        eq(acta.departamentoCodigo, municipio.departamentoCodigo)
      )
    )
    .leftJoin(departamento, eq(acta.departamentoCodigo, departamento.codigo))
    .leftJoin(
      centroVotacion,
      and(
        eq(acta.centroCodigo, centroVotacion.codigo),
        eq(acta.departamentoCodigo, centroVotacion.departamentoCodigo),
        eq(acta.municipioCodigo, centroVotacion.municipioCodigo)
      )
    )
    .where(eq(acta.uuid, uuid))
    .limit(1)
  return result || null
}

/**
 * Bloquear un acta para que solo este usuario pueda trabajar en ella
 */
export async function bloquearActa(uuid: string, userId: string) {
  const now = new Date()
  const bloqueadoHasta = new Date(now.getTime() + LOCK_DURATION_MINUTES * 60 * 1000)

  const result = await db
    .update(acta)
    .set({
      bloqueadoPor: userId,
      bloqueadoHasta: bloqueadoHasta,
      actualizadoEn: now,
    })
    .where(
      and(
        eq(acta.uuid, uuid),
        // Solo si no está bloqueada o el bloqueo expiró o ya la tiene este usuario
        or(isNull(acta.bloqueadoHasta), lt(acta.bloqueadoHasta, now), eq(acta.bloqueadoPor, userId))
      )
    )
    .returning({ uuid: acta.uuid, bloqueadoHasta: acta.bloqueadoHasta })

  return result.length > 0 ? result[0] : null
}

/**
 * Extender el bloqueo de un acta (refrescar el timer)
 */
export async function extenderBloqueo(uuid: string, userId: string) {
  const now = new Date()
  const bloqueadoHasta = new Date(now.getTime() + LOCK_DURATION_MINUTES * 60 * 1000)

  const result = await db
    .update(acta)
    .set({
      bloqueadoHasta: bloqueadoHasta,
      actualizadoEn: now,
    })
    .where(and(eq(acta.uuid, uuid), eq(acta.bloqueadoPor, userId)))
    .returning({ bloqueadoHasta: acta.bloqueadoHasta })

  return result.length > 0 ? result[0].bloqueadoHasta : null
}

/**
 * Liberar el bloqueo de un acta
 * Si se pasa userId, solo libera si coincide. Si no, libera por UUID.
 */
export async function liberarActa(uuid: string, userId?: string) {
  const where = userId
    ? and(eq(acta.uuid, uuid), eq(acta.bloqueadoPor, userId))
    : eq(acta.uuid, uuid)

  return await db
    .update(acta)
    .set({
      bloqueadoPor: null,
      bloqueadoHasta: null,
      actualizadoEn: new Date(),
    })
    .where(where)
    .returning({
      uuid: acta.uuid,
      bloqueadoHasta: acta.bloqueadoHasta,
      bloqueadoPor: acta.bloqueadoPor,
    })
}

/**
 * Determinar el modo de verificación para un acta
 */
export function getModoVerificacion(actaData: typeof acta.$inferSelect): 'digitalizar' | 'validar' {
  // Si está escrutada por CNE o ya fue digitada por nosotros → validar
  if (actaData.escrutadaEnCne || actaData.digitadoPor) {
    return 'validar'
  }
  // Si no → digitalizar
  return 'digitalizar'
}

/**
 * Obtener los valores actuales de un acta (CNE o digitados)
 */
export function getValoresActuales(actaData: typeof acta.$inferSelect) {
  // Si tiene valores digitados por nosotros, usar esos
  if (actaData.digitadoPor && actaData.votosTotalDigitado !== null) {
    return {
      fuente: 'digitado' as const,
      pn: actaData.votosPnDigitado,
      plh: actaData.votosPlhDigitado,
      pl: actaData.votosPlDigitado,
      pinu: actaData.votosPinuDigitado,
      dc: actaData.votosDcDigitado,
      nulos: actaData.votosNulosDigitado,
      blancos: actaData.votosBlancosDigitado,
      total: actaData.votosTotalDigitado,
    }
  }

  // Si no, usar valores oficiales del CNE
  return {
    fuente: 'cne' as const,
    pn: actaData.votosPnOficial,
    plh: actaData.votosPlhOficial,
    pl: actaData.votosPlOficial,
    pinu: actaData.votosPinuOficial,
    dc: actaData.votosDcOficial,
    nulos: actaData.votosNulosOficial,
    blancos: actaData.votosBlancosOficial,
    total: actaData.votosTotalOficial,
  }
}

// ============================================================================
// Estadísticas de usuarios y leaderboard
// ============================================================================

/**
 * Obtener estadísticas de un usuario específico
 */
export async function getEstadisticaUsuario(userId: string) {
  const [stats] = await db
    .select()
    .from(estadisticaUsuario)
    .where(eq(estadisticaUsuario.usuarioId, userId))
    .limit(1)

  // Retornar valores por defecto si no hay estadísticas
  return (
    stats || {
      usuarioId: userId,
      actasDigitadas: 0,
      actasValidadas: 0,
      validacionesCorrectas: 0,
      discrepanciasReportadas: 0,
      correccionesRecibidas: 0,
      estado: 'activo' as const,
      estadoCambiadoEn: null,
      razonEstado: null,
      ultimaAdvertenciaEn: null,
      conteoAdvertencias: 0,
      estadoBloqueadoPorAdmin: false,
      estadoModificadoPor: null,
      primeraActividad: null,
      ultimaActividad: null,
      perfilPrivado: false,
      onboardingCompletado: false,
    }
  )
}

/**
 * Obtener el top de usuarios para el leaderboard
 * Ordena por actas validadas
 * Incluye configuración de privacidad para respetar anonimato
 */
export async function getTopUsuarios(limite: number = 10) {
  const usuarios = await db
    .select({
      usuarioId: estadisticaUsuario.usuarioId,
      rawUserMetaData: authUsers.rawUserMetaData,
      actasValidadas: estadisticaUsuario.actasValidadas,
      validacionesCorrectas: estadisticaUsuario.validacionesCorrectas,
      perfilPrivado: estadisticaUsuario.perfilPrivado,
      logrosCount: countDistinct(usuarioLogro.id),
    })
    .from(estadisticaUsuario)
    .leftJoin(authUsers, eq(estadisticaUsuario.usuarioId, authUsers.id))
    .leftJoin(usuarioLogro, eq(estadisticaUsuario.usuarioId, usuarioLogro.usuarioId))
    .groupBy(
      estadisticaUsuario.usuarioId,
      authUsers.rawUserMetaData,
      estadisticaUsuario.actasValidadas,
      estadisticaUsuario.validacionesCorrectas,
      estadisticaUsuario.perfilPrivado
    )
    .orderBy(desc(estadisticaUsuario.actasValidadas))
    .where(gt(estadisticaUsuario.actasValidadas, 0))
    .limit(limite)

  return usuarios
}

/**
 * Obtener la posición de un usuario en el ranking
 * Basado en actas validadas únicamente
 * Retorna null si el usuario no tiene estadísticas (no ha contribuido)
 */
export async function getRankingUsuario(userId: string) {
  // Primero verificar si el usuario tiene estadísticas
  const [userStats] = await db
    .select()
    .from(estadisticaUsuario)
    .where(eq(estadisticaUsuario.usuarioId, userId))
    .limit(1)

  // Si no tiene estadísticas o no ha validado nada, retornar null
  if (!userStats || userStats.actasValidadas === 0) {
    return null
  }

  // Contar cuántos usuarios tienen más validaciones
  const [result] = await db
    .select({
      posicion: sql<number>`(
        SELECT COUNT(*) + 1 
        FROM estadistica_usuario e2 
        WHERE e2.actas_validadas > 
              (SELECT COALESCE(actas_validadas, 0) 
               FROM estadistica_usuario 
               WHERE usuario_id = ${userId})
      )`,
    })
    .from(sql`(SELECT 1) as dummy`)

  return result?.posicion ?? null
}
