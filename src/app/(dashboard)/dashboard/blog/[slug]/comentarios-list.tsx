'use client'

import { useMemo, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CornerDownRight, User } from 'lucide-react'
import { generateAnonName } from '@/lib/users/anon-names'
import type { ComentarioBlogDetalle } from '@/lib/blog/comments'
import { ComentarioForm } from './comentario-form'

interface ComentariosListProps {
  slug: string
  comentarios: ComentarioBlogDetalle[]
  currentUserId?: string
}

export function ComentariosList({ slug, comentarios, currentUserId }: ComentariosListProps) {
  const [replyToId, setReplyToId] = useState<number | null>(null)

  const { topLevel, repliesByParent } = useMemo(() => {
    const topLevel = comentarios.filter((c) => c.padreId === null)
    const repliesByParent = new Map<number, ComentarioBlogDetalle[]>()

    for (const c of comentarios) {
      if (c.padreId === null) continue
      const list = repliesByParent.get(c.padreId) ?? []
      list.push(c)
      repliesByParent.set(c.padreId, list)
    }

    return { topLevel, repliesByParent }
  }, [comentarios])

  if (topLevel.length === 0) {
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
      {topLevel.map((comentario) => (
        <Thread
          key={comentario.id}
          slug={slug}
          comentario={comentario}
          replies={repliesByParent.get(comentario.id) ?? []}
          currentUserId={currentUserId}
          replyToId={replyToId}
          setReplyToId={setReplyToId}
        />
      ))}
    </div>
  )
}

function Thread({
  slug,
  comentario,
  replies,
  currentUserId,
  replyToId,
  setReplyToId,
}: {
  slug: string
  comentario: ComentarioBlogDetalle
  replies: ComentarioBlogDetalle[]
  currentUserId?: string
  replyToId: number | null
  setReplyToId: (id: number | null) => void
}) {
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
    <div className="space-y-3">
      <div
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
          <div className="flex items-center gap-2 flex-wrap">
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

          <div className="mt-2">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              onClick={() => setReplyToId(replyToId === comentario.id ? null : comentario.id)}
            >
              {replyToId === comentario.id ? 'Cancelar' : 'Responder'}
            </button>
          </div>
        </div>
      </div>

      {replyToId === comentario.id && (
        <div className="pl-11">
          <ComentarioForm
            slug={slug}
            padreId={comentario.id}
            placeholder={`Responder a ${displayName}…`}
            onSubmitted={() => setReplyToId(null)}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="pl-11 space-y-3">
          {replies.map((r) => (
            <Reply key={r.id} reply={r} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  )
}

function Reply({ reply, currentUserId }: { reply: ComentarioBlogDetalle; currentUserId?: string }) {
  const isCurrentUser = reply.usuarioId === currentUserId
  const displayName = reply.perfilPrivado
    ? generateAnonName(reply.usuarioId)
    : reply.usuarioNombre || 'Usuario'

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={`flex gap-3 ${isCurrentUser ? 'bg-primary/5 -mx-2 px-2 py-2 rounded-lg' : ''}`}>
      <div className="pt-1 text-muted-foreground">
        <CornerDownRight className="h-4 w-4" />
      </div>
      <Avatar className="h-7 w-7 flex-shrink-0">
        {reply.usuarioAvatar && !reply.perfilPrivado ? (
          <AvatarImage src={reply.usuarioAvatar} alt={displayName} />
        ) : null}
        <AvatarFallback className="text-[10px] bg-muted">
          {reply.perfilPrivado ? <User className="h-3.5 w-3.5" /> : initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{displayName}</span>
          {isCurrentUser && <span className="text-xs text-primary">(tú)</span>}
          <span className="text-xs text-muted-foreground">
            {new Date(reply.creadoEn).toLocaleDateString('es-HN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {reply.editadoEn && <span className="text-xs text-muted-foreground">(editado)</span>}
        </div>
        <p className="text-sm mt-1 whitespace-pre-wrap break-words">{reply.contenido}</p>
      </div>
    </div>
  )
}
