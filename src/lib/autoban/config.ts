/**
 * Configuración del sistema de autoban
 *
 * Umbrales basados en TASA DE ERROR (no precisión):
 * - 10% error rate = 90% accuracy → Warning
 * - 20% error rate = 80% accuracy → Restricted
 * - 30% error rate = 70% accuracy → Banned
 */

export const AUTOBAN_CONFIG = {
  // Minimo de validaciones antes de que un usuario pueda ser evaluado
  // Evita banear a nuevos usuarios que aún están aprendiendo
  MIN_VALIDATIONS_FOR_EVALUATION: 10,

  // Umbrales de precisión para cada etapa (porcentaje de acierto)
  THRESHOLDS: {
    // Por debajo del 90% de precisión (10% error) → Etapa 1 Advertencia
    WARNING_ACCURACY: 90,

    // Por debajo del 80% de precisión (20% error) → Etapa 2 Advertencia Final
    RESTRICTION_ACCURACY: 80,

    // Por debajo del 70% de precisión (30% error) → Etapa 3 Ban (no puede contribuir)
    BAN_ACCURACY: 70,
  },

  // Periodo de gracia: deshabilitado (seteado a 0)
  GRACE_PERIOD_VALIDATIONS: 0,
} as const

export type EstadoUsuario = 'activo' | 'advertido' | 'restringido' | 'baneado'
