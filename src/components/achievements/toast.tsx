'use client'

import { toast } from 'sonner'
import { Trophy } from 'lucide-react'

interface Achievement {
  id: number
  nombre: string
  descripcion: string
  icono: string | null
}

/**
 * Muestra una notificación toast para un logro desbloqueado
 */
export const showAchievementToast = (achievement: Achievement) => {
  toast.success(
    <div className="flex items-center gap-2">
      <span className="text-lg shrink-0">{achievement.icono || '🏆'}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium">{achievement.nombre}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{achievement.descripcion}</p>
      </div>
    </div>,
    {
      icon: <Trophy className="h-5 w-5 text-primary" />,
      duration: 5000,
    }
  )
}

/**
 * Muestra notificaciones toast para múltiples logros desbloqueados
 */
export const showAchievementsToast = (achievements: Achievement[]) => {
  if (achievements.length === 0) return

  if (achievements.length === 1) {
    showAchievementToast(achievements[0])
    return
  }

  // Para múltiples logros, mostrar el primero inmediatamente y los demás con delay
  achievements.forEach((achievement, index) => {
    setTimeout(() => {
      showAchievementToast(achievement)
    }, index * 300) // Delay de 300ms entre cada toast
  })
}
