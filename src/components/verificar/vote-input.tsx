'use client'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'
import React, { forwardRef } from 'react'

interface VoteInputProps {
  partido: string
  color: string
  valorActual: number | null
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  showComparison?: boolean
  onNavigate?: (direction: 'next' | 'prev') => void
}

// Colores oficiales de los partidos políticos de Honduras
const PARTIDO_COLORS: Record<string, string> = {
  PN: 'bg-[#0047ab]', // Partido Nacional - Azul
  PLH: 'bg-[#c1121f]', // Partido Liberal de Honduras - Rojo
  PL: 'bg-[#8b0000]', // Partido Libre - Rojo oscuro/Guinda
  PINU: 'bg-[#f97316]', // PINU - Naranja
  DC: 'bg-[#16a34a]', // Democracia Cristiana - Verde
  Nulos: 'bg-gray-600',
  Blancos: 'bg-gray-400',
}

export const VoteInput = forwardRef<HTMLInputElement, VoteInputProps>(
  (
    {
      partido,
      color,
      valorActual,
      value,
      onChange,
      disabled = false,
      showComparison = false,
      onNavigate,
    },
    ref
  ) => {
    const numericValue = value === '' ? null : parseInt(value, 10)
    const isMatch = valorActual !== null && numericValue === valorActual
    const isDifferent =
      valorActual !== null && numericValue !== null && numericValue !== valorActual

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      // Solo permitir números
      if (val === '' || /^\d+$/.test(val)) {
        const num = parseInt(val, 10)
        if (isNaN(num) || num <= 999) {
          onChange(val)
        }
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!onNavigate) return

      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault()
        onNavigate('next')
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        onNavigate('prev')
      }
    }

    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg transition-colors',
          isDifferent && 'bg-amber-100/50 dark:bg-amber-800/40',
          isMatch && showComparison && 'bg-green-100/40 dark:bg-green-800/20'
        )}
      >
        {/* Indicador de partido */}
        <div className="flex items-center gap-2 min-w-[70px]">
          <div className={cn('w-3 h-3 rounded-full shrink-0', PARTIDO_COLORS[partido] || color)} />
          <Label className="text-sm font-medium">{partido}</Label>
        </div>

        {/* Valor actual (si hay) */}
        {showComparison && (
          <div className="w-12 text-center text-sm dark:text-white tabular-nums font-medium">
            {valorActual ?? '-'}
          </div>
        )}

        {/* Input con botones +/- */}
        <div className="flex items-center gap-1 flex-1 justify-end">
          {/* Indicador de coincidencia */}
          {showComparison && numericValue !== null && (
            <div className="w-6 flex items-center justify-center">
              {isMatch ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <X className="h-5 w-5 text-amber-600" />
              )}
            </div>
          )}
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className={cn(
              'w-16 h-9 text-center text-lg font-bold tabular-nums rounded-md border bg-background',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isDifferent && 'border-amber-600 ring-amber-600',
              isMatch && showComparison && 'border-green-500'
            )}
          />
        </div>
      </div>
    )
  }
)

VoteInput.displayName = 'VoteInput'

interface VoteInputGroupProps {
  valoresActuales: {
    pn: number | null
    plh: number | null
    pl: number | null
    pinu: number | null
    dc: number | null
    nulos: number | null
    blancos: number | null
  }
  valores: {
    pn: string
    plh: string
    pl: string
    pinu: string
    dc: string
    nulos: string
    blancos: string
  }
  onChange: (partido: string, value: string) => void
  disabled?: boolean
  showComparison?: boolean
  onLastInputFilled?: () => void
}

