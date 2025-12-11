'use client'

import { Flame, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface StreakDisplayProps {
  consecutiveCount: number
  totalCount: number
}

/**
 * Muestra los contadores de verificaciones del usuario
 */
export function StreakDisplay({ consecutiveCount, totalCount }: Readonly<StreakDisplayProps>) {
  if (consecutiveCount === 0 && totalCount === 0) return null

  return (
    <div className="flex items-center gap-2">
      {consecutiveCount > 0 && (
        <Badge variant="outline" className="gap-1.5 bg-red-50 border-red-300 text-red-700">
          <Flame className="h-3.5 w-3.5 fill-red-500 text-red-600" />
          <span className="font-bold">{consecutiveCount}</span>
          <span className="text-xs">seguidas</span>
        </Badge>
      )}

      {totalCount > 0 && (
        <Badge variant="outline" className="gap-1 bg-green-50 border-green-300 text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="text-xs">Llevas: </span>
          <span className="font-bold">{totalCount}</span>
        </Badge>
      )}
    </div>
  )
}
