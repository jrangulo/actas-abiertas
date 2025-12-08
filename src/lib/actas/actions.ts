'use server'

/**
 * Server Actions para verificación de actas
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import {
  acta,
  historialDigitacion,
  validacion,
  discrepancia,
  estadisticaUsuario,
} from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import {
  getActaParaDigitalizar,
  getActaParaValidar,
  bloquearActa,
  liberarActa,
  getActaByUuid,
  getActaBloqueadaPorUsuario,
  extenderBloqueo,
} from './queries'

/**
 * Actualizar estadísticas del usuario (upsert)
 */
async function actualizarEstadisticaUsuario(
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

  // Verificar si el usuario ya tiene un acta bloqueada
  const actaPendiente = await getActaBloqueadaPorUsuario(user.id)
  if (actaPendiente) {
    return {
      success: false,
      message: 'Ya tienes un acta en proceso',
      pendingUuid: actaPendiente.uuid,
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
  if (actaData.bloqueadoPor !== user.id) {
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
      actaId: actaData.id,
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

/**
 * Tipo para los valores de votos
 */
type VoteValues = {
  pn: number
  plh: number
  pl: number
  pinu: number
  dc: number
  nulos: number
  blancos: number
  total: number
}

/**
 * Comparar dos conjuntos de valores para ver si son iguales
 */
function valuesMatch(a: VoteValues, b: VoteValues): boolean {
  return (
    a.pn === b.pn &&
    a.plh === b.plh &&
    a.pl === b.pl &&
    a.pinu === b.pinu &&
    a.dc === b.dc &&
    a.nulos === b.nulos &&
    a.blancos === b.blancos
  )
}

/**
 * Encontrar consenso entre validaciones (2+ deben coincidir)
 * Retorna los valores ganadores y los IDs de usuarios que discreparon
 */
function findConsensus(
  validaciones: Array<{ usuarioId: string; values: VoteValues }>
): { winningValues: VoteValues; discrepantUserIds: string[] } | null {
  if (validaciones.length < 3) return null

  // Comparar cada par
  for (let i = 0; i < validaciones.length; i++) {
    let matchCount = 1
    const matchingUserIds = [validaciones[i].usuarioId]

    for (let j = 0; j < validaciones.length; j++) {
      if (i !== j && valuesMatch(validaciones[i].values, validaciones[j].values)) {
        matchCount++
        matchingUserIds.push(validaciones[j].usuarioId)
      }
    }

    // Si 2+ coinciden, encontramos consenso
    if (matchCount >= 2) {
      const discrepantUserIds = validaciones
        .filter((v) => !matchingUserIds.includes(v.usuarioId))
        .map((v) => v.usuarioId)

      return {
        winningValues: validaciones[i].values,
        discrepantUserIds,
      }
    }
  }

  // No hay consenso - todos diferentes
  return null
}

/**
 * Guardar validación de un acta
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

  const actaData = await getActaByUuid(uuid)
  if (!actaData) {
    throw new Error('Acta no encontrada')
  }

  // Verificar que el usuario tiene el bloqueo
  if (actaData.bloqueadoPor !== user.id) {
    throw new Error('No tienes el bloqueo de esta acta')
  }

  // Determinar qué valores está confirmando/enviando este validador
  // Si dice "correcto", usa los valores actuales. Si corrige, usa sus correcciones.
  let submittedValues: VoteValues

  if (datos.esCorrecta) {
    // Usuario confirma valores actuales - obtener valores actuales del acta
    // Prioridad: digitado > CNE oficial
    submittedValues = {
      pn: actaData.votosPnDigitado ?? actaData.votosPnOficial ?? 0,
      plh: actaData.votosPlhDigitado ?? actaData.votosPlhOficial ?? 0,
      pl: actaData.votosPlDigitado ?? actaData.votosPlOficial ?? 0,
      pinu: actaData.votosPinuDigitado ?? actaData.votosPinuOficial ?? 0,
      dc: actaData.votosDcDigitado ?? actaData.votosDcOficial ?? 0,
      nulos: actaData.votosNulosDigitado ?? actaData.votosNulosOficial ?? 0,
      blancos: actaData.votosBlancosDigitado ?? actaData.votosBlancosOficial ?? 0,
      total: actaData.votosTotalDigitado ?? actaData.votosTotalOficial ?? 0,
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
    throw new Error('Datos de validación inválidos')
  }

  try {
    // Registrar validación con los valores
    try {
      await db.insert(validacion).values({
        actaId: actaData.id,
        usuarioId: user.id,
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
    } catch (error) {
      const isDuplicate =
        error instanceof Error &&
        error.message.includes('duplicate key') &&
        error.message.includes('validacion')

      if (isDuplicate) {
        throw new Error('Ya validaste esta acta anteriormente')
      }
      throw error
    }

    // Actualizar contador de validaciones
    const nuevaCantidadValidaciones = actaData.cantidadValidaciones + 1

    // Si llegamos a 3 validaciones, determinar consenso
    if (nuevaCantidadValidaciones >= 3) {
      // Obtener todas las validaciones para esta acta
      const todasValidaciones = await db
        .select()
        .from(validacion)
        .where(eq(validacion.actaId, actaData.id))

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

      const consensoResult = findConsensus(validacionesConValores)

      if (consensoResult) {
        // ¡Tenemos consenso! Actualizar acta con valores ganadores
        const { winningValues, discrepantUserIds } = consensoResult

        await db
          .update(acta)
          .set({
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
          actaId: actaData.id,
          usuarioId: user.id, // El último validador que disparó el consenso
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
        await db
          .update(acta)
          .set({
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
      await db
        .update(acta)
        .set({
          cantidadValidaciones: nuevaCantidadValidaciones,
          estado: 'en_validacion',
          bloqueadoPor: null,
          bloqueadoHasta: null,
          actualizadoEn: new Date(),
        })
        .where(eq(acta.uuid, uuid))
    }

    // Actualizar estadísticas del usuario validador
    await actualizarEstadisticaUsuario(user.id, {
      actasValidadas: 1,
    })
  } finally {
    // Asegurar liberar bloqueo aunque falle algo
    await liberarActa(uuid).catch(() => {})
  }

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Reportar un problema con un acta
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

  // Registrar discrepancia
  await db.insert(discrepancia).values({
    actaId: actaData.id,
    usuarioId: user.id,
    tipo: datos.tipo,
    descripcion: datos.descripcion || null,
  })

  // Liberar bloqueo
  await liberarActa(uuid, user.id)

  // Actualizar estadísticas del usuario
  await actualizarEstadisticaUsuario(user.id, { discrepanciasReportadas: 1 })

  revalidatePath('/dashboard')
  return { success: true }
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
