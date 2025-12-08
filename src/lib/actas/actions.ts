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
 * Guardar validación de un acta
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

  let historialCorreccionId: number | null = null

  try {
    // Si hay correcciones, registrarlas primero
    if (!datos.esCorrecta && datos.correciones) {
      // Total incluye todos los votos (partidos + blancos + nulos)
      const total =
        datos.correciones.pn +
        datos.correciones.plh +
        datos.correciones.pl +
        datos.correciones.pinu +
        datos.correciones.dc +
        datos.correciones.blancos +
        datos.correciones.nulos

      // Actualizar valores digitados con las correcciones
      await db
        .update(acta)
        .set({
          votosPnDigitado: datos.correciones.pn,
          votosPlhDigitado: datos.correciones.plh,
          votosPlDigitado: datos.correciones.pl,
          votosPinuDigitado: datos.correciones.pinu,
          votosDcDigitado: datos.correciones.dc,
          votosNulosDigitado: datos.correciones.nulos,
          votosBlancosDigitado: datos.correciones.blancos,
          votosTotalDigitado: total,
          actualizadoEn: new Date(),
        })
        .where(eq(acta.uuid, uuid))

      // Registrar en historial
      const [historial] = await db
        .insert(historialDigitacion)
        .values({
          actaId: actaData.id,
          usuarioId: user.id,
          tipoCambio: 'correccion_validador',
          votosPn: datos.correciones.pn,
          votosPlh: datos.correciones.plh,
          votosPl: datos.correciones.pl,
          votosPinu: datos.correciones.pinu,
          votosDc: datos.correciones.dc,
          votosTotal: total,
        })
        .returning({ id: historialDigitacion.id })

      historialCorreccionId = historial.id
    }

    // Registrar validación - usar try-catch para manejar duplicados
    try {
      await db.insert(validacion).values({
        actaId: actaData.id,
        usuarioId: user.id,
        esCorrecto: datos.esCorrecta,
        historialCorreccionId: historialCorreccionId,
      })
    } catch (error) {
      // Si es un error de duplicado, liberar el bloqueo y retornar error amigable
      const isDuplicate =
        error instanceof Error &&
        error.message.includes('duplicate key') &&
        error.message.includes('validacion')

      if (isDuplicate) {
        throw new Error('Ya validaste esta acta anteriormente')
      }
      throw error
    }

    // Actualizar contadores
    const nuevaCantidadValidaciones = actaData.cantidadValidaciones + 1
    const nuevaCantidadCorrectas =
      actaData.cantidadValidacionesCorrectas + (datos.esCorrecta ? 1 : 0)

    // Determinar nuevo estado
    let nuevoEstado = actaData.estado
    if (nuevaCantidadValidaciones >= 3) {
      nuevoEstado = nuevaCantidadCorrectas >= 2 ? 'validada' : 'con_discrepancia'
    } else {
      nuevoEstado = 'en_validacion'
    }

    await db
      .update(acta)
      .set({
        cantidadValidaciones: nuevaCantidadValidaciones,
        cantidadValidacionesCorrectas: nuevaCantidadCorrectas,
        estado: nuevoEstado,
        bloqueadoPor: null,
        bloqueadoHasta: null,
        actualizadoEn: new Date(),
      })
      .where(eq(acta.uuid, uuid))

    // Actualizar estadísticas del usuario validador
    await actualizarEstadisticaUsuario(user.id, {
      actasValidadas: 1,
      validacionesCorrectas: datos.esCorrecta ? 1 : 0,
    })

    // Si hubo corrección, incrementar correcciones recibidas del digitador original
    if (!datos.esCorrecta && actaData.digitadoPor && actaData.digitadoPor !== user.id) {
      await actualizarEstadisticaUsuario(actaData.digitadoPor, {
        correccionesRecibidas: 1,
      })
    }
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
