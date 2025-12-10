/**
 * Helpers de Supabase Admin para testing
 *
 * Usa la clave de servicio (service role) para crear/eliminar usuarios de prueba.
 * Cada ejecución de tests usa un ID único para evitar conflictos.
 */

import { createClient } from '@supabase/supabase-js'
import { TEST_RUN_ID, STALE_TEST_DATA_MAX_AGE_MS } from './test-run-id'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  console.warn(
    '⚠️  SUPABASE_SERVICE_ROLE_KEY no configurado - la creación de usuarios de prueba fallará\n' +
      '   Agrégalo a tu archivo .env para habilitar los tests de integración completos'
  )
}

/**
 * Cliente Supabase Admin con privilegios de service role
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || 'dummy', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

/**
 * Crear un usuario de prueba en Supabase Auth
 * Incluye el run ID en los metadatos para identificación
 * Retorna el ID del usuario
 */
export async function createTestUser(email: string): Promise<string> {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY requerido para crear usuarios de prueba')
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    password: 'test-password-123!',
    user_metadata: {
      full_name: `Usuario de Prueba ${email.split('@')[0]}`,
      is_test_user: true,
      test_run_id: TEST_RUN_ID,
      test_created_at: Date.now(),
    },
  })

  if (error) {
    throw new Error(`Error al crear usuario de prueba: ${error.message}`)
  }

  return data.user.id
}

/**
 * Eliminar un usuario de prueba de Supabase Auth
 */
export async function deleteTestUser(userId: string): Promise<void> {
  if (!supabaseServiceKey) return

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) {
    console.warn(`Error al eliminar usuario de prueba ${userId}: ${error.message}`)
  }
}

/**
 * Verificar si podemos ejecutar tests de admin
 */
export function canRunAdminTests(): boolean {
  return !!supabaseServiceKey
}

/**
 * Limpiar usuarios de prueba ANTIGUOS (huérfanos de ejecuciones anteriores)
 * Solo elimina usuarios con más de 1 hora de antigüedad
 * NO elimina usuarios de la ejecución actual
 */
export async function cleanupStaleTestUsers(): Promise<number> {
  if (!supabaseServiceKey) return 0

  try {
    // Listar todos los usuarios y filtrar los de prueba
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.warn('Error al listar usuarios para limpieza:', error.message)
      return 0
    }

    const now = Date.now()

    // Filtrar usuarios de prueba que son ANTIGUOS (no de esta ejecución)
    const staleTestUsers = data.users.filter((user) => {
      const meta = user.user_metadata
      if (!meta?.is_test_user) return false

      // Si tiene test_run_id y es de esta ejecución, NO eliminarlo
      if (meta.test_run_id === TEST_RUN_ID) return false

      // Si tiene timestamp de creación, verificar que sea antiguo
      if (meta.test_created_at) {
        const age = now - meta.test_created_at
        return age > STALE_TEST_DATA_MAX_AGE_MS
      }

      // Usuarios antiguos sin timestamp (legacy) - eliminar si tienen más de 1 hora
      // Basarse en created_at del usuario
      const userCreatedAt = new Date(user.created_at).getTime()
      const userAge = now - userCreatedAt
      return userAge > STALE_TEST_DATA_MAX_AGE_MS
    })

    let deleted = 0
    for (const user of staleTestUsers) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      if (!deleteError) {
        deleted++
      }
    }

    if (deleted > 0) {
      console.log(`Limpiados ${deleted} usuarios de prueba antiguos (>1 hora)`)
    }

    return deleted
  } catch (err) {
    console.warn('Error durante limpieza de usuarios antiguos:', err)
    return 0
  }
}
