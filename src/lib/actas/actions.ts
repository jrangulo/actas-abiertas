'use server'

/**
 * Server Actions para verificación de actas
 *
 * Este archivo contiene server actions (que usan auth) y funciones
 * internas exportadas para testing.
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import {
  acta,
  historialDigitacion,
  validacion,
  discrepancia,
  estadisticaUsuario,
} from '@/db/schema'
import { eq, sql, count, and } from 'drizzle-orm'
import {
  getActaParaDigitalizar,
  getActaParaValidar,
  bloquearActa,
  liberarActa,
  getActaByUuid,
  getActaBloqueadaPorUsuario,
  extenderBloqueo,
} from './queries'
import { findConsensus, type VoteValues } from './consensus'
import { verificarEstadoUsuario } from '@/lib/autoban/check'

/**
 * Actualizar estadísticas del usuario (upsert)
 * @exported for testing
 */
export async function actualizarEstadisticaUsuario(
  userId: string,
  incrementos: {
    actasDigitadas?: number
    actasValidadas?: number
    validacionesCorrectas?: number
    discrepanciasReportadas?: number
    correccionesRecibidas?: number
  }
) {
  const now = new Date()

  await db
    .insert(estadisticaUsuario)
    .values({
      usuarioId: userId,
      actasDigitadas: incrementos.actasDigitadas ?? 0,
      actasValidadas: incrementos.actasValidadas ?? 0,
      validacionesCorrectas: incrementos.validacionesCorrectas ?? 0,
      discrepanciasReportadas: incrementos.discrepanciasReportadas ?? 0,
      correccionesRecibidas: incrementos.correccionesRecibidas ?? 0,
      primeraActividad: now,
      ultimaActividad: now,
    })
    .onConflictDoUpdate({
      target: estadisticaUsuario.usuarioId,
      set: {
        actasDigitadas: incrementos.actasDigitadas
          ? sql`${estadisticaUsuario.actasDigitadas} + ${incrementos.actasDigitadas}`
          : estadisticaUsuario.actasDigitadas,
        actasValidadas: incrementos.actasValidadas
          ? sql`${estadisticaUsuario.actasValidadas} + ${incrementos.actasValidadas}`
          : estadisticaUsuario.actasValidadas,
        validacionesCorrectas: incrementos.validacionesCorrectas
          ? sql`${estadisticaUsuario.validacionesCorrectas} + ${incrementos.validacionesCorrectas}`
          : estadisticaUsuario.validacionesCorrectas,
        discrepanciasReportadas: incrementos.discrepanciasReportadas
          ? sql`${estadisticaUsuario.discrepanciasReportadas} + ${incrementos.discrepanciasReportadas}`
          : estadisticaUsuario.discrepanciasReportadas,
        correccionesRecibidas: incrementos.correccionesRecibidas
          ? sql`${estadisticaUsuario.correccionesRecibidas} + ${incrementos.correccionesRecibidas}`
          : estadisticaUsuario.correccionesRecibidas,
        ultimaActividad: now,
      },
    })
}

/**
 * Obtener una nueva acta para trabajar (digitalizar o validar)
 */
export async function obtenerNuevaActa(modo: 'digitalizar' | 'validar') {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  // Verificar estado del usuario (sistema de autoban)
  const [userStats] = await db
    .select({ estado: estadisticaUsuario.estado })
    .from(estadisticaUsuario)
    .where(eq(estadisticaUsuario.usuarioId, user.id))
    .limit(1)

  if (userStats) {
    // Usuarios baneados no pueden hacer nada
    if (userStats.estado === 'baneado') {
      return {
        success: false,
        message: 'Tu cuenta ha sido suspendida debido a baja precisión en validaciones.',
        banned: true,
      }
    }
  }

  // Verificar si el usuario ya tiene un acta bloqueada
  const actaPendiente = await getActaBloqueadaPorUsuario(user.id)
  if (actaPendiente) {
    return {
      success: false,
      message: 'Ya tienes un acta en proceso',
      pendingUuid: actaPendiente.uuid,
    }
  }

  // Mantenimiento: pausar asignación de nuevas actas (pero permitir retomar una pendiente arriba)
  if (process.env.ACTAS_MAINTENANCE === 'true') {
    return {
      success: false,
      maintenance: true,
      message:
        'Mantenimiento en progreso: estamos actualizando datos y pausamos temporalmente la asignación de nuevas actas.',
    }
  }

  const actaDisponible =
    modo === 'digitalizar'
      ? await getActaParaDigitalizar(user.id)
      : await getActaParaValidar(user.id)

  if (!actaDisponible) {
    return { success: false, message: 'No hay actas disponibles en este momento' }
  }

  // Intentar bloquear el acta
  const bloqueada = await bloquearActa(actaDisponible.uuid!, user.id)

  if (!bloqueada) {
    return { success: false, message: 'El acta ya está siendo procesada por otro usuario' }
  }

  return { success: true, uuid: actaDisponible.uuid }
}

