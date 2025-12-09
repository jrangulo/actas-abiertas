/**
 * Helpers de Supabase Admin para testing
 *
 * Usa la clave de servicio (service role) para crear/eliminar usuarios de prueba
 */

import { createClient } from '@supabase/supabase-js'

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
 * Limpiar usuarios de prueba antiguos (por si quedaron de ejecuciones anteriores)
 * Identifica usuarios de prueba por el metadata is_test_user: true
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

    const testUsers = data.users.filter((user) => user.user_metadata?.is_test_user === true)

    let deleted = 0
    for (const user of testUsers) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      if (!deleteError) {
        deleted++
      }
    }

    if (deleted > 0) {
      console.log(`Limpiados ${deleted} usuarios de prueba antiguos`)
    }

    return deleted
  } catch (err) {
    console.warn('Error durante limpieza de usuarios antiguos:', err)
    return 0
  }
}
