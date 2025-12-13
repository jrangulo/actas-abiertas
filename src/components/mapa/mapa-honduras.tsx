'use client'

import { useState, useRef, useEffect, forwardRef } from 'react'
import hondurasMap from '@svg-maps/honduras'
import { SVG_ID_TO_CODIGO } from '@/lib/data/departamentos'
import { COLORES_TODOS_PARTIDOS } from '@/lib/stats/types'
import type { EstadisticasDepartamento } from '@/lib/stats/types'
import { DepartamentoModal } from './departamento-modal'

// Tipos para el mapa SVG
interface MapLocation {
  name: string
  id: string
  path: string
}

interface SvgMap {
  label: string
  viewBox: string
  locations: MapLocation[]
}

// Cast del mapa importado
const hondurasMapTyped = hondurasMap as SvgMap

// Colores para el mapa (usando los colores centralizados)
const COLORES_MAPA = {
  PN: COLORES_TODOS_PARTIDOS.PN,
  PLH: COLORES_TODOS_PARTIDOS.PLH,
  PL: COLORES_TODOS_PARTIDOS.PL,
  PINU: COLORES_TODOS_PARTIDOS.PINU,
  DC: COLORES_TODOS_PARTIDOS.DC,
} as const

type PartidoGanador = 'PN' | 'PLH' | 'PL' | 'PINU' | 'DC' | null

interface DepartamentoConGanador extends EstadisticasDepartamento {
  partidoGanador: PartidoGanador
  porcentajeGanador: number
  totalVotos: number
}

interface MapaHondurasProps {
  data: EstadisticasDepartamento[]
  loading?: boolean
  onDepartamentoClick?: (departamento: DepartamentoConGanador) => void
}

