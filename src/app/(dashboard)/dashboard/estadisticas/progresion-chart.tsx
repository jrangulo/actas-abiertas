'use client'

import {
  COLORES_PARTIDOS,
  PARTIDOS_PRINCIPALES,
  type PuntoProgresion,
  type PartidoPrincipal,
} from '@/lib/stats/types'
import { LineChart } from '@/components/ui/chart'

interface ProgresionChartProps {
  data: PuntoProgresion[]
}

const PARTIDOS: PartidoPrincipal[] = [...PARTIDOS_PRINCIPALES]

/**
 * Genera ticks apropiados para el eje X basados en el valor máximo
 * Crea 5 ticks espaciados uniformemente con valores "bonitos"
 */
function generateXAxisTicks(max: number): number[] {
  // Para mobile (y para evitar ticks raros tipo 0.025%), forzamos a mostrar al menos 1% de rango.
  // Esto hace que los pasos sean más legibles (0.5%, 1%, etc.) incluso cuando la cobertura es muy baja.
  const effectiveMax = Math.max(max, 1)

  if (effectiveMax <= 1) {
    return [0, 0.5, 1]
  }

  if (effectiveMax <= 5) {
    const niceMax = Math.ceil(effectiveMax)
    // 0..niceMax con pasos de 1%
    return Array.from({ length: niceMax + 1 }, (_, i) => i)
  }

  if (effectiveMax <= 10) {
    return [0, 2, 4, 6, 8, 10]
  }

  // Para rangos más grandes, mantener 5 ticks "bonitos"
  const magnitude = Math.pow(10, Math.floor(Math.log10(effectiveMax)))
  const normalized = effectiveMax / magnitude

  let niceMax: number
  if (normalized <= 1) niceMax = magnitude
  else if (normalized <= 2) niceMax = 2 * magnitude
  else if (normalized <= 5) niceMax = 5 * magnitude
  else niceMax = 10 * magnitude

  const step = niceMax / 4
  return [0, step, step * 2, step * 3, niceMax]
}

/**
 * Gráfico de líneas mostrando progresión de porcentajes por partido
 * a medida que aumenta la cobertura de validación
 */
export function ProgresionChart({ data }: ProgresionChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No hay suficientes datos para mostrar la progresión</p>
      </div>
    )
  }

  // Transformar datos para Recharts
  const chartData = data.map((punto) => ({
    cobertura: punto.cobertura,
    actasAcumuladas: punto.actasAcumuladas,
    PN: punto.porcentajes.PN,
    PLH: punto.porcentajes.PLH,
    PL: punto.porcentajes.PL,
  }))

  // Calcular dominio dinámico del eje X basado en cobertura actual
  const maxCobertura = Math.max(...data.map((d) => d.cobertura))
  const xAxisTicks = generateXAxisTicks(maxCobertura)
  const xAxisMax = xAxisTicks[xAxisTicks.length - 1]

  // Configuración de series
  const series = PARTIDOS.map((partido) => ({
    dataKey: partido,
    label: partido,
    color: COLORES_PARTIDOS[partido],
  }))

  // Formatear eje X dependiendo de la escala
  const xAxisFormatter = (value: number) => {
    const asPercent = (decimals: number) => `${Number(value.toFixed(decimals))}%`

    if (xAxisMax <= 1) return asPercent(1)
    if (xAxisMax < 10) return asPercent(1)
    return asPercent(0)
  }

  return (
    <LineChart
      data={chartData}
      series={series}
      xAxisKey="cobertura"
      xAxisLabel="Cobertura de Validación (%)"
      yAxisLabel="Porcentaje (%)"
      xAxisDomain={[0, xAxisMax]}
      xAxisTicks={xAxisTicks}
      yAxisDomain={[0, 100]}
      xAxisFormatter={xAxisFormatter}
      yAxisFormatter={(value) => `${value.toFixed(0)}%`}
      tooltipFormatter={(value) => `${value.toFixed(2)}%`}
      height={350}
      legendPosition="top"
    />
  )
}
