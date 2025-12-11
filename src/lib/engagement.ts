/**
 * Engagement utilities para gamificar la experiencia de verificación
 */

const INACTIVITY_TIMEOUT = 12 * 60 * 1000 // 12 minutos en milisegundos

/**
 * Dispara haptic feedback en dispositivos móviles soportados
 */
export function triggerHaptic(sensation: 'good' | 'bad' = 'good') {
  if (!('vibrate' in navigator)) return

  const patterns = {
    good: [60, 30, 60],
    bad: [100, 50, 100],
  }

  try {
    navigator.vibrate(patterns[sensation])
  } catch (e) {
    console.debug('Haptic feedback no disponible:', e)
  }
}
/**
 * Verifica si han pasado más de 12 minutos desde la última actividad
 */
function isStreakExpired(): boolean {
  if (globalThis.window === undefined) return false

  const lastActivity = localStorage.getItem('verification-last-activity')
  if (!lastActivity) return false

  const lastActivityTime = Number.parseInt(lastActivity, 10)
  const now = Date.now()

  return now - lastActivityTime > INACTIVITY_TIMEOUT
}

/**
 * Actualiza el timestamp de la última actividad
 */
function updateLastActivity(): void {
  if (globalThis.window === undefined) return
  localStorage.setItem('verification-last-activity', Date.now().toString())
}

/**
 * Obtiene el contador de verificaciones consecutivas desde localStorage
 * Se reinicia automáticamente si han pasado más de 12 minutos
 */
export function getConsecutiveCount(): number {
  if (globalThis.window === undefined) return 0

  // Si el contador expiró, reiniciarlo
  if (isStreakExpired()) {
    resetConsecutiveCount()
    return 0
  }

  const count = localStorage.getItem('verification-consecutive')
  return count ? Number.parseInt(count, 10) : 0
}

/**
 * Incrementa el contador de verificaciones consecutivas
 */
export function incrementConsecutiveCount(): number {
  const currentCount = getConsecutiveCount()
  const newCount = currentCount + 1
  localStorage.setItem('verification-consecutive', newCount.toString())
  updateLastActivity()
  return newCount
}

/**
 * Reinicia el contador de verificaciones consecutivas
 */
export function resetConsecutiveCount(): void {
  localStorage.removeItem('verification-consecutive')
  localStorage.removeItem('verification-last-activity')
}

/**
 * Inicializa el contador total del usuario desde el servidor
 * Se guarda en localStorage y se incrementa localmente
 */
export function initializeTotalCount(serverCount: number): void {
  if (globalThis.window === undefined) return
  localStorage.setItem('verification-total-count', serverCount.toString())
}

/**
 * Obtiene el contador total de actas verificadas por el usuario
 */
export function getTotalCount(): number {
  if (globalThis.window === undefined) return 0
  const count = localStorage.getItem('verification-total-count')
  return count ? Number.parseInt(count, 10) : 0
}

/**
 * Incrementa el contador total de verificaciones
 */
export function incrementTotalCount(): number {
  const currentTotal = getTotalCount()
  const newTotal = currentTotal + 1
  localStorage.setItem('verification-total-count', newTotal.toString())
  return newTotal
}

/**
 * Revisa si el usuario alcanzó un hito (cada 5, 10, 25, 50, etc.)
 */
export function checkMilestone(count: number): { isMilestone: boolean; milestone: number } {
  const milestones = [5, 10, 25, 50, 100, 250, 500, 1000]
  const milestone = milestones.find((m) => count === m)

  return {
    isMilestone: !!milestone,
    milestone: milestone || 0,
  }
}

/**
 * Obtiene un mensaje motivacional basado en el contador de verificaciones
 */
export function getEncouragingMessage(count: number): string {
  if (count === 5) return '¡5 actas verificadas!'
  if (count === 10) return '¡10 actas! ¡Excelente trabajo!'
  if (count === 25) return '¡25 actas! ¡Increíble!'
  if (count === 50) return '¡50 actas verificadas! ¡Leyenda!'
  if (count === 100) return '¡100 actas! ¡Héroe nacional!'
  if (count === 250) return '¡250 actas! ¡Contribución épica!'
  if (count === 500) return '¡500 actas! ¡Imparable!'
  if (count === 1000) return '¡1000 actas! ¡Historia electoral!'

  // Mensajes genéricos para otros hitos
  if (count % 50 === 0) return `¡${count} actas verificadas!`
  if (count % 25 === 0) return `¡${count} actas! ¡Sigue así!`

  return '¡Bien hecho!'
}
