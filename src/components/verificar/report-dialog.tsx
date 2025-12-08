'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const TIPOS_PROBLEMA = [
  {
    value: 'ilegible' as const,
    label: 'Ilegible',
    description: 'No se puede leer el acta claramente',
  },
  {
    value: 'adulterada' as const,
    label: 'Adulterada',
    description: 'El acta muestra señales de alteración',
  },
  {
    value: 'datos_inconsistentes' as const,
    label: 'Datos inconsistentes',
    description: 'Los números no cuadran o hay errores evidentes',
  },
  {
    value: 'imagen_incompleta' as const,
    label: 'Imagen incompleta',
    description: 'Falta parte del acta en la imagen',
  },
  {
    value: 'otro' as const,
    label: 'Otro problema',
    description: 'Otro tipo de problema no listado',
  },
]

type TipoProblema = (typeof TIPOS_PROBLEMA)[number]['value']

interface ReportDialogProps {
  onReport: (tipo: TipoProblema, descripcion?: string) => Promise<void>
  disabled?: boolean
  /** Modo compacto: solo muestra un icono pequeño */
  compact?: boolean
}

export function ReportDialog({ onReport, disabled, compact = false }: ReportDialogProps) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoProblema | null>(null)
  const [descripcion, setDescripcion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!tipo) return

    setIsSubmitting(true)
    try {
      await onReport(tipo, descripcion || undefined)
      setOpen(false)
      setTipo(null)
      setDescripcion('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {compact ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            disabled={disabled}
            title="Reportar problema"
          >
            <AlertTriangle className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            className="w-full text-amber-600 border-amber-300"
            disabled={disabled}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Reportar problema
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reportar problema</DialogTitle>
          <DialogDescription>
            Selecciona el tipo de problema que encontraste con esta acta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {TIPOS_PROBLEMA.map((problema) => (
            <button
              key={problema.value}
              type="button"
              onClick={() => setTipo(problema.value)}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-colors',
                tipo === problema.value
                  ? 'border-[#0069b4] bg-[#0069b4]/5'
                  : 'border-border hover:border-muted-foreground/50'
              )}
            >
              <p className="font-medium text-sm">{problema.label}</p>
              <p className="text-xs text-muted-foreground">{problema.description}</p>
            </button>
          ))}

          {tipo === 'otro' && (
            <div className="space-y-2">
              <Label htmlFor="descripcion">Describe el problema</Label>
              <textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe brevemente el problema..."
                className="w-full min-h-[80px] p-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0069b4]"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!tipo || isSubmitting}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar reporte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
