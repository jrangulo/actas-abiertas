'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmationDialogProps {
  open: boolean
  onConfirm: () => void
  onEdit: () => void
  valores: {
    pn: string
    plh: string
    pl: string
    pinu: string
    dc: string
    nulos: string
    blancos: string
  }
  valoresActuales?: {
    pn: number | null
    plh: number | null
    pl: number | null
    pinu: number | null
    dc: number | null
    nulos: number | null
    blancos: number | null
  }
  showComparison?: boolean
}

export function ConfirmationDialog({
  open,
  onConfirm,
  onEdit,
  valores,
  valoresActuales,
  showComparison = false,
}: ConfirmationDialogProps) {
  const partidos = [
    { key: 'dc', label: 'DC', color: 'bg-[#16a34a]' },
    { key: 'pl', label: 'PL', color: 'bg-[#8b0000]' },
    { key: 'pinu', label: 'PINU', color: 'bg-[#f97316]' },
    { key: 'plh', label: 'PLH', color: 'bg-[#c1121f]' },
    { key: 'pn', label: 'PN', color: 'bg-[#0047ab]' },
  ]

  const otros = [
    { key: 'blancos', label: 'Blancos', color: 'bg-gray-400' },
    { key: 'nulos', label: 'Nulos', color: 'bg-gray-600' },
  ]

  const totalGeneral = ['dc', 'pl', 'pinu', 'plh', 'pn', 'blancos', 'nulos'].reduce(
    (sum, key) => sum + (parseInt(valores[key as keyof typeof valores], 10) || 0),
    0
  )

  const totalActualGeneral = valoresActuales
    ? (valoresActuales.dc ?? 0) +
      (valoresActuales.pl ?? 0) +
      (valoresActuales.pinu ?? 0) +
      (valoresActuales.plh ?? 0) +
      (valoresActuales.pn ?? 0) +
      (valoresActuales.blancos ?? 0) +
      (valoresActuales.nulos ?? 0)
    : 0

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          onEdit()
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Información</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Header con títulos de columnas */}
          {showComparison && (
            <div className="flex items-center justify-end px-2 text-xs text-muted-foreground font-medium border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="w-12 text-center">Previo</span>
                <span className="w-12 text-center">Nuevo</span>
              </div>
            </div>
          )}

          {/* Partidos */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Partidos Políticos</h3>
            <div className="space-y-1">
              {partidos.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', p.color)} />
                    <span>{p.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {showComparison && valoresActuales && (
                      <span className="w-12 text-center text-muted-foreground">
                        {valoresActuales[p.key as keyof typeof valoresActuales] ?? '-'}
                      </span>
                    )}
                    <span className="font-bold w-12 text-center">
                      {valores[p.key as keyof typeof valores] || '0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Separador */}
          <div className="border-t" />

          {/* Blancos y Nulos */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Otros</h3>
            <div className="space-y-1">
              {otros.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', p.color)} />
                    <span>{p.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {showComparison && valoresActuales && (
                      <span className="w-12 text-center text-muted-foreground">
                        {valoresActuales[p.key as keyof typeof valoresActuales] ?? '-'}
                      </span>
                    )}
                    <span className="font-bold w-12 text-center">
                      {valores[p.key as keyof typeof valores] || '0'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-3">
            <div className="flex items-center justify-between p-2 rounded bg-primary/10">
              <span className="font-semibold">Total</span>
              <div className="flex items-center gap-2">
                {showComparison && (
                  <span className="text-sm text-muted-foreground w-12 text-center">
                    {totalActualGeneral}
                  </span>
                )}
                <span className="font-bold text-lg w-12 text-center">{totalGeneral}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-4">
          <Button variant="outline" onClick={onEdit} className="flex-1">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-green-600 hover:bg-green-700">
            <Check className="h-4 w-4 mr-2" />
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
