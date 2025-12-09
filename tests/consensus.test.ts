/**
 * Tests de integración para el sistema de validación por consenso
 *
 * Estos tests verifican que:
 * 1. Cuando 3 validadores coinciden, el acta se marca como validada con esos valores
 * 2. Cuando 2 validadores coinciden y 1 difiere, el acta se valida y el usuario discrepante recibe una corrección
 * 3. Cuando los 3 validadores difieren, el acta se marca como discrepancia sin correcciones
 *
 * IMPORTANTE: Estos tests usan las funciones REALES de actions.ts, no lógica duplicada.
 * Crean usuarios de prueba reales en Supabase Auth y actas de prueba reales en la base de datos.
 *
 * Requisitos:
 * - DATABASE_URL debe estar configurado
 * - SUPABASE_SERVICE_ROLE_KEY debe estar configurado (para crear usuarios de prueba)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { guardarValidacionInternal } from '@/lib/actas/actions'
import { valuesMatch, findConsensus, type VoteValues } from '@/lib/actas/consensus'
import { createTestUser, deleteTestUser, canRunAdminTests } from './helpers/supabase-admin'
import {
  createTestActa,
  getTestActa,
  getUserStats,
  cleanupTestActa,
  cleanupUserStats,
  STANDARD_VOTES,
  DIFFERENT_VOTES_1,
  DIFFERENT_VOTES_2,
  type TestActa,
} from './helpers/test-data'

// ============================================================================
// Configuración de Tests
// ============================================================================

// IDs de usuarios de prueba (creados en beforeAll)
let TEST_USER_1: string
let TEST_USER_2: string
let TEST_USER_3: string

// Seguimiento de actas de prueba para limpieza
let testActas: TestActa[] = []

// Omitir tests si no podemos crear usuarios
const describeWithUsers = canRunAdminTests() ? describe : describe.skip

// ============================================================================
// Tests
// ============================================================================

describeWithUsers('Sistema de Validación por Consenso (Integración)', () => {
  // Crear usuarios de prueba antes de todos los tests
  beforeAll(async () => {
    console.log('Creando usuarios de prueba...')
    TEST_USER_1 = await createTestUser(`test-consensus-1-${Date.now()}@test.local`)
    TEST_USER_2 = await createTestUser(`test-consensus-2-${Date.now()}@test.local`)
    TEST_USER_3 = await createTestUser(`test-consensus-3-${Date.now()}@test.local`)
    console.log('Usuarios de prueba creados:', { TEST_USER_1, TEST_USER_2, TEST_USER_3 })
  }, 30000)

  // Limpiar usuarios de prueba después de todos los tests
  afterAll(async () => {
    console.log('Limpiando usuarios de prueba...')
    // Filtrar IDs undefined (si la creación falló)
    const validUserIds = [TEST_USER_1, TEST_USER_2, TEST_USER_3].filter(Boolean)
    if (validUserIds.length > 0) {
      // Limpiar estadísticas de usuarios
      await cleanupUserStats(validUserIds)
      // Eliminar usuarios de prueba de auth
      for (const userId of validUserIds) {
        await deleteTestUser(userId)
      }
    }
    console.log('Usuarios de prueba eliminados')
  }, 30000)

  // Limpiar actas de prueba después de cada test
  afterEach(async () => {
    for (const testActa of testActas) {
      await cleanupTestActa(testActa.id)
    }
    testActas = []
  })

  // Reiniciar estadísticas de usuarios antes de cada test
  beforeEach(async () => {
    const validUserIds = [TEST_USER_1, TEST_USER_2, TEST_USER_3].filter(Boolean)
    if (validUserIds.length > 0) {
      await cleanupUserStats(validUserIds)
    }
  })

  describe('Escenario 1: Los 3 validadores coinciden', () => {
    it('debe marcar el acta como validada con los valores acordados y sin correcciones', async () => {
      // Preparar: Crear un acta de prueba
      const testActa = await createTestActa(STANDARD_VOTES)
      testActas.push(testActa)

      // Actuar: 3 usuarios validan con los mismos valores (confirman como correctos)
      const result1 = await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_1,
        datos: { esCorrecta: true },
        skipLockCheck: true,
        skipRevalidate: true,
      })
      expect(result1.success).toBe(true)
      expect(result1.nuevoEstado).toBe('en_validacion')

      const result2 = await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_2,
        datos: { esCorrecta: true },
        skipLockCheck: true,
        skipRevalidate: true,
      })
      expect(result2.success).toBe(true)
      expect(result2.nuevoEstado).toBe('en_validacion')

      // La tercera validación dispara el consenso
      const result3 = await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_3,
        datos: { esCorrecta: true },
        skipLockCheck: true,
        skipRevalidate: true,
      })

      // Verificar
      expect(result3.success).toBe(true)
      expect(result3.nuevoEstado).toBe('validada')
      expect(result3.consenso?.encontrado).toBe(true)
      expect(result3.consenso?.discrepantUserIds).toHaveLength(0)

      // Verificar estado del acta en la base de datos
      const updatedActa = await getTestActa(testActa.id)
      expect(updatedActa.estado).toBe('validada')
      expect(updatedActa.cantidadValidaciones).toBe(3)
      expect(updatedActa.cantidadValidacionesCorrectas).toBe(3)
      expect(updatedActa.votosPnDigitado).toBe(STANDARD_VOTES.pn)

      // Ningún usuario debe tener correcciones
      const stats1 = await getUserStats(TEST_USER_1)
      const stats2 = await getUserStats(TEST_USER_2)
      const stats3 = await getUserStats(TEST_USER_3)
      expect(stats1?.correccionesRecibidas ?? 0).toBe(0)
      expect(stats2?.correccionesRecibidas ?? 0).toBe(0)
      expect(stats3?.correccionesRecibidas ?? 0).toBe(0)
    })
  })

  describe('Escenario 2: 2 validadores coinciden, 1 difiere', () => {
    it('debe marcar el acta como validada con valores de mayoría y dar corrección al usuario discrepante', async () => {
      // Preparar: Crear un acta de prueba
      const testActa = await createTestActa(STANDARD_VOTES)
      testActas.push(testActa)

      // Actuar: Usuarios 1 y 2 confirman como correcto, Usuario 3 envía valores diferentes
      await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_1,
        datos: { esCorrecta: true },
        skipLockCheck: true,
        skipRevalidate: true,
      })

      await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_2,
        datos: { esCorrecta: true },
        skipLockCheck: true,
        skipRevalidate: true,
      })

      // Usuario 3 envía valores DIFERENTES
      const result3 = await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_3,
        datos: {
          esCorrecta: false,
          correciones: DIFFERENT_VOTES_1,
        },
        skipLockCheck: true,
        skipRevalidate: true,
      })

      // Verificar
      expect(result3.success).toBe(true)
      expect(result3.nuevoEstado).toBe('validada')
      expect(result3.consenso?.encontrado).toBe(true)
      expect(result3.consenso?.discrepantUserIds).toContain(TEST_USER_3)
      expect(result3.consenso?.discrepantUserIds).toHaveLength(1)

      // Verificar que el acta tiene valores ESTÁNDAR (de la mayoría)
      const updatedActa = await getTestActa(testActa.id)
      expect(updatedActa.estado).toBe('validada')
      expect(updatedActa.cantidadValidaciones).toBe(3)
      expect(updatedActa.cantidadValidacionesCorrectas).toBe(2)
      expect(updatedActa.votosPnDigitado).toBe(STANDARD_VOTES.pn) // No 101

      // Usuario 3 debe tener una corrección
      const stats3 = await getUserStats(TEST_USER_3)
      expect(stats3?.correccionesRecibidas).toBe(1)

      // Usuarios 1 y 2 NO deben tener correcciones
      const stats1 = await getUserStats(TEST_USER_1)
      const stats2 = await getUserStats(TEST_USER_2)
      expect(stats1?.correccionesRecibidas ?? 0).toBe(0)
      expect(stats2?.correccionesRecibidas ?? 0).toBe(0)
    })

    it('debe funcionar cuando el usuario discrepante valida en el medio', async () => {
      // Preparar
      const testActa = await createTestActa(STANDARD_VOTES)
      testActas.push(testActa)

      // Actuar: Usuario 1 confirma, Usuario 2 difiere, Usuario 3 confirma
      await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_1,
        datos: { esCorrecta: true },
        skipLockCheck: true,
        skipRevalidate: true,
      })

      // Usuario 2 envía valores DIFERENTES (en el medio)
      await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_2,
        datos: {
          esCorrecta: false,
          correciones: DIFFERENT_VOTES_1,
        },
        skipLockCheck: true,
        skipRevalidate: true,
      })

      const result3 = await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_3,
        datos: { esCorrecta: true },
        skipLockCheck: true,
        skipRevalidate: true,
      })

      // Verificar
      expect(result3.consenso?.encontrado).toBe(true)
      expect(result3.consenso?.discrepantUserIds).toContain(TEST_USER_2)

      // Usuario 2 debe tener una corrección
      const stats2 = await getUserStats(TEST_USER_2)
      expect(stats2?.correccionesRecibidas).toBe(1)
    })

    it('debe funcionar cuando el primer usuario difiere de los últimos dos', async () => {
      // Preparar
      const testActa = await createTestActa(STANDARD_VOTES)
      testActas.push(testActa)

      // Actuar: Usuario 1 difiere, Usuarios 2 y 3 confirman
      await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_1,
        datos: {
          esCorrecta: false,
          correciones: DIFFERENT_VOTES_1,
        },
        skipLockCheck: true,
        skipRevalidate: true,
      })

      await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_2,
        datos: { esCorrecta: true },
        skipLockCheck: true,
        skipRevalidate: true,
      })

      const result3 = await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_3,
        datos: { esCorrecta: true },
        skipLockCheck: true,
        skipRevalidate: true,
      })

      // Verificar
      expect(result3.consenso?.encontrado).toBe(true)
      expect(result3.consenso?.discrepantUserIds).toContain(TEST_USER_1)

      // Usuario 1 debe tener una corrección
      const stats1 = await getUserStats(TEST_USER_1)
      expect(stats1?.correccionesRecibidas).toBe(1)

      // Los valores deben ser de la mayoría (Usuarios 2 y 3)
      const updatedActa = await getTestActa(testActa.id)
      expect(updatedActa.votosPnDigitado).toBe(STANDARD_VOTES.pn)
    })
  })

  describe('Escenario 3: Los 3 validadores difieren', () => {
    it('debe marcar el acta como discrepancia sin correcciones', async () => {
      // Preparar
      const testActa = await createTestActa(STANDARD_VOTES)
      testActas.push(testActa)

      // Actuar: Los 3 usuarios envían valores DIFERENTES
      await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_1,
        datos: { esCorrecta: true }, // Confirma STANDARD
        skipLockCheck: true,
        skipRevalidate: true,
      })

      await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_2,
        datos: {
          esCorrecta: false,
          correciones: DIFFERENT_VOTES_1, // pn: 101
        },
        skipLockCheck: true,
        skipRevalidate: true,
      })

      const result3 = await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_3,
        datos: {
          esCorrecta: false,
          correciones: DIFFERENT_VOTES_2, // plh: 81
        },
        skipLockCheck: true,
        skipRevalidate: true,
      })

      // Verificar
      expect(result3.success).toBe(true)
      expect(result3.nuevoEstado).toBe('con_discrepancia')
      expect(result3.consenso?.encontrado).toBe(false)

      // Verificar estado del acta
      const updatedActa = await getTestActa(testActa.id)
      expect(updatedActa.estado).toBe('con_discrepancia')
      expect(updatedActa.cantidadValidaciones).toBe(3)

      // NINGÚN usuario debe tener correcciones (no se puede determinar quién está equivocado)
      const stats1 = await getUserStats(TEST_USER_1)
      const stats2 = await getUserStats(TEST_USER_2)
      const stats3 = await getUserStats(TEST_USER_3)
      expect(stats1?.correccionesRecibidas ?? 0).toBe(0)
      expect(stats2?.correccionesRecibidas ?? 0).toBe(0)
      expect(stats3?.correccionesRecibidas ?? 0).toBe(0)
    })
  })

  describe('Prevención de validación duplicada', () => {
    it('debe prevenir que el mismo usuario valide dos veces', async () => {
      // Preparar
      const testActa = await createTestActa(STANDARD_VOTES)
      testActas.push(testActa)

      // Actuar: Usuario 1 valida una vez
      const result1 = await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_1,
        datos: { esCorrecta: true },
        skipLockCheck: true,
        skipRevalidate: true,
      })
      expect(result1.success).toBe(true)

      // Intentar validar de nuevo
      const result2 = await guardarValidacionInternal({
        uuid: testActa.uuid,
        userId: TEST_USER_1,
        datos: { esCorrecta: true },
        skipLockCheck: true,
        skipRevalidate: true,
      })

      // Verificar
      expect(result2.success).toBe(false)
      expect(result2.error).toContain('Ya validaste')
    })
  })
})

// Tests unitarios para la lógica de consenso (siempre se ejecutan, sin dependencias externas)
describe('Sistema de Validación por Consenso (Tests unitarios)', () => {
  it('debe identificar correctamente valores coincidentes', () => {
    const a: VoteValues = {
      pn: 100,
      plh: 80,
      pl: 60,
      pinu: 10,
      dc: 5,
      nulos: 3,
      blancos: 2,
      total: 260,
    }
    const b: VoteValues = {
      pn: 100,
      plh: 80,
      pl: 60,
      pinu: 10,
      dc: 5,
      nulos: 3,
      blancos: 2,
      total: 260,
    }
    const c: VoteValues = {
      pn: 101,
      plh: 80,
      pl: 60,
      pinu: 10,
      dc: 5,
      nulos: 3,
      blancos: 2,
      total: 261,
    }

    expect(valuesMatch(a, b)).toBe(true)
    expect(valuesMatch(a, c)).toBe(false)
  })

  it('debe encontrar consenso cuando 2 de 3 coinciden', () => {
    const values1: VoteValues = {
      pn: 100,
      plh: 80,
      pl: 60,
      pinu: 10,
      dc: 5,
      nulos: 3,
      blancos: 2,
      total: 260,
    }
    const values2: VoteValues = {
      pn: 100,
      plh: 80,
      pl: 60,
      pinu: 10,
      dc: 5,
      nulos: 3,
      blancos: 2,
      total: 260,
    }
    const values3: VoteValues = {
      pn: 101,
      plh: 80,
      pl: 60,
      pinu: 10,
      dc: 5,
      nulos: 3,
      blancos: 2,
      total: 261,
    }

    const result = findConsensus([
      { usuarioId: 'user1', values: values1 },
      { usuarioId: 'user2', values: values2 },
      { usuarioId: 'user3', values: values3 },
    ])

    expect(result).not.toBeNull()
    expect(result?.winningValues.pn).toBe(100)
    expect(result?.discrepantUserIds).toContain('user3')
    expect(result?.discrepantUserIds).toHaveLength(1)
  })

  it('debe retornar null cuando los 3 son diferentes', () => {
    const values1: VoteValues = {
      pn: 100,
      plh: 80,
      pl: 60,
      pinu: 10,
      dc: 5,
      nulos: 3,
      blancos: 2,
      total: 260,
    }
    const values2: VoteValues = {
      pn: 101,
      plh: 80,
      pl: 60,
      pinu: 10,
      dc: 5,
      nulos: 3,
      blancos: 2,
      total: 261,
    }
    const values3: VoteValues = {
      pn: 100,
      plh: 81,
      pl: 60,
      pinu: 10,
      dc: 5,
      nulos: 3,
      blancos: 2,
      total: 261,
    }

    const result = findConsensus([
      { usuarioId: 'user1', values: values1 },
      { usuarioId: 'user2', values: values2 },
      { usuarioId: 'user3', values: values3 },
    ])

    expect(result).toBeNull()
  })

  it('debe retornar null con menos de 3 validaciones', () => {
    const values: VoteValues = {
      pn: 100,
      plh: 80,
      pl: 60,
      pinu: 10,
      dc: 5,
      nulos: 3,
      blancos: 2,
      total: 260,
    }

    const result = findConsensus([
      { usuarioId: 'user1', values },
      { usuarioId: 'user2', values },
    ])

    expect(result).toBeNull()
  })
})
