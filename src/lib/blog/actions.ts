'use server'

import { db } from '@/db'
import { comentarioBlog } from '@/db/schema'
import { createClient } from '@/lib/supabase/server'
import { getPostBySlug } from '@/lib/blog'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function agregarComentarioBlog(
  slug: string,
  contenido: string,
  padreId?: number | null
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'No autenticado' }
  }

  // Validar que el post existe (evita comentarios huérfanos)
  const post = getPostBySlug(slug)
  if (!post) {
    return { success: false, error: 'Publicación no encontrada' }
  }

  const trimmed = (contenido || '').trim()
  if (trimmed.length === 0) {
    return { success: false, error: 'El comentario no puede estar vacío' }
  }
  if (trimmed.length > 2000) {
    return { success: false, error: 'El comentario es demasiado largo (máx 2000 caracteres)' }
  }

  try {
    // Enforce single-depth threading:
    // padreId puede apuntar solo a un comentario top-level (padre_id IS NULL)
    if (padreId) {
      const [parent] = await db
        .select({ id: comentarioBlog.id, padreId: comentarioBlog.padreId })
        .from(comentarioBlog)
        .where(and(eq(comentarioBlog.id, padreId), eq(comentarioBlog.slug, slug)))
        .limit(1)

      if (!parent) {
        return { success: false, error: 'Comentario padre no encontrado' }
      }
      if (parent.padreId !== null) {
        return { success: false, error: 'Solo se permite responder a comentarios principales' }
      }
    }

    await db.insert(comentarioBlog).values({
      slug,
      usuarioId: user.id,
      contenido: trimmed,
      padreId: padreId ?? null,
    })

    revalidatePath(`/dashboard/blog/${slug}`)
    return { success: true }
  } catch (error) {
    // Fail-open friendly: si la tabla aún no existe en prod (deploy antes que migración),
    // devolver un mensaje claro en vez de reventar.
    const maybeCode = (error as { code?: string; message?: string } | null)?.code
    const maybeMessage = (error as { message?: string } | null)?.message || ''

    if (maybeCode === '42P01' || maybeMessage.toLowerCase().includes('comentario_blog')) {
      return {
        success: false,
        error:
          'Comentarios aún no disponibles (migración pendiente). Intenta de nuevo en unos minutos.',
      }
    }

    console.error('Error al agregar comentario al blog:', error)
    return { success: false, error: 'Error interno al guardar el comentario' }
  }
}
