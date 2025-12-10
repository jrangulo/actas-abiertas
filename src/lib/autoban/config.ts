/**
 * Configuración del sistema de autoban
 */

export const AUTOBAN_CONFIG = {
  // Minimo de validaciones antes de que un usuario pueda ser evaluado
  // Evita banear a nuevos usuarios que aún están aprendiendo
  MIN_VALIDATIONS_FOR_EVALUATION: 10,

  // Umbrales de precisión para cada etapa (porcentaje)
  THRESHOLDS: {
    // Por debajo del 70% de precisión → Etapa 1 Advertencia
    WARNING_ACCURACY: 70,

    // Por debajo del 50% de precisión → Etapa 2 Advertencia Final
    RESTRICTION_ACCURACY: 50,

    // Por debajo del 30% de precisión → Etapa 3 Ban (no puede contribuir)
    BAN_ACCURACY: 30,
  },

  // Periodo de gracia: deshabilitado (seteado a 0)
  GRACE_PERIOD_VALIDATIONS: 0,
} as const

export type EstadoUsuario = 'activo' | 'advertido' | 'restringido' | 'baneado'
