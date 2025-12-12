import { db } from '@/db'
import { authUsers, comentarioBlog, estadisticaUsuario } from '@/db/schema'
import { eq } from 'drizzle-orm'

export type ComentarioBlogDetalle = {
  id: number
  contenido: string
  creadoEn: Date
  editadoEn: Date | null
  padreId: number | null
  usuarioId: string
  usuarioNombre: string | null
  usuarioAvatar: string | null
  perfilPrivado: boolean
}

/**
 * Obtener comentarios de un post del blog (por slug).
 * Respeta anonimato usando estadistica_usuario.perfil_privado.
 */
export async function getComentariosDePost(slug: string): Promise<ComentarioBlogDetalle[]> {
  try {
    const comentarios = await db
      .select({
        id: comentarioBlog.id,
        contenido: comentarioBlog.contenido,
        creadoEn: comentarioBlog.creadoEn,
        editadoEn: comentarioBlog.editadoEn,
        padreId: comentarioBlog.padreId,
        usuarioId: comentarioBlog.usuarioId,
        rawUserMetaData: authUsers.rawUserMetaData,
        perfilPrivado: estadisticaUsuario.perfilPrivado,
      })
      .from(comentarioBlog)
      .leftJoin(authUsers, eq(comentarioBlog.usuarioId, authUsers.id))
      .leftJoin(estadisticaUsuario, eq(comentarioBlog.usuarioId, estadisticaUsuario.usuarioId))
      .where(eq(comentarioBlog.slug, slug))
      .orderBy(comentarioBlog.creadoEn)

    return comentarios.map((c) => {
      const meta = c.rawUserMetaData as Record<string, unknown> | null
      const isPrivate = c.perfilPrivado ?? false

      return {
        id: c.id,
        contenido: c.contenido,
        creadoEn: c.creadoEn,
        editadoEn: c.editadoEn,
        padreId: c.padreId ?? null,
        usuarioId: c.usuarioId,
        usuarioNombre: isPrivate
          ? null
          : ((meta?.full_name as string) ?? (meta?.name as string) ?? null),
        usuarioAvatar: isPrivate
          ? null
          : ((meta?.avatar_url as string) ?? (meta?.picture as string) ?? null),
        perfilPrivado: isPrivate,
      }
    })
  } catch (error) {
    // Fail-open: si la migración aún no se aplicó (o hay un error temporal),
    // no queremos tumbar la página del blog en producción.
    console.warn(
      '[blog] No se pudieron cargar comentarios (migración pendiente o error DB):',
      error
    )
    return []
  }
}
