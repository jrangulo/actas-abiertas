'use client'

import { useState, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { togglePrivacidad } from '@/lib/users/actions'
import { cn } from '@/lib/utils'

interface PrivacyToggleProps {
  initialValue: boolean
}

export function PrivacyToggle({ initialValue }: PrivacyToggleProps) {
  const [isPrivate, setIsPrivate] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (checked: boolean) => {
    setIsPrivate(checked)
    startTransition(async () => {
      const result = await togglePrivacidad(checked)
      if (result.error) {
        // Revertir en caso de error
        setIsPrivate(!checked)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-lg transition-colors',
              isPrivate ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-green-100 dark:bg-green-900/30'
            )}
          >
            {isPrivate ? (
              <EyeOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
            )}
          </div>
          <div>
            <Label htmlFor="privacy-mode" className="font-medium cursor-pointer">
              Modo anónimo
            </Label>
            <p className="text-sm text-muted-foreground">
              {isPrivate
                ? 'Tu nombre y foto están ocultos en los rankings'
                : 'Tu nombre y foto son visibles en los rankings'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Switch
            id="privacy-mode"
            checked={isPrivate}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Explicación */}
      <div className="text-sm text-muted-foreground space-y-2 px-1">
        <p>
          <strong>Cuando el modo anónimo está activado:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Tu nombre aparecerá como &quot;Anónimo&quot; en el leaderboard</li>
          <li>Se mostrará un avatar genérico en lugar de tu foto de perfil</li>
          <li>Tus estadísticas seguirán siendo registradas normalmente</li>
          <li>Tu correo electrónico siempre permanece privado</li>
        </ul>
      </div>
    </div>
  )
}
