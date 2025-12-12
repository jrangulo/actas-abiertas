/**
 * Consultas de estadísticas electorales
 *
 * Este módulo contiene las consultas para obtener datos de votación
 * comparando los datos oficiales del CNE con nuestros datos validados.
 *
 * IMPORTANTE: Solo se consideran actas con estado 'validada' para nuestros datos.
 */

import { db } from '@/db'
import { acta } from '@/db/schema'
import { eq, sql, and, isNotNull, gt, not } from 'drizzle-orm'
import type {
  EstadisticasVotos,
  VotosPartido,
  VotosTodoPartido,
  PuntoProgresion,
  DistribucionZona,
  PuntoProgresionValores,
} from './types'

// Re-exportar tipos para uso en server components
export * from './types'

/**
 * Obtener estadísticas de votos comparando CNE vs datos validados
 *
 * Esta consulta es eficiente: usa agregaciones SQL en lugar de traer todos los registros
 */
export async function getEstadisticasVotos(): Promise<EstadisticasVotos> {
  // Consulta agregada para datos del CNE (actas que tienen datos oficiales)
  const [cneStats] = await db
    .select({
      votosPn: sql<number>`COALESCE(SUM(${acta.votosPnOficial}), 0)`,
      votosPlh: sql<number>`COALESCE(SUM(${acta.votosPlhOficial}), 0)`,
      votosPl: sql<number>`COALESCE(SUM(${acta.votosPlOficial}), 0)`,
      votosPinu: sql<number>`COALESCE(SUM(${acta.votosPinuOficial}), 0)`,
      votosDc: sql<number>`COALESCE(SUM(${acta.votosDcOficial}), 0)`,
      votosNulos: sql<number>`COALESCE(SUM(${acta.votosNulosOficial}), 0)`,
      votosBlancos: sql<number>`COALESCE(SUM(${acta.votosBlancosOficial}), 0)`,
      votosTotal: sql<number>`COALESCE(SUM(${acta.votosTotalOficial}), 0)`,
      actasConDatos: sql<number>`COUNT(CASE WHEN ${acta.votosTotalOficial} IS NOT NULL AND ${acta.votosTotalOficial} > 0 THEN 1 END)`,
    })
    .from(acta)

  // Consulta agregada para nuestros datos validados
  const [validadosStats] = await db
    .select({
      votosPn: sql<number>`COALESCE(SUM(${acta.votosPnDigitado}), 0)`,
      votosPlh: sql<number>`COALESCE(SUM(${acta.votosPlhDigitado}), 0)`,
      votosPl: sql<number>`COALESCE(SUM(${acta.votosPlDigitado}), 0)`,
      votosPinu: sql<number>`COALESCE(SUM(${acta.votosPinuDigitado}), 0)`,
      votosDc: sql<number>`COALESCE(SUM(${acta.votosDcDigitado}), 0)`,
      votosNulos: sql<number>`COALESCE(SUM(${acta.votosNulosDigitado}), 0)`,
      votosBlancos: sql<number>`COALESCE(SUM(${acta.votosBlancosDigitado}), 0)`,
      votosTotal: sql<number>`COALESCE(SUM(${acta.votosTotalDigitado}), 0)`,
      actasValidadas: sql<number>`COUNT(*)`,
    })
    .from(acta)
    .where(eq(acta.estado, 'validada'))

  // Total de actas
  const [totalActas] = await db.select({ count: sql<number>`COUNT(*)` }).from(acta)

  // Actas en proceso de validación (tienen entre 1-2 validaciones, aún no completas)
  const [enValidacionStats] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(acta)
    .where(eq(acta.estado, 'en_validacion'))

  // Total validaciones realizadas (suma de todas las validaciones individuales)
  const [validacionesStats] = await db
    .select({
      sum: sql<number>`COALESCE(SUM(${acta.cantidadValidaciones}), 0)`,
    })
    .from(acta)

  // Reusable: etiqueta "Inconsistencia" del CNE en etiquetas_cne (json)
  const hasEtiquetaInconsistencia = sql<boolean>`(COALESCE(${acta.etiquetasCNE}::jsonb, '[]'::jsonb) ? 'Inconsistencia')`

  // =========================================================================
  // Comparación: actas validadas por nosotros que también tienen datos CNE
  // (EXCLUYE actas con etiqueta "Inconsistencia")
  // =========================================================================
  // Nota importante: aquí NO usamos COALESCE para el filtro.
  // Exigimos que el CNE tenga los campos top-3 presentes y que su suma sea > 0.
  const cneTop3TotalRaw = sql<number>`(${acta.votosPnOficial} + ${acta.votosPlhOficial} + ${acta.votosPlOficial})`
  const [comparacionStats] = await db
    .select({
      actas: sql<number>`COUNT(*)`,
      actasConDiferenciaTop3: sql<number>`COUNT(CASE WHEN
        (${acta.votosPnDigitado} IS DISTINCT FROM ${acta.votosPnOficial}) OR
        (${acta.votosPlhDigitado} IS DISTINCT FROM ${acta.votosPlhOficial}) OR
        (${acta.votosPlDigitado} IS DISTINCT FROM ${acta.votosPlOficial})
      THEN 1 END)`,
      // Validados (digitado)
      valPn: sql<number>`COALESCE(SUM(${acta.votosPnDigitado}), 0)`,
      valPlh: sql<number>`COALESCE(SUM(${acta.votosPlhDigitado}), 0)`,
      valPl: sql<number>`COALESCE(SUM(${acta.votosPlDigitado}), 0)`,
      // CNE (oficial) para las mismas actas
      cnePn: sql<number>`COALESCE(SUM(${acta.votosPnOficial}), 0)`,
      cnePlh: sql<number>`COALESCE(SUM(${acta.votosPlhOficial}), 0)`,
      cnePl: sql<number>`COALESCE(SUM(${acta.votosPlOficial}), 0)`,
    })
    .from(acta)
    .where(
      and(
        eq(acta.estado, 'validada'),
        not(hasEtiquetaInconsistencia),
        isNotNull(acta.votosTotalOficial),
        gt(acta.votosTotalOficial, 0),
        isNotNull(acta.votosPnDigitado),
        isNotNull(acta.votosPlhDigitado),
        isNotNull(acta.votosPlDigitado),
        isNotNull(acta.votosPnOficial),
        isNotNull(acta.votosPlhOficial),
        isNotNull(acta.votosPlOficial),
        gt(cneTop3TotalRaw, 0)
      )
    )

  // =========================================================================
  // Subconjunto: actas con etiqueta "Inconsistencia" (CNE) que ya están validadas
  // =========================================================================
  const [inconsistenciaStats] = await db
    .select({
      actas: sql<number>`COUNT(*)`,
      valPn: sql<number>`COALESCE(SUM(${acta.votosPnDigitado}), 0)`,
      valPlh: sql<number>`COALESCE(SUM(${acta.votosPlhDigitado}), 0)`,
      valPl: sql<number>`COALESCE(SUM(${acta.votosPlDigitado}), 0)`,
    })
    .from(acta)
    .where(and(eq(acta.estado, 'validada'), hasEtiquetaInconsistencia))

  // =========================================================================
  // Diagnóstico: cuántas actas validadas (SIN inconsistencia) tienen top-3 oficial = 0
  // =========================================================================
  const cneTop3TotalCoalesced = sql<number>`(
    COALESCE(${acta.votosPnOficial}, 0) +
    COALESCE(${acta.votosPlhOficial}, 0) +
    COALESCE(${acta.votosPlOficial}, 0)
  )`
  const [cneTop3CeroStats] = await db
    .select({
      total: sql<number>`COUNT(*)`,
      totalOficialPositivo: sql<number>`COUNT(CASE WHEN ${acta.votosTotalOficial} IS NOT NULL AND ${acta.votosTotalOficial} > 0 THEN 1 END)`,
    })
    .from(acta)
    .where(
      and(eq(acta.estado, 'validada'), not(hasEtiquetaInconsistencia), eq(cneTop3TotalCoalesced, 0))
    )

  // --- Votos principales (para gráfica de progresión, solo 3 partidos) ---
  const cneTotalPartidos =
    Number(cneStats.votosPn) + Number(cneStats.votosPlh) + Number(cneStats.votosPl)
  const cneVotosPartidos: VotosPartido[] = [
    {
      partido: 'PN',
      votos: Number(cneStats.votosPn),
      porcentaje: cneTotalPartidos > 0 ? (Number(cneStats.votosPn) / cneTotalPartidos) * 100 : 0,
    },
    {
      partido: 'PLH',
      votos: Number(cneStats.votosPlh),
      porcentaje: cneTotalPartidos > 0 ? (Number(cneStats.votosPlh) / cneTotalPartidos) * 100 : 0,
    },
    {
      partido: 'PL',
      votos: Number(cneStats.votosPl),
      porcentaje: cneTotalPartidos > 0 ? (Number(cneStats.votosPl) / cneTotalPartidos) * 100 : 0,
    },
  ]

  // --- Todos los partidos + blancos + nulos (para cards de estadísticas) ---
  const cneTotalTodos =
    Number(cneStats.votosPn) +
    Number(cneStats.votosPlh) +
    Number(cneStats.votosPl) +
    Number(cneStats.votosPinu) +
    Number(cneStats.votosDc) +
    Number(cneStats.votosBlancos) +
    Number(cneStats.votosNulos)

  const cneVotosTodosPartidos: VotosTodoPartido[] = [
    {
      partido: 'DC',
      votos: Number(cneStats.votosDc),
      porcentaje: cneTotalTodos > 0 ? (Number(cneStats.votosDc) / cneTotalTodos) * 100 : 0,
    },
    {
      partido: 'PL',
      votos: Number(cneStats.votosPl),
      porcentaje: cneTotalTodos > 0 ? (Number(cneStats.votosPl) / cneTotalTodos) * 100 : 0,
    },
    {
      partido: 'PINU',
      votos: Number(cneStats.votosPinu),
      porcentaje: cneTotalTodos > 0 ? (Number(cneStats.votosPinu) / cneTotalTodos) * 100 : 0,
    },
    {
      partido: 'PLH',
      votos: Number(cneStats.votosPlh),
      porcentaje: cneTotalTodos > 0 ? (Number(cneStats.votosPlh) / cneTotalTodos) * 100 : 0,
    },
    {
      partido: 'PN',
      votos: Number(cneStats.votosPn),
      porcentaje: cneTotalTodos > 0 ? (Number(cneStats.votosPn) / cneTotalTodos) * 100 : 0,
    },
    {
      partido: 'Blancos',
      votos: Number(cneStats.votosBlancos),
      porcentaje: cneTotalTodos > 0 ? (Number(cneStats.votosBlancos) / cneTotalTodos) * 100 : 0,
    },
    {
      partido: 'Nulos',
      votos: Number(cneStats.votosNulos),
      porcentaje: cneTotalTodos > 0 ? (Number(cneStats.votosNulos) / cneTotalTodos) * 100 : 0,
    },
  ]

  // Calcular porcentajes para validados (3 principales)
  const validadosTotalPartidos =
    Number(validadosStats.votosPn) +
    Number(validadosStats.votosPlh) +
    Number(validadosStats.votosPl)
  const validadosVotosPartidos: VotosPartido[] = [
    {
      partido: 'PN',
      votos: Number(validadosStats.votosPn),
      porcentaje:
        validadosTotalPartidos > 0
          ? (Number(validadosStats.votosPn) / validadosTotalPartidos) * 100
          : 0,
    },
    {
      partido: 'PLH',
      votos: Number(validadosStats.votosPlh),
      porcentaje:
        validadosTotalPartidos > 0
          ? (Number(validadosStats.votosPlh) / validadosTotalPartidos) * 100
          : 0,
    },
    {
      partido: 'PL',
      votos: Number(validadosStats.votosPl),
      porcentaje:
        validadosTotalPartidos > 0
          ? (Number(validadosStats.votosPl) / validadosTotalPartidos) * 100
          : 0,
    },
  ]

  // Todos los partidos validados
  const validadosTotalTodos =
    Number(validadosStats.votosPn) +
    Number(validadosStats.votosPlh) +
    Number(validadosStats.votosPl) +
    Number(validadosStats.votosPinu) +
    Number(validadosStats.votosDc) +
    Number(validadosStats.votosBlancos) +
    Number(validadosStats.votosNulos)

  const validadosVotosTodosPartidos: VotosTodoPartido[] = [
    {
      partido: 'DC',
      votos: Number(validadosStats.votosDc),
      porcentaje:
        validadosTotalTodos > 0 ? (Number(validadosStats.votosDc) / validadosTotalTodos) * 100 : 0,
    },
    {
      partido: 'PL',
      votos: Number(validadosStats.votosPl),
      porcentaje:
        validadosTotalTodos > 0 ? (Number(validadosStats.votosPl) / validadosTotalTodos) * 100 : 0,
    },
    {
      partido: 'PINU',
      votos: Number(validadosStats.votosPinu),
      porcentaje:
        validadosTotalTodos > 0
          ? (Number(validadosStats.votosPinu) / validadosTotalTodos) * 100
          : 0,
    },
    {
      partido: 'PLH',
      votos: Number(validadosStats.votosPlh),
      porcentaje:
        validadosTotalTodos > 0 ? (Number(validadosStats.votosPlh) / validadosTotalTodos) * 100 : 0,
    },
    {
      partido: 'PN',
      votos: Number(validadosStats.votosPn),
      porcentaje:
        validadosTotalTodos > 0 ? (Number(validadosStats.votosPn) / validadosTotalTodos) * 100 : 0,
    },
    {
      partido: 'Blancos',
      votos: Number(validadosStats.votosBlancos),
      porcentaje:
        validadosTotalTodos > 0
          ? (Number(validadosStats.votosBlancos) / validadosTotalTodos) * 100
          : 0,
    },
    {
      partido: 'Nulos',
      votos: Number(validadosStats.votosNulos),
      porcentaje:
        validadosTotalTodos > 0
          ? (Number(validadosStats.votosNulos) / validadosTotalTodos) * 100
          : 0,
    },
  ]

  const actasValidadas = Number(validadosStats.actasValidadas)
  const actasTotales = Number(totalActas.count)
  const actasEnValidacion = Number(enValidacionStats.count)
  const validacionesRealizadas = Number(validacionesStats.sum)
  const validacionesNecesarias = actasTotales * 3

  // ---- Comparación validados vs CNE (mismas actas) ----
  const comparacionActas = Number(comparacionStats.actas)
  const actasConDiferenciaTop3 = Number(comparacionStats.actasConDiferenciaTop3)
  const compCneTotal =
    Number(comparacionStats.cnePn) +
    Number(comparacionStats.cnePlh) +
    Number(comparacionStats.cnePl)
  const compValTotal =
    Number(comparacionStats.valPn) +
    Number(comparacionStats.valPlh) +
    Number(comparacionStats.valPl)

  const compCnePartidos: VotosPartido[] = [
    {
      partido: 'PN',
      votos: Number(comparacionStats.cnePn),
      porcentaje: compCneTotal > 0 ? (Number(comparacionStats.cnePn) / compCneTotal) * 100 : 0,
    },
    {
      partido: 'PLH',
      votos: Number(comparacionStats.cnePlh),
      porcentaje: compCneTotal > 0 ? (Number(comparacionStats.cnePlh) / compCneTotal) * 100 : 0,
    },
    {
      partido: 'PL',
      votos: Number(comparacionStats.cnePl),
      porcentaje: compCneTotal > 0 ? (Number(comparacionStats.cnePl) / compCneTotal) * 100 : 0,
    },
  ]

  const compValPartidos: VotosPartido[] = [
    {
      partido: 'PN',
      votos: Number(comparacionStats.valPn),
      porcentaje: compValTotal > 0 ? (Number(comparacionStats.valPn) / compValTotal) * 100 : 0,
    },
    {
      partido: 'PLH',
      votos: Number(comparacionStats.valPlh),
      porcentaje: compValTotal > 0 ? (Number(comparacionStats.valPlh) / compValTotal) * 100 : 0,
    },
    {
      partido: 'PL',
      votos: Number(comparacionStats.valPl),
      porcentaje: compValTotal > 0 ? (Number(comparacionStats.valPl) / compValTotal) * 100 : 0,
    },
  ]

  const diferencias = (['PN', 'PLH', 'PL'] as const).map((p) => {
    const cne = compCnePartidos.find((x) => x.partido === p)!
    const val = compValPartidos.find((x) => x.partido === p)!
    return {
      partido: p,
      diferenciaVotos: val.votos - cne.votos,
      diferenciaPorcentajePuntos: val.porcentaje - cne.porcentaje,
    }
  })

  // ---- Inconsistencias validadas ----
  const incActas = Number(inconsistenciaStats.actas)
  const incTotal =
    Number(inconsistenciaStats.valPn) +
    Number(inconsistenciaStats.valPlh) +
    Number(inconsistenciaStats.valPl)
  const incVotosPartidos: VotosPartido[] = [
    {
      partido: 'PN',
      votos: Number(inconsistenciaStats.valPn),
      porcentaje: incTotal > 0 ? (Number(inconsistenciaStats.valPn) / incTotal) * 100 : 0,
    },
    {
      partido: 'PLH',
      votos: Number(inconsistenciaStats.valPlh),
      porcentaje: incTotal > 0 ? (Number(inconsistenciaStats.valPlh) / incTotal) * 100 : 0,
    },
    {
      partido: 'PL',
      votos: Number(inconsistenciaStats.valPl),
      porcentaje: incTotal > 0 ? (Number(inconsistenciaStats.valPl) / incTotal) * 100 : 0,
    },
  ]

  return {
    cne: {
      votosPartidos: cneVotosPartidos,
      votosTodosPartidos: cneVotosTodosPartidos,
      votosTotales: Number(cneStats.votosTotal),
      actasConDatos: Number(cneStats.actasConDatos),
    },
    validados: {
      votosPartidos: validadosVotosPartidos,
      votosTodosPartidos: validadosVotosTodosPartidos,
      votosTotales: Number(validadosStats.votosTotal),
      actasValidadas,
    },
    cobertura: {
      actasTotales,
      // Fully validated (3+ validations with consensus)
      actasValidadas,
      porcentajeValidadas: actasTotales > 0 ? (actasValidadas / actasTotales) * 100 : 0,
      // In progress (1-2 validations)
      actasEnValidacion,
      porcentajeEnValidacion: actasTotales > 0 ? (actasEnValidacion / actasTotales) * 100 : 0,
      // Individual validations progress
      validacionesRealizadas,
      validacionesNecesarias,
      porcentajeValidaciones:
        validacionesNecesarias > 0 ? (validacionesRealizadas / validacionesNecesarias) * 100 : 0,
    },
    comparacionValidadosVsCne:
      comparacionActas > 0
        ? {
            actasComparadas: comparacionActas,
            actasConDiferenciaTop3,
            cneTop3CeroEnValidadasSinInconsistencia: Number(cneTop3CeroStats.total),
            cneTop3CeroPeroTotalOficialPositivoSinInconsistencia: Number(
              cneTop3CeroStats.totalOficialPositivo
            ),
            cne: { votosPartidos: compCnePartidos, totalPartidos: compCneTotal },
            validados: { votosPartidos: compValPartidos, totalPartidos: compValTotal },
            diferencias,
          }
        : undefined,
    inconsistenciasValidadas:
      incActas > 0
        ? {
            actas: incActas,
            votosPartidos: incVotosPartidos,
            totalPartidos: incTotal,
          }
        : undefined,
  }
}

