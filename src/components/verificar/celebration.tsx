'use client'

import confetti from 'canvas-confetti'
import { useEffect } from 'react'
import { getEncouragingMessage } from '@/lib/engagement'

interface CelebrationProps {
  readonly show: boolean
  readonly streak: number
  readonly isMilestone?: boolean
  readonly isActaComplete?: boolean // When this validation completes the acta (3/3)
}

/**
 * Dispara una celebración especial tipo para actas completadas
 */
function fireActaCompleteCelebration() {
  const duration = 2000
  const animationEnd = Date.now() + duration
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 0,
    disableForReducedMotion: true,
  }

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  const interval: NodeJS.Timeout = setInterval(function () {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)

    // Disparo desde la izquierda
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'],
    })

    // Disparo desde la derecha
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7'],
    })
  }, 250)
}

/**
 * Componente de celebración que muestra confetti y mensajes motivacionales
 * Muestra celebraciones para hitos de usuario y para actas completadas (3/3)
 */
export function Celebration({
  show,
  streak,
  isMilestone = false,
  isActaComplete = false,
}: CelebrationProps) {
  // Derive shouldShowMessage from props instead of managing state
  const shouldShowMessage = show && (isMilestone || isActaComplete)

  useEffect(() => {
    if (!show) {
      return
    }

    // Celebración especial para acta completada (3/3)
    if (isActaComplete) {
      fireActaCompleteCelebration()
      return
    }

    // Celebración para hitos de usuario
    if (isMilestone) {
      // Celebración grande solo para hitos
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'],
        disableForReducedMotion: true,
      })

      // Segundo disparo para celebración extra
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.7 },
          colors: ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'],
          disableForReducedMotion: true,
        })
      }, 250)
    }
  }, [show, isMilestone, isActaComplete])

  if (!shouldShowMessage) return null

  const message = isActaComplete ? '¡Acta validada! 3/3 ✓' : getEncouragingMessage(streak)

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div
        className={`
          bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg
          transform transition-all duration-500 font-semibold text-lg
          ${show ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
          ${isActaComplete ? 'text-xl px-8 py-4' : ''}
        `}
      >
        {message}
      </div>
    </div>
  )
}

/**
 * Dispara confetti desde un botón específico
 */
export function fireConfettiFromButton(buttonElement: HTMLElement) {
  const rect = buttonElement.getBoundingClientRect()
  const x = (rect.left + rect.width / 2) / window.innerWidth
  const y = (rect.top + rect.height / 2) / window.innerHeight

  confetti({
    particleCount: 30,
    spread: 60,
    origin: { x, y },
    colors: ['#16a34a', '#22c55e', '#4ade80'],
    disableForReducedMotion: true,
  })
}
