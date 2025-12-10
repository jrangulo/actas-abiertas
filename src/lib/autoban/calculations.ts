import { AUTOBAN_CONFIG, type EstadoUsuario } from './config'
import type { EstadisticaUsuario } from '@/db/schema'

/**
 * Calcular el porcentaje de precisión de las validaciones del usuario
 *
 * Precisión = (Validaciones Correctas / Total de Validaciones) * 100
 * Correctas = Total - Correcciones Recibidas
 *
 * @returns Porcentaje 0-100, o null si no hay suficientes datos
 */
export function calcularPorcentajeAcierto(
  stats: Pick<EstadisticaUsuario, 'actasValidadas' | 'correccionesRecibidas'>
): number | undefined {
  const { actasValidadas, correccionesRecibidas } = stats

  if (actasValidadas < AUTOBAN_CONFIG.MIN_VALIDATIONS_FOR_EVALUATION) {
    return undefined
  }

  // Aplicar periodo de gracia: restar las primeras N validaciones de ambos totales
  const validacionesEvaluadas = Math.max(
    0,
    actasValidadas - AUTOBAN_CONFIG.GRACE_PERIOD_VALIDATIONS
  )

  const correccionesEvaluadas = Math.max(
    0,
    correccionesRecibidas - Math.min(correccionesRecibidas, AUTOBAN_CONFIG.GRACE_PERIOD_VALIDATIONS)
  )

  if (validacionesEvaluadas === 0) {
    return undefined
  }

  const validacionesCorrectas = validacionesEvaluadas - correccionesEvaluadas
  const porcentaje = (validacionesCorrectas / validacionesEvaluadas) * 100

  return Math.max(0, Math.min(100, Math.round(porcentaje)))
}

/**
 * Determinar qué estado de usuario debe ser basado en la precisión
 *
 * Retorna el estado de usuario más severo basado en la precisión
 */
export function determinarEstadoPorAcierto(porcentajeAcierto: number | undefined): EstadoUsuario {
  if (porcentajeAcierto === undefined) {
    return 'activo'
  }

  const { THRESHOLDS } = AUTOBAN_CONFIG

  if (porcentajeAcierto < THRESHOLDS.BAN_ACCURACY) {
    return 'baneado'
  }

  if (porcentajeAcierto < THRESHOLDS.RESTRICTION_ACCURACY) {
    return 'restringido'
  }

  if (porcentajeAcierto < THRESHOLDS.WARNING_ACCURACY) {
    return 'advertido'
  }

  return 'activo'
}

/**
 * Determinar el siguiente estado en el sistema de advertencias progresivas
 *
 * Rules:
 * - Debe progresar a través de las etapas (no puede saltar de activo a baneado)
 */
export function determinarNuevoEstado(
  estadoActual: EstadoUsuario,
  estadoSugerido: EstadoUsuario,
  estadoBloqueadoPorAdmin: boolean
): EstadoUsuario | null {
  if (estadoBloqueadoPorAdmin) {
    return null
  }

  // No se necesita cambio
  if (estadoActual === estadoSugerido) {
    return null
  }

  const orden: Record<EstadoUsuario, number> = {
    activo: 0,
    advertido: 1,
    restringido: 2,
    baneado: 3,
  }

  const nivelActual = orden[estadoActual]
  const nivelSugerido = orden[estadoSugerido]

  if (nivelSugerido <= nivelActual) {
    return null
  }

  const siguienteNivel = nivelActual + 1
  const estados: EstadoUsuario[] = ['activo', 'advertido', 'restringido', 'baneado']
  return estados[siguienteNivel]
}