/**
 * Datos para el gráfico de progresión
 *
 * Retorna puntos de datos mostrando cómo cambian los porcentajes
 * a medida que aumenta la cobertura de validación.
 *
 * Para eficiencia, muestreamos en intervalos (no cada acta individual)
 */
export async function getProgresionVotos(puntosMuestreo: number = 20): Promise<PuntoProgresion[]> {
  // Obtener total de actas en el sistema para calcular cobertura real
  const [totalActasResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(acta)
  const totalActasSistema = Number(totalActasResult.count)

  // Obtener actas validadas ordenadas por fecha de actualización
  // Solo traemos los campos necesarios para eficiencia
  const actasValidadas = await db
    .select({
      votosPn: acta.votosPnDigitado,
      votosPlh: acta.votosPlhDigitado,
      votosPl: acta.votosPlDigitado,
    })
    .from(acta)
    .where(and(eq(acta.estado, 'validada'), isNotNull(acta.actualizadoEn)))
    .orderBy(acta.actualizadoEn)

  if (actasValidadas.length === 0) {
    return []
  }

  const totalValidadas = actasValidadas.length
  const intervalo = Math.max(1, Math.floor(totalValidadas / puntosMuestreo))

  const puntos: PuntoProgresion[] = []
  let acumuladoPn = 0
  let acumuladoPlh = 0
  let acumuladoPl = 0

  for (let i = 0; i < actasValidadas.length; i++) {
    const actaItem = actasValidadas[i]
    acumuladoPn += actaItem.votosPn || 0
    acumuladoPlh += actaItem.votosPlh || 0
    acumuladoPl += actaItem.votosPl || 0

    // Solo agregar punto en intervalos o al final
    if ((i + 1) % intervalo === 0 || i === actasValidadas.length - 1) {
      const totalPartidos = acumuladoPn + acumuladoPlh + acumuladoPl

      puntos.push({
        // Cobertura = actas validadas hasta este punto / total de actas en sistema
        cobertura: ((i + 1) / totalActasSistema) * 100,
        actasAcumuladas: i + 1,
        porcentajes: {
          PN: totalPartidos > 0 ? (acumuladoPn / totalPartidos) * 100 : 0,
          PLH: totalPartidos > 0 ? (acumuladoPlh / totalPartidos) * 100 : 0,
          PL: totalPartidos > 0 ? (acumuladoPl / totalPartidos) * 100 : 0,
        },
      })
    }
  }

  return puntos
}

/**
 * Datos para el gráfico de valores acumulados en validación
 *
 * Retorna puntos de datos mostrando cómo cambian los valores (votos acumulados)
 * a medida que aumenta la cobertura de validación.
 *
 * Para eficiencia, muestreamos en intervalos (no cada acta individual)
 */
export async function getProgresionValoresValidacion(
  puntosMuestreo: number = 20
): Promise<PuntoProgresionValores[]> {
  // Obtener total de actas en el sistema para calcular cobertura real
  const [totalActasResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(acta)
  const totalActasSistema = Number(totalActasResult.count)

  // Obtener actas validadas ordenadas por fecha de actualización
  // Solo traemos los campos necesarios para eficiencia
  const actasValidadas = await db
    .select({
      votosPn: acta.votosPnDigitado,
      votosPlh: acta.votosPlhDigitado,
      votosPl: acta.votosPlDigitado,
    })
    .from(acta)
    .where(and(eq(acta.estado, 'validada'), isNotNull(acta.actualizadoEn)))
    .orderBy(acta.actualizadoEn)

  if (actasValidadas.length === 0) {
    return []
  }

  const totalValidadas = actasValidadas.length
  const intervalo = Math.max(1, Math.floor(totalValidadas / puntosMuestreo))

  const puntos: PuntoProgresionValores[] = []
  let acumuladoPn = 0
  let acumuladoPlh = 0
  let acumuladoPl = 0

  for (let i = 0; i < actasValidadas.length; i++) {
    const actaItem = actasValidadas[i]
    acumuladoPn += actaItem.votosPn || 0
    acumuladoPlh += actaItem.votosPlh || 0
    acumuladoPl += actaItem.votosPl || 0

    // Solo agregar punto en intervalos o al final
    if ((i + 1) % intervalo === 0 || i === actasValidadas.length - 1) {
      puntos.push({
        // Cobertura = actas validadas hasta este punto / total de actas en sistema
        cobertura: ((i + 1) / totalActasSistema) * 100,
        actasAcumuladas: i + 1,
        votos: {
          PN: acumuladoPn,
          PLH: acumuladoPlh,
          PL: acumuladoPl,
        },
      })
    }
  }

  return puntos
}

/**
 * Obtener distribución de votos por zona (urbano vs rural)
 * Solo considera actas validadas
 */
export async function getDistribucionZona(): Promise<DistribucionZona> {
  // Query for urban votes
  const [urbanoStats] = await db
    .select({
      actas: sql<number>`COUNT(*)`,
      votosPn: sql<number>`COALESCE(SUM(${acta.votosPnDigitado}), 0)`,
      votosPlh: sql<number>`COALESCE(SUM(${acta.votosPlhDigitado}), 0)`,
      votosPl: sql<number>`COALESCE(SUM(${acta.votosPlDigitado}), 0)`,
    })
    .from(acta)
    .where(and(eq(acta.estado, 'validada'), eq(acta.tipoZona, 'urbano')))

  // Query for rural votes
  const [ruralStats] = await db
    .select({
      actas: sql<number>`COUNT(*)`,
      votosPn: sql<number>`COALESCE(SUM(${acta.votosPnDigitado}), 0)`,
      votosPlh: sql<number>`COALESCE(SUM(${acta.votosPlhDigitado}), 0)`,
      votosPl: sql<number>`COALESCE(SUM(${acta.votosPlDigitado}), 0)`,
    })
    .from(acta)
    .where(and(eq(acta.estado, 'validada'), eq(acta.tipoZona, 'rural')))

  // Calculate totals and percentages for urban
  const urbanoTotal =
    Number(urbanoStats.votosPn) + Number(urbanoStats.votosPlh) + Number(urbanoStats.votosPl)
  const urbano = {
    actas: Number(urbanoStats.actas),
    votos: {
      pn: Number(urbanoStats.votosPn),
      plh: Number(urbanoStats.votosPlh),
      pl: Number(urbanoStats.votosPl),
      total: urbanoTotal,
    },
    porcentajes: {
      pn: urbanoTotal > 0 ? (Number(urbanoStats.votosPn) / urbanoTotal) * 100 : 0,
      plh: urbanoTotal > 0 ? (Number(urbanoStats.votosPlh) / urbanoTotal) * 100 : 0,
      pl: urbanoTotal > 0 ? (Number(urbanoStats.votosPl) / urbanoTotal) * 100 : 0,
    },
  }

  // Calculate totals and percentages for rural
  const ruralTotal =
    Number(ruralStats.votosPn) + Number(ruralStats.votosPlh) + Number(ruralStats.votosPl)
  const rural = {
    actas: Number(ruralStats.actas),
    votos: {
      pn: Number(ruralStats.votosPn),
      plh: Number(ruralStats.votosPlh),
      pl: Number(ruralStats.votosPl),
      total: ruralTotal,
    },
    porcentajes: {
      pn: ruralTotal > 0 ? (Number(ruralStats.votosPn) / ruralTotal) * 100 : 0,
      plh: ruralTotal > 0 ? (Number(ruralStats.votosPlh) / ruralTotal) * 100 : 0,
      pl: ruralTotal > 0 ? (Number(ruralStats.votosPl) / ruralTotal) * 100 : 0,
    },
  }

  return { urbano, rural }
}
/**
 * Obtener estadísticas de votos por departamento y municipio (OPTIMIZADO)
 *
 * Solo considera actas validadas. Retorna votos de los 3 partidos principales
 * y la suma de los demás como "Otros".
 */
// Tipo para las filas del resultado de la consulta SQL
interface DepartamentoRow {
  depto_codigo: number
  depto_nombre: string
  depto_actas_totales: string | number
  depto_actas_validadas: string | number
  depto_votos_pn: string | number
  depto_votos_plh: string | number
  depto_votos_pl: string | number
  depto_votos_otros: string | number
  muni_codigo: number | null
  muni_nombre: string | null
  muni_actas_totales: string | number
  muni_actas_validadas: string | number
  muni_votos_pn: string | number
  muni_votos_plh: string | number
  muni_votos_pl: string | number
  muni_votos_otros: string | number
  zona_tipo: 'urbano' | 'rural' | null
  zona_actas_totales: string | number
  zona_actas_validadas: string | number
  zona_votos_pn: string | number
  zona_votos_plh: string | number
  zona_votos_pl: string | number
  zona_votos_otros: string | number
}
export async function getEstadisticasPorDepartamento(): Promise<
  import('./types').EstadisticasDepartamento[]
> {
  const result = await db.execute(sql`
    WITH actas_base AS (
      SELECT
        departamento_codigo,
        municipio_codigo,
        tipo_zona,
        estado,
        COALESCE(votos_pn_digitado, 0) AS votos_pn,
        COALESCE(votos_plh_digitado, 0) AS votos_plh,
        COALESCE(votos_pl_digitado, 0) AS votos_pl,
        COALESCE(votos_pinu_digitado, 0)
        + COALESCE(votos_dc_digitado, 0)
        + COALESCE(votos_nulos_digitado, 0)
        + COALESCE(votos_blancos_digitado, 0) AS votos_otros
      FROM acta
      WHERE departamento_codigo IS NOT NULL
    ),

    agg_depto AS (
      SELECT
        departamento_codigo,
        COUNT(*) AS actas_totales,
        COUNT(*) FILTER (WHERE estado = 'validada') AS actas_validadas,
        SUM(votos_pn) FILTER (WHERE estado = 'validada') AS votos_pn,
        SUM(votos_plh) FILTER (WHERE estado = 'validada') AS votos_plh,
        SUM(votos_pl) FILTER (WHERE estado = 'validada') AS votos_pl,
        SUM(votos_otros) FILTER (WHERE estado = 'validada') AS votos_otros
      FROM actas_base
      GROUP BY departamento_codigo
    ),

    agg_muni AS (
      SELECT
        departamento_codigo,
        municipio_codigo,
        COUNT(*) AS actas_totales,
        COUNT(*) FILTER (WHERE estado = 'validada') AS actas_validadas,
        SUM(votos_pn) FILTER (WHERE estado = 'validada') AS votos_pn,
        SUM(votos_plh) FILTER (WHERE estado = 'validada') AS votos_plh,
        SUM(votos_pl) FILTER (WHERE estado = 'validada') AS votos_pl,
        SUM(votos_otros) FILTER (WHERE estado = 'validada') AS votos_otros
      FROM actas_base
      WHERE municipio_codigo IS NOT NULL
      GROUP BY departamento_codigo, municipio_codigo
    ),

    agg_zona AS (
      SELECT
        departamento_codigo,
        municipio_codigo,
        tipo_zona,
        COUNT(*) AS actas_totales,
        COUNT(*) FILTER (WHERE estado = 'validada') AS actas_validadas,
        SUM(votos_pn) FILTER (WHERE estado = 'validada') AS votos_pn,
        SUM(votos_plh) FILTER (WHERE estado = 'validada') AS votos_plh,
        SUM(votos_pl) FILTER (WHERE estado = 'validada') AS votos_pl,
        SUM(votos_otros) FILTER (WHERE estado = 'validada') AS votos_otros
      FROM actas_base
      WHERE municipio_codigo IS NOT NULL
      GROUP BY departamento_codigo, municipio_codigo, tipo_zona
    )

    SELECT 
      d.codigo AS depto_codigo,
      d.nombre AS depto_nombre,
      COALESCE(ad.actas_totales, 0) AS depto_actas_totales,
      COALESCE(ad.actas_validadas, 0) AS depto_actas_validadas,
      COALESCE(ad.votos_pn, 0) AS depto_votos_pn,
      COALESCE(ad.votos_plh, 0) AS depto_votos_plh,
      COALESCE(ad.votos_pl, 0) AS depto_votos_pl,
      COALESCE(ad.votos_otros, 0) AS depto_votos_otros,

      m.codigo AS muni_codigo,
      m.nombre AS muni_nombre,
      COALESCE(am.actas_totales, 0) AS muni_actas_totales,
      COALESCE(am.actas_validadas, 0) AS muni_actas_validadas,
      COALESCE(am.votos_pn, 0) AS muni_votos_pn,
      COALESCE(am.votos_plh, 0) AS muni_votos_plh,
      COALESCE(am.votos_pl, 0) AS muni_votos_pl,
      COALESCE(am.votos_otros, 0) AS muni_votos_otros,

      az.tipo_zona AS zona_tipo,
      COALESCE(az.actas_totales, 0) AS zona_actas_totales,
      COALESCE(az.actas_validadas, 0) AS zona_actas_validadas,
      COALESCE(az.votos_pn, 0) AS zona_votos_pn,
      COALESCE(az.votos_plh, 0) AS zona_votos_plh,
      COALESCE(az.votos_pl, 0) AS zona_votos_pl,
      COALESCE(az.votos_otros, 0) AS zona_votos_otros

    FROM departamento d
    LEFT JOIN agg_depto ad ON ad.departamento_codigo = d.codigo
    LEFT JOIN municipio m ON m.departamento_codigo = d.codigo
    LEFT JOIN agg_muni am ON am.departamento_codigo = m.departamento_codigo
                          AND am.municipio_codigo = m.codigo
    LEFT JOIN agg_zona az ON az.departamento_codigo = m.departamento_codigo
                          AND az.municipio_codigo = m.codigo
    ORDER BY d.codigo, m.codigo, az.tipo_zona;
  `)

  const rows = result as unknown as DepartamentoRow[]
  const departamentosMap = new Map<number, import('./types').EstadisticasDepartamento>()

  for (const row of rows) {
    const deptoCodigo = Number(row.depto_codigo)

    if (!departamentosMap.has(deptoCodigo)) {
      departamentosMap.set(deptoCodigo, {
        codigo: deptoCodigo,
        nombre: row.depto_nombre,
        actasTotales: Number(row.depto_actas_totales),
        actasValidadas: Number(row.depto_actas_validadas),
        votosPn: Number(row.depto_votos_pn),
        votosPlh: Number(row.depto_votos_plh),
        votosPl: Number(row.depto_votos_pl),
        votosOtros: Number(row.depto_votos_otros),
        municipios: [],
      })
    }

    const depto = departamentosMap.get(deptoCodigo)!

    if (row.muni_codigo && row.muni_nombre) {
      const muniCodigo = Number(row.muni_codigo)
      let municipio = depto.municipios.find((x) => x.codigo === muniCodigo)

      if (!municipio) {
        municipio = {
          codigo: muniCodigo,
          nombre: row.muni_nombre,
          actasTotales: Number(row.muni_actas_totales),
          actasValidadas: Number(row.muni_actas_validadas),
          votosPn: Number(row.muni_votos_pn),
          votosPlh: Number(row.muni_votos_plh),
          votosPl: Number(row.muni_votos_pl),
          votosOtros: Number(row.muni_votos_otros),
          zonas: [],
        }
        depto.municipios.push(municipio)
      }

      if (row.zona_tipo) {
        const exists = municipio.zonas.find((z) => z.tipoZona === row.zona_tipo)
        if (!exists) {
          municipio.zonas.push({
            tipoZona: row.zona_tipo,
            actasTotales: Number(row.zona_actas_totales),
            actasValidadas: Number(row.zona_actas_validadas),
            votosPn: Number(row.zona_votos_pn),
            votosPlh: Number(row.zona_votos_plh),
            votosPl: Number(row.zona_votos_pl),
            votosOtros: Number(row.zona_votos_otros),
          })
        }
      }
    }
  }

  return [...departamentosMap.values()].sort((a, b) => a.codigo - b.codigo)
}
