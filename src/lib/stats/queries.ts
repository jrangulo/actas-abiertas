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
import { eq, sql, and, isNotNull } from 'drizzle-orm'
import type { EstadisticasVotos, VotosPartido, VotosTodoPartido, PuntoProgresion } from './types'

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
      actasValidadas,
      porcentaje: actasTotales > 0 ? (actasValidadas / actasTotales) * 100 : 0,
    },
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
