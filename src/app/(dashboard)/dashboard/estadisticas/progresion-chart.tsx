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

  // Configuración de series
  const series = PARTIDOS.map((partido) => ({
    dataKey: partido,
    label: partido,
    color: COLORES_PARTIDOS[partido],
  }))

  return (
    <LineChart
      data={chartData}
      series={series}
      xAxisKey="cobertura"
      xAxisLabel="Cobertura de Validación (%)"
      yAxisLabel="Porcentaje (%)"
      yAxisDomain={[0, 100]}
      xAxisFormatter={(value) => `${value.toFixed(0)}%`}
      yAxisFormatter={(value) => `${value.toFixed(0)}%`}
      tooltipFormatter={(value) => `${value.toFixed(2)}%`}
      height={350}
    />
  )
}
