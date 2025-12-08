'use client'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Check, X, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VoteInputProps {
  partido: string
  color: string
  valorActual: number | null
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  showComparison?: boolean
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

export function VoteInput({
  partido,
  color,
  valorActual,
  value,
  onChange,
  disabled = false,
  showComparison = false,
}: VoteInputProps) {
  const numericValue = value === '' ? null : parseInt(value, 10)
  const isMatch = valorActual !== null && numericValue === valorActual
  const isDifferent = valorActual !== null && numericValue !== null && numericValue !== valorActual

  const increment = () => {
    const current = parseInt(value, 10) || 0
    onChange(String(Math.min(current + 1, 999)))
  }

  const decrement = () => {
    const current = parseInt(value, 10) || 0
    onChange(String(Math.max(current - 1, 0)))
  }

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

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg transition-colors',
        isDifferent && 'bg-amber-50 dark:bg-amber-950/30',
        isMatch && showComparison && 'bg-green-50 dark:bg-green-950/30'
      )}
    >
      {/* Indicador de partido */}
      <div className="flex items-center gap-2 min-w-[70px]">
        <div
          className={cn('w-3 h-3 rounded-full flex-shrink-0', PARTIDO_COLORS[partido] || color)}
        />
        <Label className="text-sm font-medium">{partido}</Label>
      </div>

      {/* Valor actual (si hay) */}
      {showComparison && (
        <div className="w-12 text-center text-sm text-muted-foreground tabular-nums font-medium">
          {valorActual ?? '-'}
        </div>
      )}

      {/* Input con botones +/- */}
      <div className="flex items-center gap-1 flex-1 justify-end">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={decrement}
          disabled={disabled || parseInt(value, 10) <= 0}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          className={cn(
            'w-16 h-9 text-center text-lg font-bold tabular-nums rounded-md border bg-background',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            isDifferent && 'border-amber-500 ring-amber-500',
            isMatch && showComparison && 'border-green-500'
          )}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 flex-shrink-0"
          onClick={increment}
          disabled={disabled || parseInt(value, 10) >= 999}
        >
          <Plus className="h-4 w-4" />
        </Button>

        {/* Indicador de coincidencia */}
        {showComparison && numericValue !== null && (
          <div className="w-6 flex items-center justify-center">
            {isMatch ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <X className="h-5 w-5 text-amber-600" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

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
}

export function VoteInputGroup({
  valoresActuales,
  valores,
  onChange,
  disabled = false,
  showComparison = false,
}: VoteInputGroupProps) {
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 pb-2 border-b">
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
            partido={p.label}
            color={p.color}
            valorActual={valoresActuales[p.key as keyof typeof valoresActuales]}
            value={valores[p.key as keyof typeof valores]}
            onChange={(v) => onChange(p.key, v)}
            disabled={disabled}
            showComparison={showComparison}
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
            partido={p.label}
            color={p.color}
            valorActual={valoresActuales[p.key as keyof typeof valoresActuales]}
            value={valores[p.key as keyof typeof valores]}
            onChange={(v) => onChange(p.key, v)}
            disabled={disabled}
            showComparison={showComparison}
          />
        ))}
      </div>

      {/* Total general (igual que en el acta física) */}
      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg mt-3">
        <div className="min-w-[70px]">
          <Label className="text-sm font-semibold">Total</Label>
        </div>
        {showComparison && (
          <div className="w-12 text-center text-sm font-bold tabular-nums">
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
