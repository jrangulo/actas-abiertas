/**
 * Consultas para el sistema de discrepancias
 *
 * Maneja la obtención de actas reportadas, discrepancias y comentarios
 * para el foro de revisión de discrepancias.
 */

import { db } from '@/db'
import {
  acta,
  discrepancia,
  comentarioDiscrepancia,
  estadisticaUsuario,
  authUsers,
} from '@/db/schema'
import { eq, desc, or, like, count, and } from 'drizzle-orm'
import { getActaImageUrl } from '@/lib/actas/utils'

// ============================================================================
// Tipos
// ============================================================================

export interface ActaConDiscrepancias {
  id: number
  uuid: string
  cneId: string | null
  estado: string
  jrvNumero: number | null
  departamentoCodigo: number | null
  municipioCodigo: number | null
  imagenUrl: string | null
  cantidadReportes: number
  cantidadComentarios: number
  ultimoReporte: Date | null
}

export interface ReporteDetalle {
  id: number
  tipo: string
  descripcion: string | null
  creadoEn: Date
  resuelta: boolean
  // Usuario (respetando privacidad)
  usuarioId: string
  usuarioNombre: string | null
  usuarioAvatar: string | null
  perfilPrivado: boolean
}

export interface ComentarioDetalle {
  id: number
  contenido: string
  creadoEn: Date
  editadoEn: Date | null
  padreId: number | null
  // Usuario (respetando privacidad)
  usuarioId: string
  usuarioNombre: string | null
  usuarioAvatar: string | null
  perfilPrivado: boolean
}

// ============================================================================
// Consultas
// ============================================================================

/**
 * Obtener actas que están bajo revisión o tienen discrepancias
 * Incluye conteo de reportes y comentarios
 */
export async function getActasConDiscrepancias(options?: {
  limite?: number
  offset?: number
  busqueda?: string
}): Promise<{ actas: ActaConDiscrepancias[]; total: number }> {
  const limite = options?.limite ?? 20
  const offset = options?.offset ?? 0
  const busqueda = options?.busqueda?.trim()

  // Base query conditions
  const baseCondition = or(eq(acta.estado, 'bajo_revision'), eq(acta.estado, 'con_discrepancia'))

  // Build search condition if needed
  let searchCondition = baseCondition
  if (busqueda) {
    searchCondition = and(baseCondition, like(acta.cneId, `%${busqueda}%`))
  }

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(acta)
    .where(searchCondition ?? baseCondition)

  // Get actas
  const actas = await db
    .select({
      id: acta.id,
      uuid: acta.uuid,
      cneId: acta.cneId,
      estado: acta.estado,
      jrvNumero: acta.jrvNumero,
      departamentoCodigo: acta.departamentoCodigo,
      municipioCodigo: acta.municipioCodigo,
    })
    .from(acta)
    .where(searchCondition ?? baseCondition)
    .orderBy(desc(acta.actualizadoEn))
    .limit(limite)
    .offset(offset)

  // Get counts for each acta
  const actasConCounts = await Promise.all(
    actas.map(async (a) => {
      // Count reports
      const [reportes] = await db
        .select({ count: count() })
        .from(discrepancia)
        .where(eq(discrepancia.actaId, a.id))

      // Count comments
      const [comentarios] = await db
        .select({ count: count() })
        .from(comentarioDiscrepancia)
        .where(eq(comentarioDiscrepancia.actaId, a.id))

      // Get latest report date
      const [ultimoReporte] = await db
        .select({ fecha: discrepancia.creadoEn })
        .from(discrepancia)
        .where(eq(discrepancia.actaId, a.id))
        .orderBy(desc(discrepancia.creadoEn))
        .limit(1)

      return {
        ...a,
        imagenUrl: getActaImageUrl(a.cneId),
        cantidadReportes: Number(reportes.count),
        cantidadComentarios: Number(comentarios.count),
        ultimoReporte: ultimoReporte?.fecha ?? null,
      }
    })
  )

  return {
    actas: actasConCounts,
    total: Number(totalResult.count),
  }
}

/**
 * Obtener detalles de una acta específica con sus reportes
 */
export async function getActaConReportes(uuid: string) {
  // Get acta
  const [actaData] = await db
    .select({
      id: acta.id,
      uuid: acta.uuid,
      cneId: acta.cneId,
      estado: acta.estado,
      jrvNumero: acta.jrvNumero,
      departamentoCodigo: acta.departamentoCodigo,
      municipioCodigo: acta.municipioCodigo,
      // Datos digitados
      votosPnDigitado: acta.votosPnDigitado,
      votosPlhDigitado: acta.votosPlhDigitado,
      votosPlDigitado: acta.votosPlDigitado,
      votosPinuDigitado: acta.votosPinuDigitado,
      votosDcDigitado: acta.votosDcDigitado,
      votosNulosDigitado: acta.votosNulosDigitado,
      votosBlancosDigitado: acta.votosBlancosDigitado,
      votosTotalDigitado: acta.votosTotalDigitado,
    })
    .from(acta)
    .where(eq(acta.uuid, uuid))
    .limit(1)

  if (!actaData) return null

  return {
    ...actaData,
    imagenUrl: getActaImageUrl(actaData.cneId),
  }
}

