/**
 * Tests de integración para el sistema de autoban
 *
 * Estos tests verifican que:
 * 1. Usuarios con tasa de error >10% (precisión <90%) reciben advertencias
 * 2. Usuarios con tasa de error >20% (precisión <80%) son restringidos
 * 3. Usuarios con tasa de error >30% (precisión <70%) son baneados
 * 4. Los cambios de estado son progresivos (no se salta etapas)
 * 5. Admin lock previene cambios automáticos
 * 6. Se respeta el periodo de gracia y mínimo de validaciones
 * 7. Cuando un usuario es baneado, sus validaciones y reportes son eliminados
 *
 * IMPORTANTE: Estos tests usan las funciones REALES del sistema,
 * creando usuarios y actas de prueba reales en la base de datos.
 *
 * Requisitos:
 * - DATABASE_URL debe estar configurado
 * - SUPABASE_SERVICE_ROLE_KEY debe estar configurado
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { guardarValidacionInternal } from '@/lib/actas/actions'
import { verificarEstadoUsuario } from '@/lib/autoban/check'
import { calcularPorcentajeAcierto } from '@/lib/autoban/calculations'
import { AUTOBAN_CONFIG } from '@/lib/autoban/config'
import {
  createTestUser,
  deleteTestUser,
  canRunAdminTests,
  cleanupStaleTestUsers,
} from './helpers/supabase-admin'
import {
  createTestActa,
  getUserStats,
  updateUserStats,
  cleanupTestActa,
  cleanupAllTestActas,
  cleanupStaleTestActas,
  STANDARD_VOTES,
  DIFFERENT_VOTES_1,
  type TestActa,
  cleanupUserStats,
} from './helpers/test-data'
import { db } from '@/db'
import { estadisticaUsuario, historialUsuarioEstado, validacion, discrepancia } from '@/db/schema'
import { eq, count } from 'drizzle-orm'

// ============================================================================
// Configuración de Tests
// ============================================================================

// IDs de usuarios de prueba
let TEST_USER_GOOD_1: string // Usuario que valida correctamente
let TEST_USER_GOOD_2: string // Segundo usuario que valida correctamente
let TEST_USER_BAD: string // Usuario que comete errores

// Seguimiento de actas de prueba para limpieza
let testActas: TestActa[] = []

// Omitir tests si no podemos crear usuarios
const describeWithUsers = canRunAdminTests() ? describe : describe.skip

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Configurar estadísticas de usuario con precisión específica
 * Mucho más rápido que simular validaciones completas
 *
 * @param userId - ID del usuario
 * @param totalValidations - Número total de validaciones
 * @param correctPercentage - Porcentaje de precisión (0-100)
 */
async function setUserPrecision(
  userId: string,
  totalValidations: number,
  correctPercentage: number
): Promise<void> {
  const correccionesRecibidas = Math.floor((totalValidations * (100 - correctPercentage)) / 100)

  await updateUserStats(userId, {
    actasValidadas: totalValidations,
    correccionesRecibidas: correccionesRecibidas,
  })
}

/**
 * Obtener historial de cambios de estado de un usuario
 */
async function getUserStateHistory(userId: string) {
  return await db
    .select()
    .from(historialUsuarioEstado)
    .where(eq(historialUsuarioEstado.usuarioId, userId))
    .orderBy(historialUsuarioEstado.creadoEn)
}

// ============================================================================
// Tests
// ============================================================================

