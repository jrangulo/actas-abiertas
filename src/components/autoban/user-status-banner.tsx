import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info, AlertTriangle, Ban } from 'lucide-react'
import type { EstadoUsuario } from '@/lib/autoban/config'

interface UserStatusBannerProps {
  estado: EstadoUsuario
  porcentajeAcierto: number | undefined
  razonEstado: string | null
}

export function UserStatusBanner({
  estado,
  porcentajeAcierto,
  razonEstado,
}: Readonly<UserStatusBannerProps>) {
  if (estado === 'activo') {
    return null
  }

  const configs = {
    advertido: {
      variant: 'default' as const,
      icon: Info,
      iconColor: 'text-blue-500',
      title: 'Advertencia de Precisión',
      description:
        razonEstado || 'Tu precisión en validaciones está por debajo del umbral recomendado.',
      action: 'Revisá cuidadosamente las actas para mejorar tu precisión.',
    },
    restringido: {
      variant: 'destructive' as const,
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      title: 'Advertencia Final',
      description:
        razonEstado ??
        'Tu precisión está muy baja. Mejorá tus validaciones o tu cuenta será suspendida.',
      action: 'Validá cuidadosamente para evitar la suspensión.',
    },
    baneado: {
      variant: 'destructive' as const,
      icon: Ban,
      iconColor: 'text-destructive',
      title: 'Cuenta Suspendida',
      description:
        razonEstado || 'Tu cuenta ha sido suspendida debido a baja precisión persistente.',
      action: '',
    },
  }

  const config = configs[estado]
  const Icon = config.icon

  return (
    <Alert variant={config.variant} className="mb-6">
      <Icon className={`h-5 w-5 ${config.iconColor}`} />
      <AlertTitle className="font-semibold">{config.title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{config.description}</p>
        {porcentajeAcierto !== null && (
          <p className="text-sm">
            Tu precisión actual: <strong>{porcentajeAcierto}%</strong>
          </p>
        )}
        <p className="text-sm text-muted-foreground">{config.action}</p>
      </AlertDescription>
    </Alert>
  )
}
