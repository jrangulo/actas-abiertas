import { db } from '@/db'
import { logro, usuarioLogro, estadisticaUsuario } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { ACHIEVEMENTS_CONFIG } from './config'
import type { TipoLogro } from '@/db/schema'

/**
 * Inicializar logros en la base de datos
 * Debe ejecutarse una vez para crear todos los logros definidos
 */
export async function inicializarLogros() {
  const logrosExistentes = await db.select().from(logro)

  const logrosExistentesMap = new Map(
    logrosExistentes.map((l) => [`${l.tipo}-${l.valorObjetivo}`, l])
  )

  const logrosParaInsertar = ACHIEVEMENTS_CONFIG.filter(
    (config) => !logrosExistentesMap.has(`${config.tipo}-${config.valorObjetivo}`)
  )

  if (logrosParaInsertar.length > 0) {
    await db.insert(logro).values(logrosParaInsertar)
  }

  return { inserted: logrosParaInsertar.length }
}

/**
 * Obtener logros de un usuario
 */
export async function obtenerLogrosUsuario(userId: string) {
  const logrosUsuario = await db
    .select({
      id: usuarioLogro.id,
      obtenidoEn: usuarioLogro.obtenidoEn,
      valorAlcanzado: usuarioLogro.valorAlcanzado,
      logro: {
        id: logro.id,
        tipo: logro.tipo,
        valorObjetivo: logro.valorObjetivo,
        nombre: logro.nombre,
        descripcion: logro.descripcion,
        icono: logro.icono,
        orden: logro.orden,
      },
    })
    .from(usuarioLogro)
    .innerJoin(logro, eq(usuarioLogro.logroId, logro.id))
    .where(eq(usuarioLogro.usuarioId, userId))
    .orderBy(logro.orden)

  return logrosUsuario
}

/**
 * Obtener todos los logros disponibles con estado de obtención del usuario
 */
export async function obtenerTodosLogrosConEstado(userId: string) {
  const todosLogros = await db.select().from(logro).orderBy(logro.orden)

  const logrosUsuario = await db
    .select({
      logroId: usuarioLogro.logroId,
      obtenidoEn: usuarioLogro.obtenidoEn,
      valorAlcanzado: usuarioLogro.valorAlcanzado,
    })
    .from(usuarioLogro)
    .where(eq(usuarioLogro.usuarioId, userId))

  const logrosUsuarioMap = new Map(
    logrosUsuario.map((lu) => [
      lu.logroId,
      { obtenidoEn: lu.obtenidoEn, valorAlcanzado: lu.valorAlcanzado },
    ])
  )

  return todosLogros.map((l) => ({
    ...l,
    obtenido: logrosUsuarioMap.has(l.id),
    obtenidoEn: logrosUsuarioMap.get(l.id)?.obtenidoEn ?? null,
    valorAlcanzado: logrosUsuarioMap.get(l.id)?.valorAlcanzado ?? null,
  }))
}

/**
 * Verificar y otorgar logros basados en el tipo y valor actual
 */
export async function verificarYOtorgarLogros(
  userId: string,
  tipo: TipoLogro,
  valorActual: number,
  valorAlcanzado?: number
): Promise<Array<{ id: number; nombre: string; descripcion: string; icono: string | null }>> {
  // Obtener logros del tipo especificado que el usuario aún no tiene
  const logrosDisponibles = await db
    .select()
    .from(logro)
    .where(eq(logro.tipo, tipo))
    .orderBy(logro.valorObjetivo)

  // Obtener logros que el usuario ya tiene
  const logrosUsuario = await db
    .select({ logroId: usuarioLogro.logroId })
    .from(usuarioLogro)
    .where(eq(usuarioLogro.usuarioId, userId))

  const logrosUsuarioIds = new Set(logrosUsuario.map((lu) => lu.logroId))

  // Filtrar logros que el usuario puede obtener ahora
  const logrosParaOtorgar = logrosDisponibles.filter(
    (l) => !logrosUsuarioIds.has(l.id) && valorActual >= l.valorObjetivo
  )

  if (logrosParaOtorgar.length === 0) {
    return []
  }

  // Otorgar los logros
  const nuevosLogros = logrosParaOtorgar.map((l) => ({
    usuarioId: userId,
    logroId: l.id,
    valorAlcanzado: valorAlcanzado ?? valorActual,
  }))

  await db.insert(usuarioLogro).values(nuevosLogros)

  // Retornar información de los logros otorgados
  return logrosParaOtorgar.map((l) => ({
    id: l.id,
    nombre: l.nombre,
    descripcion: l.descripcion,
    icono: l.icono,
  }))
}

/**
 * Verificar logros de validaciones totales
 */
export async function verificarLogrosValidaciones(userId: string) {
  const [stats] = await db
    .select({ actasValidadas: estadisticaUsuario.actasValidadas })
    .from(estadisticaUsuario)
    .where(eq(estadisticaUsuario.usuarioId, userId))
    .limit(1)

  if (!stats) {
    return []
  }

  return verificarYOtorgarLogros(userId, 'validaciones_totales', stats.actasValidadas)
}

/**
 * Verificar logros de reportes totales
 */
export async function verificarLogrosReportes(userId: string) {
  const [stats] = await db
    .select({ discrepanciasReportadas: estadisticaUsuario.discrepanciasReportadas })
    .from(estadisticaUsuario)
    .where(eq(estadisticaUsuario.usuarioId, userId))
    .limit(1)

  if (!stats) {
    return []
  }

  return verificarYOtorgarLogros(userId, 'reportes_totales', stats.discrepanciasReportadas)
}

/**
 * Verificar logros de racha de sesión
 * @param userId - ID del usuario
 * @param rachaActual - Número de actas validadas en la sesión actual
 */
export async function verificarLogrosRachaSesion(userId: string, rachaActual: number) {
  return verificarYOtorgarLogros(userId, 'racha_sesion', rachaActual, rachaActual)
}