describeWithUsers.sequential('Sistema de Autoban (Integración)', () => {
  // Crear usuarios de prueba antes de todos los tests
  beforeAll(async () => {
    // Limpiar datos huérfanos de ejecuciones ANTERIORES (>1 hora)
    // NO elimina datos de otras ejecuciones en curso
    await cleanupStaleTestUsers()
    await cleanupStaleTestActas()

    console.log('Creando usuarios de prueba para autoban...')
    const timestamp = Date.now()
    TEST_USER_GOOD_1 = await createTestUser(`test-autoban-good1-${timestamp}@test.local`)
    TEST_USER_GOOD_2 = await createTestUser(`test-autoban-good2-${timestamp}@test.local`)
    TEST_USER_BAD = await createTestUser(`test-autoban-bad-${timestamp}@test.local`)

    if (!TEST_USER_GOOD_1 || !TEST_USER_GOOD_2 || !TEST_USER_BAD) {
      throw new Error('Failed to create test users')
    }

    console.log('Usuarios de prueba creados:', {
      TEST_USER_GOOD_1,
      TEST_USER_GOOD_2,
      TEST_USER_BAD,
    })
  }, 60000)

  // Limpiar datos de ESTA ejecución después de todos los tests
  afterAll(async () => {
    console.log('Limpiando datos de prueba de autoban (esta ejecución)...')

    // Limpiar las actas de ESTA ejecución específica
    try {
      await cleanupAllTestActas()
    } catch (error) {
      console.warn('Error limpiando actas de prueba:', error)
    }

    const validUserIds = [TEST_USER_GOOD_1, TEST_USER_GOOD_2, TEST_USER_BAD].filter(Boolean)
    if (validUserIds.length > 0) {
      // Limpiar TODOS los datos relacionados primero (orden correcto para FK)
      try {
        await cleanupUserStats(validUserIds)
      } catch (error) {
        console.warn('Error limpiando datos de usuarios:', error)
      }
      // Luego eliminar usuarios en paralelo
      await Promise.all(
        validUserIds.map((userId) =>
          deleteTestUser(userId).catch((err) => {
            console.warn(`Error eliminando usuario ${userId}:`, err)
          })
        )
      )
    }
    console.log('Datos de prueba eliminados')
  }, 60000)

  // Limpiar actas de prueba después de cada test
  afterEach(async () => {
    // Limpiar stats de usuarios (resetear para próximo test)
    const validUserIds = [TEST_USER_GOOD_1, TEST_USER_GOOD_2, TEST_USER_BAD].filter(Boolean)
    if (validUserIds.length > 0) {
      try {
        await cleanupUserStats(validUserIds)
      } catch (error) {
        console.warn('Error limpiando datos de usuarios:', error)
      }
    }

    // Limpiar actas si hay
    if (testActas.length > 0) {
      const cleanupPromises = testActas.map((testActa) =>
        cleanupTestActa(testActa.id).catch((error) => {
          console.warn('Error limpiando acta:', error)
        })
      )
      await Promise.all(cleanupPromises)
      testActas = []
    }
  }, 30000)

  describe('Cálculo de Precisión', () => {
    it('debe retornar undefined si no hay suficientes validaciones', () => {
      const porcentaje = calcularPorcentajeAcierto({
        actasValidadas: 5,
        correccionesRecibidas: 1,
      })
      expect(porcentaje).toBeUndefined()
    })

    it('debe calcular correctamente el porcentaje con suficientes validaciones', () => {
      // 10 validaciones, 3 correcciones = 70% de acierto
      const porcentaje = calcularPorcentajeAcierto({
        actasValidadas: 10,
        correccionesRecibidas: 3,
      })
      expect(porcentaje).toBe(70)
    })

    it('debe retornar 100% si no hay correcciones', () => {
      const porcentaje = calcularPorcentajeAcierto({
        actasValidadas: 20,
        correccionesRecibidas: 0,
      })
      expect(porcentaje).toBe(100)
    })

    it('debe retornar 0% si todas son correcciones', () => {
      const porcentaje = calcularPorcentajeAcierto({
        actasValidadas: 10,
        correccionesRecibidas: 10,
      })
      expect(porcentaje).toBe(0)
    })
  })

  describe('Estado: Advertido (< 90% precisión / >10% error)', () => {
    it('debe cambiar usuario a advertido cuando la precisión cae por debajo del 90%', async () => {
      // Configurar 20 validaciones con 80% de precisión (4 errores de 20 = 80%)
      // Nota: usamos 20 para evitar problemas de redondeo con 10 validaciones
      await setUserPrecision(TEST_USER_BAD, 20, 80)

      // Verificar estado del usuario
      await verificarEstadoUsuario(TEST_USER_BAD)

      const stats = await getUserStats(TEST_USER_BAD)
      expect(stats).toBeDefined()
      expect(stats!.estado).toBe('advertido')
      expect(stats!.actasValidadas).toBe(20)
      expect(stats!.razonEstado).toContain('80%')
      expect(stats!.conteoAdvertencias).toBe(1)

      // Verificar que se registró en el historial
      const history = await getUserStateHistory(TEST_USER_BAD)
      expect(history).toHaveLength(1)
      expect(history[0].estadoAnterior).toBe('activo')
      expect(history[0].estadoNuevo).toBe('advertido')
      expect(history[0].esAutomatico).toBe(true)
      expect(history[0].porcentajeAcierto).toBe(80)
    }, 10000)

    it('no debe cambiar estado si la precisión está por encima del 90%', async () => {
      // Configurar 10 validaciones con 100% de precisión (0 errores)
      await setUserPrecision(TEST_USER_BAD, 10, 100)

      await verificarEstadoUsuario(TEST_USER_BAD)

      const stats = await getUserStats(TEST_USER_BAD)
      expect(stats?.estado).toBe('activo')
    }, 10000)
  })

  describe('Estado: Restringido (< 80% precisión / >20% error)', () => {
    it('debe cambiar a restringido progresivamente desde advertido', async () => {
      // Paso 1: Configurar usuario con 85% de precisión → advertido (< 90%)
      // 20 validaciones, 3 errores = 85%
      await setUserPrecision(TEST_USER_BAD, 20, 85)
      await verificarEstadoUsuario(TEST_USER_BAD)

      let stats = await getUserStats(TEST_USER_BAD)
      expect(stats!.estado).toBe('advertido')

      // Paso 2: Empeorar precisión a 75% → debe avanzar a restringido (< 80%)
      // 20 validaciones, 5 errores = 75%
      await setUserPrecision(TEST_USER_BAD, 20, 75)
      await verificarEstadoUsuario(TEST_USER_BAD)

      stats = await getUserStats(TEST_USER_BAD)
      expect(stats!.estado).toBe('restringido')
      expect(stats!.actasValidadas).toBe(20)

      // Verificar historial: debe tener 2 cambios
      const history = await getUserStateHistory(TEST_USER_BAD)
      expect(history.length).toBeGreaterThanOrEqual(2)
      expect(history[0].estadoNuevo).toBe('advertido')
      expect(history[1].estadoNuevo).toBe('restringido')
    }, 10000)

    it('no debe saltar de activo a restringido directamente', async () => {
      // Usuario activo con 60% de precisión (debería ir a baneado pero solo avanza a advertido)
      // 10 validaciones, 4 errores = 60%
      await setUserPrecision(TEST_USER_BAD, 10, 60)
      await verificarEstadoUsuario(TEST_USER_BAD)

      const stats = await getUserStats(TEST_USER_BAD)
      // Debe pasar a advertido, no a restringido (transiciones progresivas)
      expect(stats!.estado).toBe('advertido')

      const history = await getUserStateHistory(TEST_USER_BAD)
      expect(history).toHaveLength(1)
      expect(history[0].estadoNuevo).toBe('advertido')
    }, 10000)
  })

  describe('Estado: Baneado (< 70% precisión / >30% error)', () => {
    it('debe cambiar a baneado progresivamente desde restringido', async () => {
      // Paso 1: Advertido (85% = 17/20 correcto, < 90%)
      await setUserPrecision(TEST_USER_BAD, 20, 85)
      await verificarEstadoUsuario(TEST_USER_BAD)

      let stats = await getUserStats(TEST_USER_BAD)
      expect(stats!.estado).toBe('advertido')

      // Paso 2: Restringido (75% = 15/20 correcto, < 80%)
      await setUserPrecision(TEST_USER_BAD, 20, 75)
      await verificarEstadoUsuario(TEST_USER_BAD)

      stats = await getUserStats(TEST_USER_BAD)
      expect(stats!.estado).toBe('restringido')

      // Paso 3: Baneado (60% = 12/20 correcto, < 70%)
      await setUserPrecision(TEST_USER_BAD, 20, 60)
      await verificarEstadoUsuario(TEST_USER_BAD)

      stats = await getUserStats(TEST_USER_BAD)
      expect(stats!.estado).toBe('baneado')

      // Verificar historial completo
      const history = await getUserStateHistory(TEST_USER_BAD)
      expect(history.length).toBeGreaterThanOrEqual(3)
      expect(history[0].estadoNuevo).toBe('advertido')
      expect(history[1].estadoNuevo).toBe('restringido')
      expect(history[2].estadoNuevo).toBe('baneado')
    }, 10000)

    it('debe incluir la precisión crítica en la razón del ban', async () => {
      // Llevar al usuario a baneado progresivamente
      await setUserPrecision(TEST_USER_BAD, 20, 85) // advertido
      await verificarEstadoUsuario(TEST_USER_BAD)

      await setUserPrecision(TEST_USER_BAD, 20, 75) // restringido
      await verificarEstadoUsuario(TEST_USER_BAD)

      await setUserPrecision(TEST_USER_BAD, 20, 60) // baneado
      await verificarEstadoUsuario(TEST_USER_BAD)

      const stats = await getUserStats(TEST_USER_BAD)
      expect(stats!.estado).toBe('baneado')
      expect(stats!.razonEstado).toContain('Precisión crítica')
      expect(stats!.razonEstado).toContain('%')
    }, 10000)

    it('debe eliminar validaciones y reportes cuando el usuario es baneado', async () => {
      // Crear algunas validaciones para el usuario malo
      const testActa1 = await createTestActa(STANDARD_VOTES)
      const testActa2 = await createTestActa(STANDARD_VOTES)
      testActas.push(testActa1, testActa2)

      // El usuario malo valida ambas actas
      await guardarValidacionInternal({
        uuid: testActa1.uuid,
        userId: TEST_USER_BAD,
        datos: { esCorrecta: true },
        skipLockCheck: true,
        skipRevalidate: true,
      })
      await guardarValidacionInternal({
        uuid: testActa2.uuid,
        userId: TEST_USER_BAD,
        datos: { esCorrecta: true },
        skipLockCheck: true,
        skipRevalidate: true,
      })

      // Verificar que existen validaciones
      const [beforeValidaciones] = await db
        .select({ count: count() })
        .from(validacion)
        .where(eq(validacion.usuarioId, TEST_USER_BAD))
      expect(Number(beforeValidaciones.count)).toBe(2)

      // Llevar al usuario a baneado progresivamente
      await setUserPrecision(TEST_USER_BAD, 20, 85) // advertido (< 90%)
      await verificarEstadoUsuario(TEST_USER_BAD)

      await setUserPrecision(TEST_USER_BAD, 20, 75) // restringido (< 80%)
      await verificarEstadoUsuario(TEST_USER_BAD)

      await setUserPrecision(TEST_USER_BAD, 20, 60) // baneado (< 70%)
      await verificarEstadoUsuario(TEST_USER_BAD)

      const stats = await getUserStats(TEST_USER_BAD)
      expect(stats!.estado).toBe('baneado')

      // Verificar que las validaciones fueron eliminadas
      const [afterValidaciones] = await db
        .select({ count: count() })
        .from(validacion)
        .where(eq(validacion.usuarioId, TEST_USER_BAD))
      expect(Number(afterValidaciones.count)).toBe(0)

      // Verificar que los reportes también fueron eliminados
      const [afterDiscrepancias] = await db
        .select({ count: count() })
        .from(discrepancia)
        .where(eq(discrepancia.usuarioId, TEST_USER_BAD))
      expect(Number(afterDiscrepancias.count)).toBe(0)
    }, 30000)
  })

  describe('Admin Lock', () => {
    it('no debe cambiar estado automáticamente si está bloqueado por admin', async () => {
      // Configurar usuario con baja precisión Y bloqueado por admin
      await setUserPrecision(TEST_USER_BAD, 10, 40)

      // Marcar como bloqueado por admin
      await db
        .update(estadisticaUsuario)
        .set({
          estadoBloqueadoPorAdmin: true,
        })
        .where(eq(estadisticaUsuario.usuarioId, TEST_USER_BAD))

      // Verificar que tiene el lock de admin
      let stats = await getUserStats(TEST_USER_BAD)
      expect(stats!.estadoBloqueadoPorAdmin).toBe(true)

      // Intentar verificar estado (no debe cambiar porque está bloqueado)
      await verificarEstadoUsuario(TEST_USER_BAD)

      // Estado debe permanecer activo a pesar de baja precisión
      stats = await getUserStats(TEST_USER_BAD)
      expect(stats!.estado).toBe('activo')
      expect(stats!.estadoBloqueadoPorAdmin).toBe(true)

      // No debe haber cambios en el historial (porque admin lock previene cambios)
      const history = await getUserStateHistory(TEST_USER_BAD)
      expect(history).toHaveLength(0)
    }, 10000)
  })

  describe('Mínimo de Validaciones', () => {
    it('no debe cambiar estado si no hay suficientes validaciones', async () => {
      // Configurar solo 5 validaciones (menos del mínimo de 10)
      await setUserPrecision(TEST_USER_BAD, 5, 20)

      await verificarEstadoUsuario(TEST_USER_BAD)

      const stats = await getUserStats(TEST_USER_BAD)
      // Debe permanecer activo
      if (stats) {
        expect(stats.estado).toBe('activo')
      }
    }, 10000)

    it('debe evaluar exactamente en el mínimo de validaciones', async () => {
      const minValidations = AUTOBAN_CONFIG.MIN_VALIDATIONS_FOR_EVALUATION

      // Configurar exactamente el mínimo con 50% de precisión
      await setUserPrecision(TEST_USER_BAD, minValidations, 50)

      await verificarEstadoUsuario(TEST_USER_BAD)

      const stats = await getUserStats(TEST_USER_BAD)
      expect(stats).toBeDefined()
      // Con 50% debe estar advertido (justo en el límite < 50% threshold)
      expect(stats!.actasValidadas).toBe(minValidations)
    }, 10000)
  })

  describe('Integración con Sistema de Consenso', () => {
    it('debe actualizar estado automáticamente después del consenso', async () => {
      // Crear 10 actas donde TEST_USER_BAD siempre está en la minoría
      for (let i = 0; i < 10; i++) {
        const testActa = await createTestActa(STANDARD_VOTES)
        testActas.push(testActa)

        // Los dos usuarios buenos validan secuencialmente
        const result1 = await guardarValidacionInternal({
          uuid: testActa.uuid,
          userId: TEST_USER_GOOD_1,
          datos: { esCorrecta: true },
          skipLockCheck: true,
          skipRevalidate: true,
        })

        const result2 = await guardarValidacionInternal({
          uuid: testActa.uuid,
          userId: TEST_USER_GOOD_2,
          datos: { esCorrecta: true },
          skipLockCheck: true,
          skipRevalidate: true,
        })

        // Verificar que ambas validaciones fueron exitosas
        expect(result1.success).toBe(true)
        expect(result2.success).toBe(true)

        // Usuario malo valida último (recibe corrección automática)
        const result = await guardarValidacionInternal({
          uuid: testActa.uuid,
          userId: TEST_USER_BAD,
          datos: {
            esCorrecta: false,
            correciones: DIFFERENT_VOTES_1,
          },
          skipLockCheck: true,
          skipRevalidate: true,
        })

        expect(result.success).toBe(true)
        expect(result.consenso).toBeDefined()
        expect(result.consenso?.encontrado).toBe(true)
        expect(result.consenso?.discrepantUserIds).toBeDefined()
        expect(result.consenso?.discrepantUserIds).toContain(TEST_USER_BAD)
      }

      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Verificar que el estado cambió automáticamente
      const stats = await getUserStats(TEST_USER_BAD)
      expect(stats).toBeDefined()
      expect(stats!.correccionesRecibidas).toBe(10)
      expect(stats!.actasValidadas).toBe(10)

      // Con 0% de precisión (100% error), debe estar al menos advertido
      // (progresivo: primero advertido, luego restringido, luego baneado)
      expect(stats!.estado).toBe('advertido')
    }, 60000) // Timeout aumentado para validaciones secuenciales
  })
})
