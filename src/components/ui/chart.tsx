'use client'

/**
 * Chart components basados en Recharts
 * Adaptados del estilo ShadCN para consistencia visual
 */

import * as React from 'react'
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

// Tipo para los datos del chart
export interface ChartDataPoint {
  [key: string]: string | number
}

// Config para cada serie
export interface ChartSeriesConfig {
  dataKey: string
  label: string
  color: string
}

// Props del LineChart
interface LineChartProps {
  data: ChartDataPoint[]
  series: ChartSeriesConfig[]
  xAxisKey: string
  xAxisLabel?: string
  yAxisLabel?: string
  yAxisDomain?: [number, number]
  xAxisFormatter?: (value: number) => string
  yAxisFormatter?: (value: number) => string
  tooltipFormatter?: (value: number, name: string) => string
  className?: string
  height?: number
}

// Custom tooltip con tipos explícitos
interface CustomTooltipProps {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
  label?: string | number
  xAxisFormatter?: (value: number) => string
  tooltipFormatter?: (value: number, name: string) => string
}

function ChartTooltip({
  active,
  payload,
  label,
  xAxisFormatter,
  tooltipFormatter,
}: CustomTooltipProps) {
  if (!active || !payload?.length) return null

  const formattedLabel = xAxisFormatter ? xAxisFormatter(Number(label)) : String(label)

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold mb-2 text-foreground">{formattedLabel}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const value = entry.value as number
          const formattedValue = tooltipFormatter
            ? tooltipFormatter(value, entry.name || '')
            : `${value.toFixed(2)}%`

          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <span className="font-mono font-medium text-foreground">{formattedValue}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Custom legend con tipos explícitos
interface CustomLegendProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
}

function ChartLegend({ payload }: CustomLegendProps) {
  if (!payload?.length) return null

  return (
    <div className="flex justify-center gap-6 mt-4">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-4 h-1 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-sm font-medium text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function LineChart({
  data,
  series,
  xAxisKey,
  xAxisLabel,
  yAxisLabel,
  yAxisDomain,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  className,
  height = 300,
}: LineChartProps) {
  if (!data?.length) {
    return (
      <div
        className={cn('flex items-center justify-center text-muted-foreground', className)}
        style={{ height }}
      >
        No hay datos disponibles
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: xAxisLabel ? 30 : 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={xAxisFormatter}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: 'bottom',
                    offset: 15,
                    style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' },
                  }
                : undefined
            }
          />
          <YAxis
            domain={yAxisDomain}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={yAxisFormatter}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: 'insideLeft',
                    style: {
                      fontSize: 12,
                      fill: 'hsl(var(--muted-foreground))',
                      textAnchor: 'middle',
                    },
                  }
                : undefined
            }
          />
          <Tooltip
            content={
              <ChartTooltip xAxisFormatter={xAxisFormatter} tooltipFormatter={tooltipFormatter} />
            }
          />
          <Legend content={<ChartLegend />} />
          {series.map((s) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.label}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ fill: s.color, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
