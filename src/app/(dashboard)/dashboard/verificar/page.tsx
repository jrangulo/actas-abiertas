import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckSquare, AlertTriangle, Info } from 'lucide-react'
import { getActasStats, getActaBloqueadaPorUsuario } from '@/lib/actas'
import { createClient } from '@/lib/supabase/server'
import { StartButton } from './start-button'

// Force dynamic rendering - never cache this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface VerificarPageProps {
  searchParams: Promise<{ error?: string; message?: string }>
}

export default async function VerificarPage({ searchParams }: VerificarPageProps) {
  const params = await searchParams
  const error = params.error
  const message = params.message
  const maintenance = process.env.ACTAS_MAINTENANCE === 'true'

  // Verificar si el usuario tiene un acta bloqueada pendiente
  // Si la tiene, redirigir directamente a ella (no puede empezar otra)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const actaPendiente = await getActaBloqueadaPorUsuario(user.id)
    if (actaPendiente && actaPendiente.uuid) {
      // Usuario tiene un acta pendiente - redirigir directamente
      redirect(`/dashboard/verificar/${actaPendiente.uuid}`)
    }
  }

  // Get stats for the cards
  const stats = await getActasStats()
  const porcentajeValidaciones =
    stats.validacionesNecesarias > 0
      ? Math.round((stats.validacionesRealizadas / stats.validacionesNecesarias) * 100)
      : 0

  return (
    <div className="space-y-6 py-4 lg:py-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Verificar Actas</h1>
        <p className="text-muted-foreground">Valida y corrige los datos de las actas electorales</p>
      </div>

      {/* Mensajes de error o estado */}
      {error === 'bloqueada' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            El acta ya está siendo procesada por otro usuario. Intenta con otra.
          </AlertDescription>
        </Alert>
      )}

      {error === 'expirado' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Tu tiempo para trabajar en el acta expiró. Intenta con una nueva.
          </AlertDescription>
        </Alert>
      )}

      {message === 'sin-actas' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No hay más actas disponibles en este momento. ¡Gracias por tu ayuda!
          </AlertDescription>
        </Alert>
      )}

      {(maintenance || message === 'mantenimiento') && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Estamos en mantenimiento y pausamos temporalmente la asignación de nuevas actas mientras
            actualizamos datos. Si ya tenías un acta en proceso, puedes continuar con esa.
          </AlertDescription>
        </Alert>
      )}

      {/* Opción: Validar */}
      <Card className="max-w-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              Validar actas
            </CardTitle>
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-green-600">
                {porcentajeValidaciones}%
              </p>
              <p className="text-xs text-muted-foreground">completado</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <p className="text-sm text-muted-foreground">
            Revisa los valores de una acta y confirma que son correctos, corrige si hay diferencias
            y reporta por adulteración o ilegibilidad.
          </p>
          {/* Validation progress bar */}
          <div className="space-y-1.5">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(porcentajeValidaciones, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.validacionesRealizadas.toLocaleString()} /{' '}
              {stats.validacionesNecesarias.toLocaleString()} validaciones
            </p>
          </div>
          <div className="flex justify-start w-full pt-4">
            <StartButton maintenance={maintenance} />
          </div>
        </CardContent>
      </Card>

      {/* Info sobre el proceso */}
      <Card className="bg-muted/50 border-dashed">
        <CardHeader>
          <CardTitle>¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="lg:flex lg:items-start lg:gap-8">
            <p className="text-sm text-muted-foreground">
              Cada acta necesita ser validada por al menos 3 personas diferentes para garantizar la
              precisión de los datos. Si encuentras errores, puedes corregir los valores.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-muted/50 border-dashed">
        <CardHeader>
          <CardTitle>¿Por qué importa?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="lg:flex lg:items-start lg:gap-8">
            <p className="text-sm text-muted-foreground">
              Tu participación ayuda a crear un registro transparente e independiente de los
              resultados electorales de Honduras.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
