'use server'

import { db } from '@/db'
import { estadisticaUsuario, validacion } from '@/db/schema'
import { eq, count } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Obtener la configuración de privacidad del usuario actual
 */
export async function getPrivacySettings(userId: string) {
  const [settings] = await db
    .select({
      perfilPrivado: estadisticaUsuario.perfilPrivado,
      onboardingCompletado: estadisticaUsuario.onboardingCompletado,
    })
    .from(estadisticaUsuario)
    .where(eq(estadisticaUsuario.usuarioId, userId))
    .limit(1)

  return settings || { perfilPrivado: false, onboardingCompletado: false }
}

/**
 * Actualizar la configuración de privacidad del perfil
 * @param perfilPrivado - Si true, oculta nombre y foto en leaderboards
 */
export async function togglePrivacidad(perfilPrivado: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  try {
    // Verificar si el usuario tiene registro de estadísticas
    const [existing] = await db
      .select({ usuarioId: estadisticaUsuario.usuarioId })
      .from(estadisticaUsuario)
      .where(eq(estadisticaUsuario.usuarioId, user.id))
      .limit(1)

    if (existing) {
      // Actualizar configuración existente
      await db
        .update(estadisticaUsuario)
        .set({ perfilPrivado })
        .where(eq(estadisticaUsuario.usuarioId, user.id))
    } else {
      // Crear registro con la configuración
      await db.insert(estadisticaUsuario).values({
        usuarioId: user.id,
        perfilPrivado,
        onboardingCompletado: true,
        primeraActividad: new Date(),
      })
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/leaderboard')
    revalidatePath('/dashboard/perfil')

    return { success: true }
  } catch (error) {
    console.error('Error actualizando privacidad:', error)
    return { error: 'Error al guardar configuración' }
  }
}

/**
 * Marcar el onboarding como completado
 */
export async function completarOnboarding() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  try {
    // Verificar si el usuario tiene registro de estadísticas
    const [existing] = await db
      .select({ usuarioId: estadisticaUsuario.usuarioId })
      .from(estadisticaUsuario)
      .where(eq(estadisticaUsuario.usuarioId, user.id))
      .limit(1)

    if (existing) {
      await db
        .update(estadisticaUsuario)
        .set({ onboardingCompletado: true })
        .where(eq(estadisticaUsuario.usuarioId, user.id))
    } else {
      // Crear registro con onboarding completado
      await db.insert(estadisticaUsuario).values({
        usuarioId: user.id,
        onboardingCompletado: true,
        primeraActividad: new Date(),
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error completando onboarding:', error)
    return { error: 'Error al guardar' }
  }
}

/**
 * Marcar el onboarding como completado Y actualizar privacidad
 * Usado cuando el usuario completa el onboarding con una elección de privacidad
 */
export async function completarOnboardingConPrivacidad(perfilPrivado: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  try {
    const [existing] = await db
      .select({ usuarioId: estadisticaUsuario.usuarioId })
      .from(estadisticaUsuario)
      .where(eq(estadisticaUsuario.usuarioId, user.id))
      .limit(1)

    if (existing) {
      await db
        .update(estadisticaUsuario)
        .set({
          onboardingCompletado: true,
          perfilPrivado,
        })
        .where(eq(estadisticaUsuario.usuarioId, user.id))
    } else {
      await db.insert(estadisticaUsuario).values({
        usuarioId: user.id,
        onboardingCompletado: true,
        perfilPrivado,
        primeraActividad: new Date(),
      })
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/leaderboard')
    revalidatePath('/dashboard/perfil')

    return { success: true }
  } catch (error) {
    console.error('Error completando onboarding:', error)
    return { error: 'Error al guardar' }
  }
}

/**
 * Obtener el total de actas validadas por un usuario
 */
export async function getUserTotalValidaciones(userId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(validacion)
    .where(eq(validacion.usuarioId, userId))

  return result[0]?.count || 0
}
