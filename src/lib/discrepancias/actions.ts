'use server'

/**
 * Server Actions para el sistema de discrepancias
 *
 * Maneja la creación de comentarios y otras acciones del foro
 */

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { acta, comentarioDiscrepancia } from '@/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Agregar un comentario a un acta con discrepancias
 */
export async function agregarComentario(
  uuid: string,
  contenido: string,
  padreId?: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'No autenticado' }
  }

  // Validar contenido
  const contenidoLimpio = contenido.trim()
  if (!contenidoLimpio) {
    return { success: false, error: 'El comentario no puede estar vacío' }
  }

  if (contenidoLimpio.length > 2000) {
    return { success: false, error: 'El comentario es demasiado largo (máximo 2000 caracteres)' }
  }

  // Obtener acta
  const [actaData] = await db
    .select({ id: acta.id, estado: acta.estado })
    .from(acta)
    .where(eq(acta.uuid, uuid))
    .limit(1)

  if (!actaData) {
    return { success: false, error: 'Acta no encontrada' }
  }

  // Verificar que el acta está en revisión o tiene discrepancias
  if (actaData.estado !== 'bajo_revision' && actaData.estado !== 'con_discrepancia') {
    return { success: false, error: 'Esta acta no está abierta para comentarios' }
  }

  try {
    await db.insert(comentarioDiscrepancia).values({
      actaId: actaData.id,
      usuarioId: user.id,
      contenido: contenidoLimpio,
      padreId: padreId ?? null,
    })

    revalidatePath(`/dashboard/discrepancias/${uuid}`)
    return { success: true }
  } catch (error) {
    console.error('Error al agregar comentario:', error)
    return { success: false, error: 'Error al guardar el comentario' }
  }
}

/**
 * Eliminar un comentario propio
 */
export async function eliminarComentario(
  comentarioId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'No autenticado' }
  }

  // Verificar que el comentario pertenece al usuario
  const [comentario] = await db
    .select({ usuarioId: comentarioDiscrepancia.usuarioId, actaId: comentarioDiscrepancia.actaId })
    .from(comentarioDiscrepancia)
    .where(eq(comentarioDiscrepancia.id, comentarioId))
    .limit(1)

  if (!comentario) {
    return { success: false, error: 'Comentario no encontrado' }
  }

  if (comentario.usuarioId !== user.id) {
    return { success: false, error: 'No puedes eliminar comentarios de otros usuarios' }
  }

  try {
    await db.delete(comentarioDiscrepancia).where(eq(comentarioDiscrepancia.id, comentarioId))

    // Get acta uuid for revalidation
    const [actaData] = await db
      .select({ uuid: acta.uuid })
      .from(acta)
      .where(eq(acta.id, comentario.actaId))
      .limit(1)

    if (actaData?.uuid) {
      revalidatePath(`/dashboard/discrepancias/${actaData.uuid}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error al eliminar comentario:', error)
    return { success: false, error: 'Error al eliminar el comentario' }
  }
}
