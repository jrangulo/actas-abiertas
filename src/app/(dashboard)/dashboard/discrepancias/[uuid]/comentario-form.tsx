'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { agregarComentario } from '@/lib/discrepancias/actions'

interface ComentarioFormProps {
  uuid: string
}

export function ComentarioForm({ uuid }: ComentarioFormProps) {
  const [contenido, setContenido] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!contenido.trim()) {
      setError('El comentario no puede estar vacío')
      return
    }

    startTransition(async () => {
      const result = await agregarComentario(uuid, contenido)
      if (result.success) {
        setContenido('')
      } else {
        setError(result.error || 'Error al guardar el comentario')
      }
    })
  }

  const caracteresRestantes = 2000 - contenido.length

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        placeholder="Escribe un comentario sobre esta acta..."
        value={contenido}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContenido(e.target.value)}
        rows={3}
        maxLength={2000}
        disabled={isPending}
        className="resize-none"
      />

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {caracteresRestantes < 100 && (
            <span className={caracteresRestantes < 20 ? 'text-red-500' : ''}>
              {caracteresRestantes} caracteres restantes
            </span>
          )}
          {error && <span className="text-red-500 ml-2">{error}</span>}
        </div>

        <Button type="submit" size="sm" disabled={isPending || !contenido.trim()}>
          <Send className="h-4 w-4 mr-2" />
          {isPending ? 'Enviando...' : 'Comentar'}
        </Button>
      </div>
    </form>
  )
}
