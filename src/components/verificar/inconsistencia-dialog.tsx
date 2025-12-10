'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AlertTriangle } from 'lucide-react'

// Clave para guardar preferencia de mostrar diálogo de inconsistencia
const INCONSISTENCIA_DIALOG_KEY = 'hide-inconsistencia-dialog-verficar'

interface InconsistenciaDialogProps {
  /** Si el acta tiene la etiqueta de inconsistencia */
  hasInconsistencia: boolean
}

export function InconsistenciaDialog({ hasInconsistencia }: InconsistenciaDialogProps) {
  // Siempre empezar cerrado para evitar hydration mismatch
  const [open, setOpen] = useState(false)

  // Abrir después del mount si aplica (usando requestAnimationFrame para evitar linter error)
  useEffect(() => {
    if (hasInconsistencia) {
      const hideDialog = localStorage.getItem(INCONSISTENCIA_DIALOG_KEY)
      if (hideDialog !== 'true') {
        // Usar requestAnimationFrame para hacer el setState asíncrono
        requestAnimationFrame(() => {
          setOpen(true)
        })
      }
    }
  }, [hasInconsistencia])

  const handleDontShowAgain = () => {
    localStorage.setItem(INCONSISTENCIA_DIALOG_KEY, 'true')
    setOpen(false)
  }

  const handleClose = () => {
    setOpen(false)
  }

  if (!hasInconsistencia) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Badge
          variant="outline"
          className="border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1 cursor-pointer hover:bg-amber-500/20 transition-colors"
        >
          <AlertTriangle className="h-3 w-3" />
          Inconsistencia
        </Badge>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Acta con Inconsistencia
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-2">
              <p>
                Esta acta está marcada como{' '}
                <strong className="text-amber-600">Inconsistencia</strong> en el sistema del CNE.
                Esto significa que los datos oficiales pueden contener errores o no coincidir con el
                acta física.
              </p>
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <p className="font-medium text-foreground">¿Qué hacer?</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>
                    Revisa cuidadosamente la imagen del acta y compara con los valores mostrados
                  </li>
                  <li>
                    Si puedes leer los valores correctos, usa <strong>Corregir</strong> para
                    ingresarlos
                  </li>
                  <li>
                    Si la imagen es ilegible, está incompleta o tiene otro problema, usa{' '}
                    <strong>Reportar</strong>
                  </li>
                </ul>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDontShowAgain}
            className="text-muted-foreground"
          >
            No mostrar de nuevo
          </Button>
          <Button size="sm" onClick={handleClose}>
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
