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
