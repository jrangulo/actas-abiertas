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
  type SQL,
} from 'drizzle-orm'
import { LOCK_DURATION_MINUTES, getActaImageUrl } from './utils'

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

  // En validación: actas que aún necesitan validaciones y están ACTIVAMENTE en el pool
  // Solo cuenta en_validacion y digitada con <3 validaciones
  // NO incluye bajo_revision (esas están fuera del pool por 2+ reportes)
  const [enValidacion] = await db
    .select({ count: count() })
    .from(acta)
    .where(
      and(
        eq(acta.tieneImagen, true),
        lt(acta.cantidadValidaciones, 3),
        or(eq(acta.estado, 'en_validacion'), eq(acta.estado, 'digitada'))
      )
    )

  // Bajo revisión (2+ reportes, fuera del pool)
  const [bajoRevision] = await db
    .select({ count: count() })
    .from(acta)
    .where(eq(acta.estado, 'bajo_revision'))

  // Con discrepancia (consenso fallido, fuera del pool)
  const [conDiscrepancia] = await db
    .select({ count: count() })
    .from(acta)
    .where(eq(acta.estado, 'con_discrepancia'))

  // Pendientes (no tienen datos/imagen, estado='pendiente')
  // Usamos estado en lugar de tieneImagen para evitar doble conteo
  const [pendientes] = await db
    .select({ count: count() })
    .from(acta)
    .where(eq(acta.estado, 'pendiente'))

  // Todas las actas están disponibles para validación
  const totalActas = Number(total.count)

  // Actas que pueden ser validadas (tienen imagen Y están en el pool)
  // Excluimos bajo_revision (2+ reportes) y con_discrepancia (consenso fallido)
  // porque están fuera del pool y nunca serán completadas
  const [actasEnPool] = await db
    .select({ count: count() })
    .from(acta)
    .where(
      and(
        eq(acta.tieneImagen, true),
        ne(acta.estado, 'bajo_revision'),
        ne(acta.estado, 'con_discrepancia')
      )
    )

  const totalActasValidables = Number(actasEnPool.count)

  // Total validaciones necesarias = solo actas EN EL POOL * 3
  // (bajo_revision y con_discrepancia están fuera del pool y no cuentan)
  const validacionesNecesarias = totalActasValidables * 3

  // Total validaciones realizadas (suma de cantidadValidaciones de actas EN EL POOL)
  const [validacionesRealizadas] = await db
    .select({
      sum: sql<number>`COALESCE(SUM(${acta.cantidadValidaciones}), 0)`,
    })
    .from(acta)
    .where(
      and(
        eq(acta.tieneImagen, true),
        ne(acta.estado, 'bajo_revision'),
        ne(acta.estado, 'con_discrepancia')
      )
    )

  return {
    total: totalActas,
    porDigitalizar: Number(porDigitalizar.count),
    porValidar: Number(porValidar.count),
    validadas: Number(validadas.count),
    enValidacion: Number(enValidacion.count), // Actas con <3 validaciones aún en el pool
    // Breakdown of problematic actas
    bajoRevision: Number(bajoRevision.count), // 2+ reportes, fuera del pool
    conDiscrepancia: Number(conDiscrepancia.count), // consenso fallido, fuera del pool
    sinImagen: Number(pendientes.count), // estado='pendiente', sin datos/imagen
    // Combined for backwards compatibility
    conProblemas: Number(bajoRevision.count) + Number(conDiscrepancia.count),
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
 * Excluye actas bajo_revision (2+ reportes) y con_discrepancia (consenso fallido)
 */
export async function getActaParaValidar(userId: string) {
  const now = new Date()

  // Excluimos actas que el usuario ya digitó, validó o reportó
  // También excluimos actas bajo_revision (sacadas del pool por 2+ reportes)
  const [actaDisponible] = await db
    .select()
    .from(acta)
    .where(
      and(
        // Escrutada por CNE O digitada por nosotros
        // remove logic to no escrutada to show the user the acta is not digitized yet
        // or(eq(acta.escrutadaEnCne, true), isNotNull(acta.digitadoPor)),
        eq(acta.tieneImagen, true),
        // Menos de 3 validaciones
        lt(acta.cantidadValidaciones, 3),
        // No bajo_revision ni con_discrepancia (estas están fuera del pool)
        ne(acta.estado, 'bajo_revision'),
        ne(acta.estado, 'con_discrepancia'),
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

/**
 * Obtener una acta completa mediante su número de JRV
 * Incluye: datos CNE, imagen S3, consenso (si disponible), y contexto geográfico
 * NO incluye UUID (para uso público)
 */
export async function getActaByJrvNumero(jrvNumero: number) {
  try {
    const results = await db
      .select({
        // Identificadores
        id: acta.id,
        cneId: acta.cneId,
        estado: acta.estado,

        // Ubicación
        departamentoCodigo: acta.departamentoCodigo,
        municipioCodigo: acta.municipioCodigo,
        centroCodigo: acta.centroCodigo,
        tipoZona: acta.tipoZona,
        jrvNumero: acta.jrvNumero,

        // Contexto geográfico
        departamentoNombre: departamento.nombre,
        municipioNombre: municipio.nombre,
        centroVotacionNombre: centroVotacion.nombre,
        centroVotacionDireccion: centroVotacion.direccion,

        // Datos oficiales del CNE
        votosPnOficial: acta.votosPnOficial,
        votosPlhOficial: acta.votosPlhOficial,
        votosPlOficial: acta.votosPlOficial,
        votosPinuOficial: acta.votosPinuOficial,
        votosDcOficial: acta.votosDcOficial,
        votosNulosOficial: acta.votosNulosOficial,
        votosBlancosOficial: acta.votosBlancosOficial,
        votosTotalOficial: acta.votosTotalOficial,

        // Metadatos CNE
        publicadaEnCne: acta.publicadaEnCne,
        escrutadaEnCne: acta.escrutadaEnCne,
        digitalizadaEnCne: acta.digitalizadaEnCne,
        etiquetasCNE: acta.etiquetasCNE,

        // Datos digitados (valores actuales después de correcciones)
        votosPnDigitado: acta.votosPnDigitado,
        votosPlhDigitado: acta.votosPlhDigitado,
        votosPlDigitado: acta.votosPlDigitado,
        votosPinuDigitado: acta.votosPinuDigitado,
        votosDcDigitado: acta.votosDcDigitado,
        votosNulosDigitado: acta.votosNulosDigitado,
        votosBlancosDigitado: acta.votosBlancosDigitado,
        votosTotalDigitado: acta.votosTotalDigitado,

        // Estadísticas de validación
        cantidadValidaciones: acta.cantidadValidaciones,
        cantidadValidacionesCorrectas: acta.cantidadValidacionesCorrectas,

        // Timestamps
        creadoEn: acta.creadoEn,
        actualizadoEn: acta.actualizadoEn,
      })
      .from(acta)
      .leftJoin(departamento, eq(acta.departamentoCodigo, departamento.codigo))
      .leftJoin(
        municipio,
        and(
          eq(acta.departamentoCodigo, municipio.departamentoCodigo),
          eq(acta.municipioCodigo, municipio.codigo)
        )
      )
      .leftJoin(
        centroVotacion,
        and(
          eq(acta.departamentoCodigo, centroVotacion.departamentoCodigo),
          eq(acta.municipioCodigo, centroVotacion.municipioCodigo),
          eq(acta.centroCodigo, centroVotacion.codigo),
          eq(acta.tipoZona, centroVotacion.tipoZona)
        )
      )
      .where(eq(acta.jrvNumero, jrvNumero))
      .limit(1)

    const result = results[0]
    if (!result) return null

    // Construir URL de imagen desde S3
    const imagenUrl = getActaImageUrl(result.cneId)

    // Obtener consenso solo si hay 3+ validaciones
    let consenso = null
    if (result.cantidadValidaciones >= 3) {
      const validaciones = await db
        .select({
          votosPn: validacion.votosPn,
          votosPlh: validacion.votosPlh,
          votosPl: validacion.votosPl,
          votosPinu: validacion.votosPinu,
          votosDc: validacion.votosDc,
          votosNulos: validacion.votosNulos,
          votosBlancos: validacion.votosBlancos,
          votosTotal: validacion.votosTotal,
        })
        .from(validacion)
        .where(eq(validacion.actaId, result.id))

      // Calcular moda (valor más común) para cada campo
      consenso = {
        pn: calcularModa(validaciones.map((v) => v.votosPn)),
        plh: calcularModa(validaciones.map((v) => v.votosPlh)),
        pl: calcularModa(validaciones.map((v) => v.votosPl)),
        pinu: calcularModa(validaciones.map((v) => v.votosPinu)),
        dc: calcularModa(validaciones.map((v) => v.votosDc)),
        nulos: calcularModa(validaciones.map((v) => v.votosNulos)),
        blancos: calcularModa(validaciones.map((v) => v.votosBlancos)),
        total: calcularModa(validaciones.map((v) => v.votosTotal)),
        // Indicar si hay consenso completo (todos los validadores coinciden)
        hayConsensoCompleto:
          validaciones.length >= 3 &&
          validaciones.every(
            (v) =>
              v.votosPn === validaciones[0].votosPn &&
              v.votosPlh === validaciones[0].votosPlh &&
              v.votosPl === validaciones[0].votosPl &&
              v.votosPinu === validaciones[0].votosPinu &&
              v.votosDc === validaciones[0].votosDc &&
              v.votosNulos === validaciones[0].votosNulos &&
              v.votosBlancos === validaciones[0].votosBlancos &&
              v.votosTotal === validaciones[0].votosTotal
          ),
      }
    }

    return {
      ...result,
      imagenUrl,
      consenso,
    }
  } catch (error) {
    console.error('Error fetching acta by JRV:', error)
    return null
  }
}

/**
 * Calcula la moda (valor más frecuente) de un array de números
 * Retorna null si el array está vacío
 */
function calcularModa(valores: number[]): number | null {
  if (valores.length === 0) return null

  const frecuencias = new Map<number, number>()
  for (const valor of valores) {
    frecuencias.set(valor, (frecuencias.get(valor) || 0) + 1)
  }

  let maxFrecuencia = 0
  let moda = valores[0]

  for (const [valor, frecuencia] of frecuencias) {
    if (frecuencia > maxFrecuencia) {
      maxFrecuencia = frecuencia
      moda = valor
    }
  }

  return moda
}

// ============================================================================
// Explorar Actas (Auditoría Pública)
// ============================================================================

export type ExplorarOrderBy =
  | 'jrv_asc'
  | 'jrv_desc'
  | 'reportes_desc'
  | 'reportes_asc'
  | 'confiabilidad_desc'
  | 'confiabilidad_asc'
  | 'validaciones_desc'
  | 'validaciones_asc'

export type ExplorarFilter =
  | 'todas'
  | 'mis_validaciones'
  | 'mis_reportes'
  | 'validadas'
  | 'reportadas'
  | 'con_discrepancia'
  | 'sin_imagen'
  | 'inconsistencia_cne'

export interface ExplorarActasParams {
  limite?: number
  offset?: number
  orderBy?: ExplorarOrderBy
  filter?: ExplorarFilter
  userId?: string // Required for 'mis_validaciones' and 'mis_reportes' filters
  busqueda?: string // Search by JRV number
}

export interface ActaExplorar {
  id: number
  uuid: string
  cneId: string | null
  jrvNumero: number | null
  estado: string
  departamentoCodigo: number | null
  municipioCodigo: number | null
  tipoZona: string
  cantidadValidaciones: number
  cantidadValidacionesCorrectas: number
  // Calculated fields
  cantidadReportes: number
  confiabilidad: number // 0-100 score
  tieneInconsistenciaCNE: boolean // CNE marked as "Inconsistencia"
  // For display
  departamentoNombre: string | null
  municipioNombre: string | null
}

/**
 * Calcular puntuación de confiabilidad de consenso (0-100)
 *
 * Factores:
 * - 3/3 acuerdo = 100%
 * - 2/3 acuerdo = ~66%
 * - Más validaciones = más confiable
 * - Reportes reducen la confiabilidad
 * - 0 validaciones + reportes = 0% (problema conocido)
 * - 0 validaciones + 0 reportes = 50% (desconocido)
 */
export function calcularConfiabilidad(
  cantidadValidaciones: number,
  cantidadValidacionesCorrectas: number,
  cantidadReportes: number
): number {
  // Sin validaciones: depende de los reportes
  if (cantidadValidaciones === 0) {
    if (cantidadReportes > 0) {
      // Con reportes pero sin validaciones = problema conocido
      // Más reportes = menos confiable (0 a 20)
      return Math.max(0, 20 - cantidadReportes * 5)
    }
    return 50 // Sin info = neutral/desconocido
  }

  // Base: porcentaje de validaciones que coincidieron
  const acuerdoBase = (cantidadValidacionesCorrectas / cantidadValidaciones) * 100

  // Bonus por tener más validaciones (max +10 puntos por 3+ validaciones)
  const bonusValidaciones = Math.min(cantidadValidaciones, 3) * 3.33

  // Penalización por reportes (-10 por cada reporte, max -30)
  const penalizacionReportes = Math.min(cantidadReportes * 10, 30)

  // Calcular score final
  const score = acuerdoBase + bonusValidaciones - penalizacionReportes

  // Clamp entre 0 y 100
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Obtener actas paginadas para exploración/auditoría pública
 */
export async function getActasParaExplorar(params: ExplorarActasParams): Promise<{
  actas: ActaExplorar[]
  total: number
}> {
  const {
    limite = 20,
    offset = 0,
    orderBy = 'jrv_asc',
    filter = 'todas',
    userId,
    busqueda,
  } = params

  // Build the base query with joins for counts
  const baseQuery = sql`
    SELECT 
      a.id,
      a.uuid,
      a.cne_id as "cneId",
      a.jrv_numero as "jrvNumero",
      a.estado,
      a.departamento_codigo as "departamentoCodigo",
      a.municipio_codigo as "municipioCodigo",
      a.tipo_zona as "tipoZona",
      a.cantidad_validaciones as "cantidadValidaciones",
      a.cantidad_validaciones_correctas as "cantidadValidacionesCorrectas",
      COALESCE(d.reporte_count, 0)::int as "cantidadReportes",
      CASE WHEN a.etiquetas_cne::jsonb ? 'Inconsistencia' THEN true ELSE false END as "tieneInconsistenciaCNE",
      dep.nombre as "departamentoNombre",
      mun.nombre as "municipioNombre"
    FROM acta a
    LEFT JOIN (
      SELECT acta_id, COUNT(*) as reporte_count 
      FROM discrepancia 
      GROUP BY acta_id
    ) d ON d.acta_id = a.id
    LEFT JOIN departamento dep ON dep.codigo = a.departamento_codigo
    LEFT JOIN municipio mun ON mun.departamento_codigo = a.departamento_codigo AND mun.codigo = a.municipio_codigo
  `

  // Build WHERE conditions
  const conditions: SQL[] = []

  // Filter conditions
  switch (filter) {
    case 'mis_validaciones':
      if (userId) {
        conditions.push(sql`EXISTS (
          SELECT 1 FROM validacion v WHERE v.acta_id = a.id AND v.usuario_id = ${userId}
        )`)
      }
      break
    case 'mis_reportes':
      if (userId) {
        conditions.push(sql`EXISTS (
          SELECT 1 FROM discrepancia dr WHERE dr.acta_id = a.id AND dr.usuario_id = ${userId}
        )`)
      }
      break
    case 'validadas':
      conditions.push(sql`a.estado = 'validada'`)
      break
    case 'reportadas':
      conditions.push(sql`a.estado = 'bajo_revision'`)
      break
    case 'con_discrepancia':
      conditions.push(sql`a.estado = 'con_discrepancia'`)
      break
    case 'sin_imagen':
      conditions.push(sql`a.tiene_imagen = false`)
      break
    case 'inconsistencia_cne':
      conditions.push(sql`a.etiquetas_cne::jsonb ? 'Inconsistencia'`)
      break
  }

  // Search by JRV number
  if (busqueda) {
    const jrvNumber = parseInt(busqueda, 10)
    if (!isNaN(jrvNumber)) {
      conditions.push(sql`a.jrv_numero = ${jrvNumber}`)
    }
  }

  // Combine conditions
  let whereClause = sql``
  if (conditions.length > 0) {
    whereClause = sql`WHERE ${sql.join(conditions, sql` AND `)}`
  }

  // Build ORDER BY
  let orderClause: SQL
  switch (orderBy) {
    case 'jrv_desc':
      orderClause = sql`ORDER BY a.jrv_numero DESC NULLS LAST`
      break
    case 'reportes_desc':
      orderClause = sql`ORDER BY "cantidadReportes" DESC, a.jrv_numero ASC`
      break
    case 'reportes_asc':
      orderClause = sql`ORDER BY "cantidadReportes" ASC, a.jrv_numero ASC`
      break
    case 'confiabilidad_desc':
      // Order by calculated reliability (higher is better)
      // Formula matches calcularConfiabilidad() function
      orderClause = sql`ORDER BY 
        CASE 
          WHEN a.cantidad_validaciones = 0 AND COALESCE(d.reporte_count, 0) > 0 
            THEN GREATEST(0, 20 - COALESCE(d.reporte_count, 0) * 5)
          WHEN a.cantidad_validaciones = 0 
            THEN 50
          ELSE LEAST(100, GREATEST(0, 
            (a.cantidad_validaciones_correctas::float / NULLIF(a.cantidad_validaciones, 0) * 100) 
            + LEAST(a.cantidad_validaciones, 3) * 3.33 
            - LEAST(COALESCE(d.reporte_count, 0) * 10, 30)
          ))
        END DESC, a.jrv_numero ASC`
      break
    case 'confiabilidad_asc':
      orderClause = sql`ORDER BY 
        CASE 
          WHEN a.cantidad_validaciones = 0 AND COALESCE(d.reporte_count, 0) > 0 
            THEN GREATEST(0, 20 - COALESCE(d.reporte_count, 0) * 5)
          WHEN a.cantidad_validaciones = 0 
            THEN 50
          ELSE LEAST(100, GREATEST(0, 
            (a.cantidad_validaciones_correctas::float / NULLIF(a.cantidad_validaciones, 0) * 100) 
            + LEAST(a.cantidad_validaciones, 3) * 3.33 
            - LEAST(COALESCE(d.reporte_count, 0) * 10, 30)
          ))
        END ASC, a.jrv_numero ASC`
      break
    case 'validaciones_desc':
      orderClause = sql`ORDER BY a.cantidad_validaciones DESC, a.jrv_numero ASC`
      break
    case 'validaciones_asc':
      orderClause = sql`ORDER BY a.cantidad_validaciones ASC, a.jrv_numero ASC`
      break
    case 'jrv_asc':
    default:
      orderClause = sql`ORDER BY a.jrv_numero ASC NULLS LAST`
      break
  }

  // Get total count
  const countQuery = sql`
    SELECT COUNT(*) as total
    FROM acta a
    LEFT JOIN (
      SELECT acta_id, COUNT(*) as reporte_count 
      FROM discrepancia 
      GROUP BY acta_id
    ) d ON d.acta_id = a.id
    ${whereClause}
  `
  const countResult = await db.execute(countQuery)
  const total = Number((countResult as unknown as { total: number }[])[0]?.total || 0)

  // Get paginated results
  const dataQuery = sql`
    ${baseQuery}
    ${whereClause}
    ${orderClause}
    LIMIT ${limite}
    OFFSET ${offset}
  `
  const results = await db.execute(dataQuery)

  // Transform results and calculate confiabilidad
  type RawActaRow = {
    id: number
    uuid: string
    cneId: string | null
    jrvNumero: number | null
    estado: string
    departamentoCodigo: number | null
    municipioCodigo: number | null
    tipoZona: string
    cantidadValidaciones: number
    cantidadValidacionesCorrectas: number
    cantidadReportes: number
    tieneInconsistenciaCNE: boolean
    departamentoNombre: string | null
    municipioNombre: string | null
  }
  const actas: ActaExplorar[] = (results as unknown as RawActaRow[]).map((row) => ({
    id: row.id,
    uuid: row.uuid,
    cneId: row.cneId,
    jrvNumero: row.jrvNumero,
    estado: row.estado,
    departamentoCodigo: row.departamentoCodigo,
    municipioCodigo: row.municipioCodigo,
    tipoZona: row.tipoZona,
    cantidadValidaciones: row.cantidadValidaciones,
    cantidadValidacionesCorrectas: row.cantidadValidacionesCorrectas,
    cantidadReportes: row.cantidadReportes,
    confiabilidad: calcularConfiabilidad(
      row.cantidadValidaciones,
      row.cantidadValidacionesCorrectas,
      row.cantidadReportes
    ),
    tieneInconsistenciaCNE: row.tieneInconsistenciaCNE === true,
    departamentoNombre: row.departamentoNombre,
    municipioNombre: row.municipioNombre,
  }))

  return { actas, total }
}