/**
 * Guardar digitalización de un acta (primera vez)
 */
export async function guardarDigitalizacion(
  uuid: string,
  valores: {
    pn: number
    plh: number
    pl: number
    pinu: number
    dc: number
    nulos: number
    blancos: number
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const actaData = await getActaByUuid(uuid)
  if (!actaData) {
    throw new Error('Acta no encontrada')
  }

  // Verificar que el usuario tiene el bloqueo
  if (actaData.acta.bloqueadoPor !== user.id) {
    throw new Error('No tienes el bloqueo de esta acta')
  }

  try {
    // Total incluye todos los votos (partidos + blancos + nulos), igual que en el acta física
    const total =
      valores.pn +
      valores.plh +
      valores.pl +
      valores.pinu +
      valores.dc +
      valores.blancos +
      valores.nulos

    // Actualizar acta con valores digitados
    await db
      .update(acta)
      .set({
        votosPnDigitado: valores.pn,
        votosPlhDigitado: valores.plh,
        votosPlDigitado: valores.pl,
        votosPinuDigitado: valores.pinu,
        votosDcDigitado: valores.dc,
        votosNulosDigitado: valores.nulos,
        votosBlancosDigitado: valores.blancos,
        votosTotalDigitado: total,
        digitadoPor: user.id,
        digitadoEn: new Date(),
        estado: 'digitada',
        bloqueadoPor: null,
        bloqueadoHasta: null,
        actualizadoEn: new Date(),
      })
      .where(eq(acta.uuid, uuid))

    // Registrar en historial
    await db.insert(historialDigitacion).values({
      actaId: actaData.acta.id,
      usuarioId: user.id,
      tipoCambio: 'digitacion_inicial',
      votosPn: valores.pn,
      votosPlh: valores.plh,
      votosPl: valores.pl,
      votosPinu: valores.pinu,
      votosDc: valores.dc,
      votosTotal: total,
    })

    // Actualizar estadísticas del usuario
    await actualizarEstadisticaUsuario(user.id, { actasDigitadas: 1 })
  } finally {
    // Asegurar liberar bloqueo aunque falle algo
    await liberarActa(uuid).catch(() => {})
  }

  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================================================
// Función interna de validación (exportada para testing)
// ============================================================================

export type GuardarValidacionParams = {
  uuid: string
  userId: string
  datos: {
    esCorrecta: boolean
    correciones?: {
      pn: number
      plh: number
      pl: number
      pinu: number
      dc: number
      nulos: number
      blancos: number
    }
  }
  /** Si true, omite verificación de bloqueo (para testing) */
  skipLockCheck?: boolean
  /** Si true, omite revalidatePath (para testing) */
  skipRevalidate?: boolean
}

export type GuardarValidacionResult = {
  success: boolean
  nuevoEstado?: string
  consenso?: {
    encontrado: boolean
    winningValues?: VoteValues
    discrepantUserIds?: string[]
  }
  error?: string
}

/**
 * Función interna para guardar validación
 * Puede ser llamada directamente en tests con userId explícito
 *
 * @exported for testing - Usa esta función en tests de integración
 */
export async function guardarValidacionInternal(
  params: GuardarValidacionParams
): Promise<GuardarValidacionResult> {
  const { uuid, userId, datos, skipLockCheck = false, skipRevalidate = false } = params

  const actaData = await getActaByUuid(uuid)
  if (!actaData) {
    return { success: false, error: 'Acta no encontrada' }
  }

  // Verificar que el usuario tiene el bloqueo (skip en tests)
  if (!skipLockCheck && actaData.acta.bloqueadoPor !== userId) {
    return { success: false, error: 'No tienes el bloqueo de esta acta' }
  }

  // Determinar qué valores está confirmando/enviando este validador
  let submittedValues: VoteValues

  if (datos.esCorrecta) {
    // Usuario confirma valores actuales - obtener valores actuales del acta
    // Prioridad: digitado > CNE oficial
    submittedValues = {
      pn: actaData.acta.votosPnDigitado ?? actaData.acta.votosPnOficial ?? 0,
      plh: actaData.acta.votosPlhDigitado ?? actaData.acta.votosPlhOficial ?? 0,
      pl: actaData.acta.votosPlDigitado ?? actaData.acta.votosPlOficial ?? 0,
      pinu: actaData.acta.votosPinuDigitado ?? actaData.acta.votosPinuOficial ?? 0,
      dc: actaData.acta.votosDcDigitado ?? actaData.acta.votosDcOficial ?? 0,
      nulos: actaData.acta.votosNulosDigitado ?? actaData.acta.votosNulosOficial ?? 0,
      blancos: actaData.acta.votosBlancosDigitado ?? actaData.acta.votosBlancosOficial ?? 0,
      total: actaData.acta.votosTotalDigitado ?? actaData.acta.votosTotalOficial ?? 0,
    }
  } else if (datos.correciones) {
    // Usuario envía correcciones
    const total =
      datos.correciones.pn +
      datos.correciones.plh +
      datos.correciones.pl +
      datos.correciones.pinu +
      datos.correciones.dc +
      datos.correciones.blancos +
      datos.correciones.nulos

    submittedValues = {
      pn: datos.correciones.pn,
      plh: datos.correciones.plh,
      pl: datos.correciones.pl,
      pinu: datos.correciones.pinu,
      dc: datos.correciones.dc,
      nulos: datos.correciones.nulos,
      blancos: datos.correciones.blancos,
      total,
    }
  } else {
    return { success: false, error: 'Datos de validación inválidos' }
  }

  try {
    // Registrar validación con los valores
    try {
      await db.insert(validacion).values({
        actaId: actaData.acta.id,
        usuarioId: userId,
        esCorrecto: datos.esCorrecta,
        votosPn: submittedValues.pn,
        votosPlh: submittedValues.plh,
        votosPl: submittedValues.pl,
        votosPinu: submittedValues.pinu,
        votosDc: submittedValues.dc,
        votosNulos: submittedValues.nulos,
        votosBlancos: submittedValues.blancos,
        votosTotal: submittedValues.total,
        historialCorreccionId: null,
      })
    } catch (error: unknown) {
      // Check for duplicate key violation (PK constraint)
      // Drizzle wraps PostgresError in a DrizzleQueryError with a 'cause' property
      const isDuplicate = (() => {
        const errorStr = String(error)
        if (errorStr.includes('duplicate key') || errorStr.includes('23505')) {
          return true
        }
        if (error instanceof Error) {
          if (error.message.includes('duplicate key')) return true
          // Check the cause (Drizzle wraps the original error)
          const cause = (error as { cause?: unknown }).cause
          if (cause) {
            const causeStr = String(cause)
            if (causeStr.includes('duplicate key') || causeStr.includes('23505')) {
              return true
            }
          }
        }
        return false
      })()

      if (isDuplicate) {
        return { success: false, error: 'Ya validaste esta acta anteriormente' }
      }
      throw error
    }

    let nuevoEstado = 'en_validacion'
    let consensoResult: GuardarValidacionResult['consenso'] = undefined

    // Obtener TODAS las validaciones para esta acta (incluyendo la que acabamos de insertar)
    // Esto es más confiable que usar el contador del acta, que podría estar desactualizado
    const todasValidaciones = await db
      .select()
      .from(validacion)
      .where(eq(validacion.actaId, actaData.acta.id))

    const nuevaCantidadValidaciones = todasValidaciones.length

    // Si llegamos a 3 validaciones, determinar consenso
    if (nuevaCantidadValidaciones >= 3) {
      const validacionesConValores = todasValidaciones.map((v) => ({
        usuarioId: v.usuarioId,
        values: {
          pn: v.votosPn,
          plh: v.votosPlh,
          pl: v.votosPl,
          pinu: v.votosPinu,
          dc: v.votosDc,
          nulos: v.votosNulos,
          blancos: v.votosBlancos,
          total: v.votosTotal,
        },
      }))

      const consenso = findConsensus(validacionesConValores)

      if (consenso) {
        // ¡Tenemos consenso! Actualizar acta con valores ganadores
        const { winningValues, discrepantUserIds } = consenso
        nuevoEstado = 'validada'

        consensoResult = {
          encontrado: true,
          winningValues,
          discrepantUserIds,
        }

        await db
          .update(acta)
          .set({
            uuid: crypto.randomUUID(), // Regenerar UUID
            votosPnDigitado: winningValues.pn,
            votosPlhDigitado: winningValues.plh,
            votosPlDigitado: winningValues.pl,
            votosPinuDigitado: winningValues.pinu,
            votosDcDigitado: winningValues.dc,
            votosNulosDigitado: winningValues.nulos,
            votosBlancosDigitado: winningValues.blancos,
            votosTotalDigitado: winningValues.total,
            cantidadValidaciones: nuevaCantidadValidaciones,
            cantidadValidacionesCorrectas: todasValidaciones.length - discrepantUserIds.length,
            estado: 'validada',
            bloqueadoPor: null,
            bloqueadoHasta: null,
            actualizadoEn: new Date(),
          })
          .where(eq(acta.uuid, uuid))

        // Registrar en historial que se alcanzó consenso
        await db.insert(historialDigitacion).values({
          actaId: actaData.acta.id,
          usuarioId: userId,
          tipoCambio: 'rectificacion',
          votosPn: winningValues.pn,
          votosPlh: winningValues.plh,
          votosPl: winningValues.pl,
          votosPinu: winningValues.pinu,
          votosDc: winningValues.dc,
          votosTotal: winningValues.total,
          comentario: `Consenso alcanzado con ${todasValidaciones.length - discrepantUserIds.length}/${todasValidaciones.length} validadores`,
        })

        // Marcar usuarios discrepantes (incrementar correcciones recibidas)
        for (const discrepantUserId of discrepantUserIds) {
          await actualizarEstadisticaUsuario(discrepantUserId, {
            correccionesRecibidas: 1,
          })
        }
      } else {
        // No hay consenso - todos diferentes, marcar como discrepancia
        nuevoEstado = 'con_discrepancia'

        consensoResult = {
          encontrado: false,
        }

        await db
          .update(acta)
          .set({
            uuid: crypto.randomUUID(), // Regenerar UUID
            cantidadValidaciones: nuevaCantidadValidaciones,
            estado: 'con_discrepancia',
            bloqueadoPor: null,
            bloqueadoHasta: null,
            actualizadoEn: new Date(),
          })
          .where(eq(acta.uuid, uuid))
      }
    } else {
      // Menos de 3 validaciones - solo actualizar contador
      // Regenerar UUID para invalidar URLs compartidas (prevenir colusion)
      await db
        .update(acta)
        .set({
          uuid: crypto.randomUUID(),
          cantidadValidaciones: nuevaCantidadValidaciones,
          estado: 'en_validacion',
          bloqueadoPor: null,
          bloqueadoHasta: null,
          actualizadoEn: new Date(),
        })
        .where(eq(acta.uuid, uuid))
    }

    // Actualizar estadísticas del usuario validador
    await actualizarEstadisticaUsuario(userId, {
      actasValidadas: 1,
    })

    // Ejecutar autoban check después de actualizar stats
    if (consensoResult?.encontrado && consensoResult.discrepantUserIds) {
      for (const discrepantUserId of consensoResult.discrepantUserIds) {
        verificarEstadoUsuario(discrepantUserId).catch((err) => {
          console.error('Error en autoban check:', err)
        })
      }
    }

    if (!skipRevalidate) {
      revalidatePath('/dashboard')
    }

    return {
      success: true,
      nuevoEstado,
      consenso: consensoResult,
    }
  } finally {
    // Asegurar liberar bloqueo aunque falle algo
    if (!skipLockCheck) {
      await liberarActa(uuid).catch(() => {})
    }
  }
}

/**
 * Guardar validación de un acta (Server Action con autenticación)
 *
 * IMPORTANTE: Los valores finales del acta NO se actualizan hasta que tengamos
 * 3 validaciones y podamos determinar consenso (2+ deben coincidir).
 */
export async function guardarValidacion(
  uuid: string,
  datos: {
    esCorrecta: boolean
    correciones?: {
      pn: number
      plh: number
      pl: number
      pinu: number
      dc: number
      nulos: number
      blancos: number
    }
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const result = await guardarValidacionInternal({
    uuid,
    userId: user.id,
    datos,
  })

  if (!result.success && result.error) {
    throw new Error(result.error)
  }

  return { success: true }
}

/**
 * Reportar un problema con un acta
 * Si el acta recibe 2+ reportes, se saca del pool (estado = bajo_revision)
 */
export async function reportarProblema(
  uuid: string,
  datos: {
    tipo: 'ilegible' | 'adulterada' | 'datos_inconsistentes' | 'imagen_incompleta' | 'otro'
    descripcion?: string
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const actaData = await getActaByUuid(uuid)
  if (!actaData) {
    throw new Error('Acta no encontrada')
  }

  // Verificar si el usuario ya reportó esta acta (prevenir duplicados por spam click)
  const [existingReport] = await db
    .select({ id: discrepancia.id })
    .from(discrepancia)
    .where(and(eq(discrepancia.actaId, actaData.acta.id), eq(discrepancia.usuarioId, user.id)))
    .limit(1)

  if (existingReport) {
    // Ya existe un reporte de este usuario para esta acta, solo liberar
    await liberarActa(uuid, user.id)
    revalidatePath('/dashboard/verificar')
    return {
      success: true,
      alreadyReported: true,
      maintenance: process.env.ACTAS_MAINTENANCE === 'true',
    }
  }

  // Registrar discrepancia
  await db.insert(discrepancia).values({
    actaId: actaData.acta.id,
    usuarioId: user.id,
    tipo: datos.tipo,
    descripcion: datos.descripcion || null,
  })

  // Contar reportes para esta acta
  const [reportCount] = await db
    .select({ count: count() })
    .from(discrepancia)
    .where(eq(discrepancia.actaId, actaData.acta.id))

  // Si tiene 2+ reportes, sacar del pool
  const UMBRAL_REPORTES = 2
  if (Number(reportCount.count) >= UMBRAL_REPORTES) {
    await db
      .update(acta)
      .set({
        uuid: crypto.randomUUID(), // Regenerar UUID
        estado: 'bajo_revision',
        bloqueadoPor: null,
        bloqueadoHasta: null,
        actualizadoEn: new Date(),
      })
      .where(eq(acta.id, actaData.acta.id))
  } else {
    // Solo liberar bloqueo si no cambiamos estado
    await liberarActa(uuid, user.id)
  }

  // Actualizar estadísticas del usuario
  await actualizarEstadisticaUsuario(user.id, { discrepanciasReportadas: 1 })

  // Mantenimiento: no asignar siguiente acta
  if (process.env.ACTAS_MAINTENANCE === 'true') {
    revalidatePath('/dashboard/verificar')
    revalidatePath('/dashboard/discrepancias')
    return { success: true, nextUuid: null, maintenance: true }
  }

  // Get next acta in same request to avoid race condition
  const nextActa = await getActaParaValidar(user.id)
  let nextUuid: string | null = null
  if (nextActa) {
    await bloquearActa(nextActa.uuid, user.id)
    nextUuid = nextActa.uuid
  }

  revalidatePath('/dashboard/verificar')
  revalidatePath('/dashboard/discrepancias')
  return { success: true, nextUuid, maintenance: false }
}

/**
 * Abandonar un acta sin guardar (liberar el bloqueo)
 * Uses redirect() to prevent Next.js from re-rendering the current page
 * which would call bloquearActa() again and re-lock the acta
 */
export async function abandonarActa(uuid: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const liberar_result = await liberarActa(uuid, user.id)

  if (!liberar_result || liberar_result.length === 0) {
    throw new Error('No se pudo liberar el bloqueo')
  }

  revalidatePath('/dashboard')

  redirect('/dashboard')
}

/**
 * Verificar si el usuario tiene un acta bloqueada pendiente
 * Retorna el UUID del acta si existe, para poder retomar el trabajo
 */
export async function verificarActaPendiente() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { hasPendiente: false }
  }

  const actaBloqueada = await getActaBloqueadaPorUsuario(user.id)

  if (actaBloqueada) {
    return {
      hasPendiente: true,
      uuid: actaBloqueada.uuid,
      bloqueadoHasta: actaBloqueada.bloqueadoHasta,
    }
  }

  return { hasPendiente: false }
}

/**
 * Extender el tiempo de bloqueo de un acta
 * Útil para refrescar el timer mientras el usuario trabaja
 */
export async function refrescarBloqueo(uuid: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const nuevaExpiracion = await extenderBloqueo(uuid, user.id)

  if (!nuevaExpiracion) {
    throw new Error('No se pudo extender el bloqueo')
  }

  return { success: true, bloqueadoHasta: nuevaExpiracion }
}
