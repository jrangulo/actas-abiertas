'use client'

import confetti from 'canvas-confetti'
import { useEffect, useState, startTransition } from 'react'
import { getEncouragingMessage } from '@/lib/engagement'

interface CelebrationProps {
  readonly show: boolean
  readonly streak: number
  readonly isMilestone?: boolean
}

/**
 * Componente de celebración que muestra confetti y mensajes motivacionales
 * Solo se muestra para hitos - confirmaciones regulares solo tienen confetti del botón
 */
export function Celebration({ show, streak, isMilestone = false }: CelebrationProps) {
  const [shouldShowMessage, setShouldShowMessage] = useState(false)

  useEffect(() => {
    if (!show || !isMilestone) {
      startTransition(() => {
        setShouldShowMessage(false)
      })
      return // Solo mostrar para hitos
    }

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

    // Mostrar mensaje y limpiarlo después de la animación
    startTransition(() => {
      setShouldShowMessage(true)
    })
    const timer = setTimeout(() => {
      startTransition(() => {
        setShouldShowMessage(false)
      })
    }, 2500)
    return () => clearTimeout(timer)
  }, [show, streak, isMilestone])

  if (!shouldShowMessage) return null

  const message = getEncouragingMessage(streak)

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div
        className={`
          bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg
          transform transition-all duration-500 font-semibold text-lg
          ${show ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
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