export function VoteInputGroup({
  valoresActuales,
  valores,
  onChange,
  disabled = false,
  showComparison = false,
  onLastInputFilled,
}: VoteInputGroupProps) {
  const inputRefs = {
    dc: React.useRef<HTMLInputElement>(null),
    pl: React.useRef<HTMLInputElement>(null),
    pinu: React.useRef<HTMLInputElement>(null),
    plh: React.useRef<HTMLInputElement>(null),
    pn: React.useRef<HTMLInputElement>(null),
    blancos: React.useRef<HTMLInputElement>(null),
    nulos: React.useRef<HTMLInputElement>(null),
  }

  // Orden de navegación
  const navigationOrder: (keyof typeof inputRefs)[] = [
    'dc',
    'pl',
    'pinu',
    'plh',
    'pn',
    'blancos',
    'nulos',
  ]

  const handleNavigate = (currentKey: string, direction: 'next' | 'prev') => {
    const currentIndex = navigationOrder.indexOf(currentKey as keyof typeof inputRefs)
    let nextIndex = currentIndex

    if (direction === 'next') {
      // If at last input and going next, trigger confirmation dialog
      if (currentKey === 'nulos' && onLastInputFilled) {
        onLastInputFilled()
        return
      }
      nextIndex = (currentIndex + 1) % navigationOrder.length
    } else {
      nextIndex = (currentIndex - 1 + navigationOrder.length) % navigationOrder.length
    }

    const nextKey = navigationOrder[nextIndex]
    inputRefs[nextKey].current?.focus()
    inputRefs[nextKey].current?.select()
  }
  // Orden igual al que aparece en las actas presidenciales
  const partidos = [
    { key: 'dc', label: 'DC', color: 'bg-[#16a34a]' },
    { key: 'pl', label: 'PL', color: 'bg-[#8b0000]' },
    { key: 'pinu', label: 'PINU', color: 'bg-[#f97316]' },
    { key: 'plh', label: 'PLH', color: 'bg-[#c1121f]' },
    { key: 'pn', label: 'PN', color: 'bg-[#0047ab]' },
  ]

  // Orden igual al que aparece en las actas presidenciales
  const otros = [
    { key: 'blancos', label: 'Blancos', color: 'bg-gray-400' },
    { key: 'nulos', label: 'Nulos', color: 'bg-gray-600' },
  ]

  // Total de todos los votos (partidos + blancos + nulos) - igual que en el acta física
  const totalGeneral = ['dc', 'pl', 'pinu', 'plh', 'pn', 'blancos', 'nulos'].reduce(
    (sum, key) => sum + (parseInt(valores[key as keyof typeof valores], 10) || 0),
    0
  )

  const totalActualGeneral =
    (valoresActuales.dc ?? 0) +
    (valoresActuales.pl ?? 0) +
    (valoresActuales.pinu ?? 0) +
    (valoresActuales.plh ?? 0) +
    (valoresActuales.pn ?? 0) +
    (valoresActuales.blancos ?? 0) +
    (valoresActuales.nulos ?? 0)

  return (
    <div className="space-y-2">
      {/* Header para validación */}
      {showComparison && (
        <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 px-2 pb-2 border-b">
          <div className="min-w-[70px]">Partido</div>
          <div className="w-12 text-center">Actual</div>
          <div className="flex-1 text-right pr-8">Tu valor</div>
        </div>
      )}

      {/* Inputs por partido */}
      <div className="space-y-1">
        {partidos.map((p) => (
          <VoteInput
            key={p.key}
            ref={inputRefs[p.key as keyof typeof inputRefs]}
            partido={p.label}
            color={p.color}
            valorActual={valoresActuales[p.key as keyof typeof valoresActuales]}
            value={valores[p.key as keyof typeof valores]}
            onChange={(v) => onChange(p.key, v)}
            disabled={disabled}
            showComparison={showComparison}
            onNavigate={(direction) => handleNavigate(p.key, direction)}
          />
        ))}
      </div>

      {/* Separador */}
      <div className="border-t my-3" />

      {/* Blancos y nulos */}
      <div className="space-y-1">
        {otros.map((p) => (
          <VoteInput
            key={p.key}
            ref={inputRefs[p.key as keyof typeof inputRefs]}
            partido={p.label}
            color={p.color}
            valorActual={valoresActuales[p.key as keyof typeof valoresActuales]}
            value={valores[p.key as keyof typeof valores]}
            onChange={(v) => onChange(p.key, v)}
            disabled={disabled}
            showComparison={showComparison}
            onNavigate={(direction) => handleNavigate(p.key, direction)}
          />
        ))}
      </div>

      {/* Total general (igual que en el acta física) */}
      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg mt-3">
        <div className="min-w-[70px]">
          <Label className="text-sm font-semibold">Total</Label>
        </div>
        {showComparison && (
          <div className="w-12 text-center text-sm font-bold tabular-nums text-zinc-600 dark:text-zinc-300">
            {totalActualGeneral}
          </div>
        )}
        <div className="flex-1 text-right pr-2">
          <span
            className={cn(
              'text-xl font-bold tabular-nums',
              showComparison && totalGeneral !== totalActualGeneral && 'text-amber-600'
            )}
          >
            {totalGeneral}
          </span>
        </div>
      </div>
    </div>
  )
}
