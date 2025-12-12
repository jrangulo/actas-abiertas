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

// Hook para obtener colores CSS computados (necesario para SVG en Recharts)
function useChartColors() {
  const [colors, setColors] = React.useState({
    text: '#a1a1aa', // zinc-400 fallback
    border: '#3f3f46', // zinc-700 fallback
  })

  React.useEffect(() => {
    const root = document.documentElement

    const updateColors = () => {
      const isDark = root.classList.contains('dark')
      setColors({
        text: isDark ? '#a1a1aa' : '#71717a', // zinc-400 / zinc-500
        border: isDark ? '#3f3f46' : '#e4e4e7', // zinc-700 / zinc-200
      })
    }

    updateColors()

    // Observar cambios de tema
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateColors()
        }
      })
    })

    observer.observe(root, { attributes: true })

    return () => observer.disconnect()
  }, [])

  return colors
}

// Tipo para los datos del chart
export interface ChartDataPoint {
  [key: string]: string | number
}

// Config para cada serie
export interface ChartSeriesConfig {
  dataKey: string
  label: string
  color: string
  strokeDasharray?: string
}

// Props del LineChart
interface LineChartProps {
  data: ChartDataPoint[]
  series: ChartSeriesConfig[]
  xAxisKey: string
  xAxisLabel?: string
  yAxisLabel?: string
  xAxisDomain?: [number, number]
  yAxisDomain?: [number, number]
  xAxisTicks?: number[]
  xAxisFormatter?: (value: number) => string
  yAxisFormatter?: (value: number) => string
  tooltipFormatter?: (value: number, name: string) => string
  className?: string
  height?: number
  legendPosition?: 'top' | 'bottom'
  lineStrokeWidth?: number
  dotRadius?: number
  legendToggleable?: boolean
  initialHiddenSeries?: string[]
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
  // Algunos charts (como progresión) incluyen metadata útil en el payload (ej. actas acumuladas)
  const actasAcumuladasRaw = payload?.[0]?.payload?.actasAcumuladas as unknown
  const actasAcumuladas =
    typeof actasAcumuladasRaw === 'number' && Number.isFinite(actasAcumuladasRaw)
      ? actasAcumuladasRaw
      : null

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold mb-2 text-foreground">
        {formattedLabel}
        {actasAcumuladas !== null ? (
          <span className="font-normal text-muted-foreground">
            {' '}
            · {actasAcumuladas.toLocaleString()} actas
          </span>
        ) : null}
      </p>
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
  hiddenKeys?: Set<string>
  onToggle?: (dataKey: string) => void
}

function ChartLegend({ payload, hiddenKeys, onToggle }: CustomLegendProps) {
  if (!payload?.length) return null

  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
      {payload.map((entry, index) => {
        const key = (entry?.dataKey as string) ?? (entry?.value as string) ?? String(index)
        const isHidden = hiddenKeys?.has(key) ?? false

        const clickable = typeof onToggle === 'function'
        return (
          <button
            key={index}
            type="button"
            onClick={clickable ? () => onToggle(key) : undefined}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1',
              clickable ? 'cursor-pointer hover:bg-muted/50' : 'cursor-default',
              isHidden ? 'opacity-40' : 'opacity-100'
            )}
            aria-pressed={isHidden}
            title={clickable ? (isHidden ? 'Mostrar' : 'Ocultar') : undefined}
          >
            <div
              className={cn('w-4 h-1 rounded-full', isHidden && 'opacity-60')}
              style={{ backgroundColor: entry.color }}
            />
            <span
              className={cn(
                'text-xs sm:text-sm font-medium',
                isHidden ? 'text-muted-foreground line-through' : 'text-foreground'
              )}
            >
              {entry.value}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function LineChart({
  data,
  series,
  xAxisKey,
  xAxisLabel,
  yAxisLabel,
  xAxisDomain,
  yAxisDomain,
  xAxisTicks,
  xAxisFormatter,
  yAxisFormatter,
  tooltipFormatter,
  className,
  height = 300,
  legendPosition = 'top',
  lineStrokeWidth = 2.5,
  dotRadius = 3,
  legendToggleable = false,
  initialHiddenSeries = [],
}: LineChartProps) {
  const colors = useChartColors()
  const [isMobile, setIsMobile] = React.useState(false)
  const [hiddenSeries, setHiddenSeries] = React.useState<Set<string>>(
    () => new Set(initialHiddenSeries)
  )

  React.useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

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
    <div
      className={cn('w-full min-w-0', className)}
      // Recharts ResponsiveContainer needs a measurable parent. Enforce minHeight so it never
      // becomes 0/-1 inside flex/grid layouts during initial measurement.
      style={{ height, minHeight: height }}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={height}>
        <RechartsLineChart
          data={data}
          margin={{
            top: legendPosition === 'top' ? (isMobile ? 65 : 55) : 5,
            right: isMobile ? 12 : 20,
            left: isMobile ? 0 : 10,
            bottom: xAxisLabel ? (isMobile ? 42 : 30) : isMobile ? 12 : 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={colors.border} opacity={0.5} />
          <XAxis
            dataKey={xAxisKey}
            domain={xAxisDomain}
            ticks={xAxisTicks}
            tick={{ fontSize: isMobile ? 10 : 12, fill: colors.text }}
            tickFormatter={xAxisFormatter}
            axisLine={{ stroke: colors.border }}
            tickLine={{ stroke: colors.border }}
            type="number"
            allowDataOverflow={true}
            minTickGap={isMobile ? 16 : 8}
            label={
              xAxisLabel
                ? {
                    value: xAxisLabel,
                    position: 'bottom',
                    offset: 15,
                    style: { fontSize: isMobile ? 10 : 12, fill: colors.text },
                  }
                : undefined
            }
          />
          <YAxis
            domain={yAxisDomain}
            tick={{ fontSize: isMobile ? 10 : 12, fill: colors.text }}
            tickFormatter={yAxisFormatter}
            axisLine={{ stroke: colors.border }}
            tickLine={{ stroke: colors.border }}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: 'insideLeft',
                    style: {
                      fontSize: isMobile ? 10 : 12,
                      fill: colors.text,
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
          <Legend
            verticalAlign={legendPosition}
            content={
              <ChartLegend
                hiddenKeys={legendToggleable ? hiddenSeries : undefined}
                onToggle={
                  legendToggleable
                    ? (key) =>
                        setHiddenSeries((prev) => {
                          const next = new Set(prev)
                          if (next.has(key)) next.delete(key)
                          else next.add(key)
                          return next
                        })
                    : undefined
                }
              />
            }
          />
          {series.map((s) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.label}
              stroke={s.color}
              strokeDasharray={s.strokeDasharray}
              strokeWidth={lineStrokeWidth}
              dot={dotRadius <= 0 ? false : { fill: s.color, strokeWidth: 2, r: dotRadius }}
              activeDot={{ r: 6, strokeWidth: 2 }}
              hide={legendToggleable ? hiddenSeries.has(s.dataKey) : false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
