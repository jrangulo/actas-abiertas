'use client'

import {
  COLORES_PARTIDOS,
  PARTIDOS_PRINCIPALES,
  type PuntoProgresion,
  type PartidoPrincipal,
} from '@/lib/stats/types'
import { LineChart } from '@/components/ui/chart'

interface ProgresionPorcentajesChartProps {
  data: PuntoProgresion[]
}

const PARTIDOS: PartidoPrincipal[] = [...PARTIDOS_PRINCIPALES]

/**
 * Genera ticks apropiados para el eje X basados en el valor máximo
 * Crea 5 ticks espaciados uniformemente con valores "bonitos"
 */
function generateXAxisTicks(max: number): number[] {
  if (max <= 0) return [0]

  // Encontrar el orden de magnitud apropiado
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
  const normalized = max / magnitude

  // Redondear a un número "bonito"
  let niceMax: number
  if (normalized <= 1) niceMax = magnitude
  else if (normalized <= 2) niceMax = 2 * magnitude
  else if (normalized <= 5) niceMax = 5 * magnitude
  else niceMax = 10 * magnitude

  // Generar 5 ticks incluyendo 0 y niceMax
  const step = niceMax / 4
  return [0, step, step * 2, step * 3, niceMax]
}

/**
 * Gráfico de líneas mostrando progresión de porcentajes por partido
 * a medida que aumenta la cobertura de validación
 */
export function ProgresionPorcentajesChart({ data }: ProgresionPorcentajesChartProps) {
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
    if (xAxisMax < 1) {
      return `${value.toFixed(2)}%`
    } else if (xAxisMax < 10) {
      return `${value.toFixed(1)}%`
    }
    return `${value.toFixed(0)}%`
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
