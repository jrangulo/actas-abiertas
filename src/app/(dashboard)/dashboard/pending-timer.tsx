'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface PendingTimerProps {
  bloqueadoHasta: Date
}

/**
 * Componente cliente para mostrar el tiempo restante del bloqueo
 * Se actualiza cada segundo
 */
export function PendingTimer({ bloqueadoHasta }: PendingTimerProps) {
  const [tiempoRestante, setTiempoRestante] = useState(() => {
    const ahora = Date.now()
    const expira = new Date(bloqueadoHasta).getTime()
    return Math.max(0, Math.floor((expira - ahora) / 1000))
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = Date.now()
      const expira = new Date(bloqueadoHasta).getTime()
      const restante = Math.max(0, Math.floor((expira - ahora) / 1000))
      setTiempoRestante(restante)
    }, 1000)

    return () => clearInterval(interval)
  }, [bloqueadoHasta])

  const minutos = Math.floor(tiempoRestante / 60)
  const segundos = tiempoRestante % 60

  return (
    <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1.5">
      <Clock className="h-4 w-4" />
      <span className="text-sm font-mono font-medium">
        {minutos.toString().padStart(2, '0')}:{segundos.toString().padStart(2, '0')}
      </span>
    </div>
  )
}
