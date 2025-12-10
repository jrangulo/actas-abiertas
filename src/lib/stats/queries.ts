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
import type { EstadisticasVotos, VotosPartido, PuntoProgresion } from './types'

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
      votosTotal: sql<number>`COALESCE(SUM(${acta.votosTotalDigitado}), 0)`,
      actasValidadas: sql<number>`COUNT(*)`,
    })
    .from(acta)
    .where(eq(acta.estado, 'validada'))

  // Total de actas
  const [totalActas] = await db.select({ count: sql<number>`COUNT(*)` }).from(acta)

  // Calcular porcentajes para CNE
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

  // Calcular porcentajes para validados
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

  const actasValidadas = Number(validadosStats.actasValidadas)
  const actasTotales = Number(totalActas.count)

  return {
    cne: {
      votosPartidos: cneVotosPartidos,
      votosTotales: Number(cneStats.votosTotal),
      actasConDatos: Number(cneStats.actasConDatos),
    },
    validados: {
      votosPartidos: validadosVotosPartidos,
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

  const totalActas = actasValidadas.length
  const intervalo = Math.max(1, Math.floor(totalActas / puntosMuestreo))

  const puntos: PuntoProgresion[] = []
  let acumuladoPn = 0
  let acumuladoPlh = 0
  let acumuladoPl = 0

  for (let i = 0; i < actasValidadas.length; i++) {
    const acta = actasValidadas[i]
    acumuladoPn += acta.votosPn || 0
    acumuladoPlh += acta.votosPlh || 0
    acumuladoPl += acta.votosPl || 0

    // Solo agregar punto en intervalos o al final
    if ((i + 1) % intervalo === 0 || i === actasValidadas.length - 1) {
      const totalPartidos = acumuladoPn + acumuladoPlh + acumuladoPl

      puntos.push({
        cobertura: ((i + 1) / totalActas) * 100,
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