/**
 * Obtener reportes de una acta específica
 */
export async function getReportesDeActa(actaId: number): Promise<ReporteDetalle[]> {
  const reportes = await db
    .select({
      id: discrepancia.id,
      tipo: discrepancia.tipo,
      descripcion: discrepancia.descripcion,
      creadoEn: discrepancia.creadoEn,
      resuelta: discrepancia.resuelta,
      usuarioId: discrepancia.usuarioId,
      rawUserMetaData: authUsers.rawUserMetaData,
      perfilPrivado: estadisticaUsuario.perfilPrivado,
    })
    .from(discrepancia)
    .leftJoin(authUsers, eq(discrepancia.usuarioId, authUsers.id))
    .leftJoin(estadisticaUsuario, eq(discrepancia.usuarioId, estadisticaUsuario.usuarioId))
    .where(eq(discrepancia.actaId, actaId))
    .orderBy(desc(discrepancia.creadoEn))

  return reportes.map((r) => {
    const meta = r.rawUserMetaData as Record<string, unknown> | null
    const isPrivate = r.perfilPrivado ?? false

    return {
      id: r.id,
      tipo: r.tipo,
      descripcion: r.descripcion,
      creadoEn: r.creadoEn,
      resuelta: r.resuelta,
      usuarioId: r.usuarioId,
      usuarioNombre: isPrivate
        ? null
        : ((meta?.full_name as string) ?? (meta?.name as string) ?? null),
      usuarioAvatar: isPrivate
        ? null
        : ((meta?.avatar_url as string) ?? (meta?.picture as string) ?? null),
      perfilPrivado: isPrivate,
    }
  })
}

/**
 * Obtener comentarios de una acta específica
 */
export async function getComentariosDeActa(actaId: number): Promise<ComentarioDetalle[]> {
  const comentarios = await db
    .select({
      id: comentarioDiscrepancia.id,
      contenido: comentarioDiscrepancia.contenido,
      creadoEn: comentarioDiscrepancia.creadoEn,
      editadoEn: comentarioDiscrepancia.editadoEn,
      padreId: comentarioDiscrepancia.padreId,
      usuarioId: comentarioDiscrepancia.usuarioId,
      rawUserMetaData: authUsers.rawUserMetaData,
      perfilPrivado: estadisticaUsuario.perfilPrivado,
    })
    .from(comentarioDiscrepancia)
    .leftJoin(authUsers, eq(comentarioDiscrepancia.usuarioId, authUsers.id))
    .leftJoin(
      estadisticaUsuario,
      eq(comentarioDiscrepancia.usuarioId, estadisticaUsuario.usuarioId)
    )
    .where(eq(comentarioDiscrepancia.actaId, actaId))
    .orderBy(comentarioDiscrepancia.creadoEn)

  return comentarios.map((c) => {
    const meta = c.rawUserMetaData as Record<string, unknown> | null
    const isPrivate = c.perfilPrivado ?? false

    return {
      id: c.id,
      contenido: c.contenido,
      creadoEn: c.creadoEn,
      editadoEn: c.editadoEn,
      padreId: c.padreId,
      usuarioId: c.usuarioId,
      usuarioNombre: isPrivate
        ? null
        : ((meta?.full_name as string) ?? (meta?.name as string) ?? null),
      usuarioAvatar: isPrivate
        ? null
        : ((meta?.avatar_url as string) ?? (meta?.picture as string) ?? null),
      perfilPrivado: isPrivate,
    }
  })
}

/**
 * Obtener estadísticas de discrepancias
 */
export async function getEstadisticasDiscrepancias() {
  const [bajoRevision] = await db
    .select({ count: count() })
    .from(acta)
    .where(eq(acta.estado, 'bajo_revision'))

  const [conDiscrepancia] = await db
    .select({ count: count() })
    .from(acta)
    .where(eq(acta.estado, 'con_discrepancia'))

  const [totalReportes] = await db.select({ count: count() }).from(discrepancia)

  const [reportesResueltos] = await db
    .select({ count: count() })
    .from(discrepancia)
    .where(eq(discrepancia.resuelta, true))

  return {
    actasBajoRevision: Number(bajoRevision.count),
    actasConDiscrepancia: Number(conDiscrepancia.count),
    totalReportes: Number(totalReportes.count),
    reportesResueltos: Number(reportesResueltos.count),
  }
}