const SvgHonduras = forwardRef<SVGSVGElement, { className?: string; style?: React.CSSProperties }>(
  ({ className, style }, ref) => {
    return (
      <svg
        ref={ref}
        className={className}
        style={style}
        viewBox={hondurasMapTyped.viewBox}
        xmlns="http://www.w3.org/2000/svg"
      >
        <g id="features">
          {hondurasMapTyped.locations.map((location) => (
            <path
              key={location.id}
              d={location.path}
              id={location.id}
              name={location.name}
              style={{
                fill: '#e5e7eb',
                stroke: '#9ca3af',
                strokeWidth: 1,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </g>
      </svg>
    )
  }
)

SvgHonduras.displayName = 'SvgHonduras'

// Función para calcular partido ganador
function calcularPartidoGanador(dept: EstadisticasDepartamento): DepartamentoConGanador {
  const totalVotos = dept.votosPn + dept.votosPlh + dept.votosPl + dept.votosOtros

  if (totalVotos === 0) {
    return { ...dept, partidoGanador: null, porcentajeGanador: 0, totalVotos: 0 }
  }

  const votosPartidos = {
    PN: dept.votosPn,
    PLH: dept.votosPlh,
    PL: dept.votosPl,
  }

  let partidoGanador: PartidoGanador = null
  let maxVotos = 0

  for (const [partido, votos] of Object.entries(votosPartidos)) {
    if (votos > maxVotos) {
      maxVotos = votos
      partidoGanador = partido as PartidoGanador
    }
  }

  const porcentajeGanador = totalVotos > 0 ? (maxVotos / totalVotos) * 100 : 0

  return { ...dept, partidoGanador, porcentajeGanador, totalVotos }
}

export function MapaHonduras({ data, loading = false, onDepartamentoClick }: MapaHondurasProps) {
  const [selectedDepartamento, setSelectedDepartamento] = useState<DepartamentoConGanador | null>(null)
  const [tooltip, setTooltip] = useState<{
    show: boolean
    x: number
    y: number
    content: string
  }>({ show: false, x: 0, y: 0, content: '' })

  const svgRef = useRef<SVGSVGElement>(null)

  // Convertir datos a formato con ganador
  const dataConGanador = data.map(calcularPartidoGanador)

  // Función para obtener el color de un departamento (basado en partido ganador)
  const getDepartamentoColor = (departamento: DepartamentoConGanador): string => {
    if (!departamento.partidoGanador) {
      return '#e5e7eb' // Gris claro si no hay ganador
    }
    return COLORES_MAPA[departamento.partidoGanador]
  }

  // Función para obtener la opacidad basada en el porcentaje de victoria
  const getDepartamentoOpacity = (departamento: DepartamentoConGanador): number => {
    if (departamento.totalVotos === 0) return 1

    // Opacidad entre 0.4 y 1.0 basada en el porcentaje
    const minOpacity = 0.4
    const maxOpacity = 1.0
    const opacity = minOpacity + (departamento.porcentajeGanador / 100) * (maxOpacity - minOpacity)

    return Math.max(minOpacity, Math.min(maxOpacity, opacity))
  }

  // Manejar click en departamento
  const handleDepartamentoClick = (departamento: DepartamentoConGanador) => {
    setSelectedDepartamento(departamento)
    onDepartamentoClick?.(departamento)
  }

  // Manejar hover del mouse
  const handleMouseEnter = (event: React.MouseEvent, departamento: DepartamentoConGanador) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const tooltipContent = `
      ${departamento.nombre}
      ${departamento.partidoGanador ? `Ganando: ${departamento.partidoGanador}` : 'Sin resultados'}
      ${departamento.porcentajeGanador > 0 ? `${departamento.porcentajeGanador.toFixed(1)}%` : ''}
      Actas: ${departamento.actasValidadas}/${departamento.actasTotales}
    `.trim()

    setTooltip({
      show: true,
      x: event.clientX - rect.left + 10,
      y: event.clientY - rect.top - 10,
      content: tooltipContent
    })
  }

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, content: '' })
  }

  // Función para encontrar departamento por ID del SVG
  const findDepartamentoByElementId = (elementId: string): DepartamentoConGanador | null => {
    const departmentCode = SVG_ID_TO_CODIGO[elementId]
    if (!departmentCode) return null

    return dataConGanador.find(d => d.codigo === departmentCode) || null
  }

  // Aplicar estilos a los departamentos del SVG
  useEffect(() => {
    if (!svgRef.current || dataConGanador.length === 0) return

    const svg = svgRef.current

    const applyStyles = () => {
      hondurasMapTyped.locations.forEach(location => {
        const element = svg.getElementById(location.id) as SVGPathElement | null
        if (!element) return

        const departamento = findDepartamentoByElementId(location.id)
        if (!departamento) return

        const color = getDepartamentoColor(departamento)
        const opacity = getDepartamentoOpacity(departamento)

        element.style.fill = color
        element.style.opacity = opacity.toString()
        element.style.cursor = 'pointer'
        element.style.transition = 'all 0.2s ease'
        element.style.strokeWidth = '1'
        element.style.stroke = '#9ca3af'

        // Limpiar eventos previos
        element.onmouseenter = null
        element.onmouseleave = null
        element.onclick = null
        element.onmouseover = null
        element.onmouseout = null

        // Eventos del mouse
        element.addEventListener('mouseenter', (e) => handleMouseEnter(e as unknown as React.MouseEvent, departamento))
        element.addEventListener('mouseleave', handleMouseLeave)
        element.addEventListener('click', () => handleDepartamentoClick(departamento))

        // Hover effect
        element.addEventListener('mouseover', () => {
          element.style.strokeWidth = '2'
          element.style.stroke = '#374151'
        })
        element.addEventListener('mouseout', () => {
          element.style.strokeWidth = '1'
          element.style.stroke = '#9ca3af'
        })
      })
    }

    // Si el SVG ya está cargado, aplicar estilos inmediatamente
    if (svg.querySelector('path')) {
      applyStyles()
    } else {
      // Si no, esperar a que se cargue
      const handleLoad = () => applyStyles()
      svg.addEventListener('load', handleLoad)
      return () => svg.removeEventListener('load', handleLoad)
    }
  }, [dataConGanador])

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-muted rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* SVG del mapa */}
      <div className="relative bg-white rounded-lg overflow-hidden">
        <div className="w-full h-[500px] md:h-[600px] flex items-center justify-center p-4">
          <SvgHonduras
            ref={svgRef}
            className="w-full h-full max-w-5xl"
            style={{
              maxHeight: '100%',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
          />
        </div>

        {/* Tooltip */}
        {tooltip.show && (
          <div
            className="absolute z-10 bg-popover border border-border rounded-md shadow-lg px-3 py-2 text-xs whitespace-pre-line pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {tooltip.content}
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        <div className="text-xs text-muted-foreground mb-2 w-full text-center">
          Click en un departamento para ver detalles
        </div>
        <div className="flex flex-wrap gap-4">
          {Object.entries(COLORES_MAPA).map(([partido, color]) => (
            <div key={partido} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs font-medium">{partido}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de detalles */}
      {selectedDepartamento && (
        <DepartamentoModal
          departamento={selectedDepartamento}
          isOpen={!!selectedDepartamento}
          onClose={() => setSelectedDepartamento(null)}
        />
      )}
    </div>
  )
}
