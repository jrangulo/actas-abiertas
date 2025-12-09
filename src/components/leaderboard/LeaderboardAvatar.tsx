import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardAvatarProps {
  position: number
  name: string
  avatarUrl?: string | null
  /** Tamaño: 'sm' = 32px, 'md' = 40px, 'lg' = 48px, 'xl' = 64px */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Si es true, muestra un indicador de que es el usuario actual */
  isCurrentUser?: boolean
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

const badgeSizeClasses = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-7 w-7',
  xl: 'h-8 w-8',
}

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
  xl: 'h-5 w-5',
}

// Estilos para medallas (top 3)
const medalStyles: Record<number, { bg: string; icon: string }> = {
  1: {
    bg: 'bg-yellow-200 dark:bg-yellow-900/40',
    icon: 'text-yellow-600 dark:text-yellow-400',
  },
  2: {
    bg: 'bg-gray-200 dark:bg-gray-800',
    icon: 'text-gray-500 dark:text-gray-400',
  },
  3: {
    bg: 'bg-orange-200 dark:bg-amber-900/40',
    icon: 'text-amber-600 dark:text-amber-400',
  },
}

/**
 * Avatar para el leaderboard con badge de posición (medalla para top 3)
 * Muestra la foto del usuario (o iniciales) con un indicador de posición
 */
export function LeaderboardAvatar({
  position,
  name,
  avatarUrl,
  size = 'md',
  isCurrentUser = false,
}: LeaderboardAvatarProps) {
  // Obtener iniciales del nombre
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const isMedal = position >= 1 && position <= 3
  const medalStyle = medalStyles[position]

  return (
    <div className="relative">
      <Avatar
        className={cn(
          sizeClasses[size],
          isCurrentUser && 'ring-2 ring-[#0069b4] ring-offset-2 ring-offset-background'
        )}
      >
        {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
        <AvatarFallback className="bg-[#0069b4] text-white font-medium">{initials}</AvatarFallback>
      </Avatar>

      {/* Badge de posición - medalla para top 3, número para el resto */}
      <div
        className={cn(
          'absolute -bottom-1 -right-1 rounded-full flex items-center justify-center',
          badgeSizeClasses[size],
          isMedal ? medalStyle?.bg : 'bg-muted'
        )}
      >
        {isMedal ? (
          <Award className={cn(iconSizeClasses[size], medalStyle?.icon)} />
        ) : (
          <span className="font-bold text-muted-foreground text-[10px]">{position}</span>
        )}
      </div>

      {/* Indicador "Tú" para usuario actual */}
      {isCurrentUser && (
        <div className="absolute -top-1 -left-1 bg-[#0069b4] text-white text-[8px] font-bold px-1 rounded">
          TÚ
        </div>
      )}
    </div>
  )
}
