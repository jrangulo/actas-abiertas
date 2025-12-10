'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User } from 'lucide-react'
import { generateAnonName } from '@/lib/users/anon-names'
import type { ComentarioDetalle } from '@/lib/discrepancias/queries'

interface ComentariosListProps {
  comentarios: ComentarioDetalle[]
  currentUserId?: string
}

export function ComentariosList({ comentarios, currentUserId }: ComentariosListProps) {
  if (comentarios.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          No hay comentarios aún. ¡Sé el primero en comentar!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comentarios.map((comentario) => {
        const isCurrentUser = comentario.usuarioId === currentUserId
        const displayName = comentario.perfilPrivado
          ? generateAnonName(comentario.usuarioId)
          : comentario.usuarioNombre || 'Usuario'
        const initials = displayName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)

        return (
          <div
            key={comentario.id}
            className={`flex gap-3 ${isCurrentUser ? 'bg-primary/5 -mx-2 px-2 py-2 rounded-lg' : ''}`}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              {comentario.usuarioAvatar && !comentario.perfilPrivado ? (
                <AvatarImage src={comentario.usuarioAvatar} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-xs bg-muted">
                {comentario.perfilPrivado ? <User className="h-4 w-4" /> : initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{displayName}</span>
                {isCurrentUser && <span className="text-xs text-primary">(tú)</span>}
                <span className="text-xs text-muted-foreground">
                  {new Date(comentario.creadoEn).toLocaleDateString('es-HN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {comentario.editadoEn && (
                  <span className="text-xs text-muted-foreground">(editado)</span>
                )}
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap break-words">{comentario.contenido}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
