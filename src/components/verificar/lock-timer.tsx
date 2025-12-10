'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { refrescarBloqueo } from '@/lib/actas/actions'

interface LockTimerProps {
  bloqueadoHasta: Date
  uuid: string
  onExpired?: () => void
  /** Disable auto-refresh (e.g., when abandoning) */
  disableRefresh?: boolean
}

export function LockTimer({
  bloqueadoHasta,
  uuid,
  onExpired,
  disableRefresh = false,
}: LockTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return

    setIsRefreshing(true)
    try {
      const result = await refrescarBloqueo(uuid)
      if (result.success && result.bloqueadoHasta) {
        // El timer se actualizará automáticamente porque bloqueadoHasta cambió
        // Pero necesitamos forzar recálculo
        const now = new Date().getTime()
        const expiry = new Date(result.bloqueadoHasta).getTime()
        setTimeLeft(Math.max(0, Math.floor((expiry - now) / 1000)))
      }
    } catch (error) {
      console.error('Error refrescando bloqueo:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [isRefreshing, uuid])

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const expiry = new Date(bloqueadoHasta).getTime()
      const diff = Math.max(0, Math.floor((expiry - now) / 1000))
      return diff
    }

    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)

      if (newTimeLeft === 0) {
        onExpired?.()
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [bloqueadoHasta, onExpired])

  // Auto-refresh cuando quedan 2 minutos
  useEffect(() => {
    const refreshThreshold = 120 // 2 minutos

    // Don't refresh if disabled (e.g., during abandon)
    if (disableRefresh) return

    if (timeLeft === refreshThreshold && !isRefreshing) {
      handleRefresh()
    }
  }, [timeLeft, isRefreshing, disableRefresh, handleRefresh])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const isLow = timeLeft < 120 // Menos de 2 minutos
  const isCritical = timeLeft < 60 // Menos de 1 minuto

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
        isCritical
          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
          : isLow
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
            : 'bg-muted text-muted-foreground'
      )}
    >
      {isCritical ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      <span className="tabular-nums">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
      {isLow && !isCritical && <span className="text-xs opacity-75">restantes</span>}
      {isCritical && <span className="text-xs">¡Apúrate!</span>}
    </div>
  )
}
