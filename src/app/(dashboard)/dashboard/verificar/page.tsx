import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PenLine, CheckSquare, AlertTriangle, Info } from 'lucide-react'
import { getActasStats, getActaBloqueadaPorUsuario } from '@/lib/actas'
import { createClient } from '@/lib/supabase/server'
import { StartButton } from './start-button'

interface VerificarPageProps {
  searchParams: Promise<{ error?: string; message?: string }>
}

export default async function VerificarPage({ searchParams }: VerificarPageProps) {
  const params = await searchParams
  const error = params.error
  const message = params.message

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
        <p className="text-muted-foreground">Elige cómo quieres contribuir</p>
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

      {/* Desktop: Side-by-side cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Opción: Digitalizar */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <PenLine className="h-5 w-5 text-[#0069b4]" />
                Digitalizar acta
              </CardTitle>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums text-[#0069b4]">
                  {stats.porDigitalizar.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">pendientes</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground flex-1">
              Transcribe los datos de un acta que aún no ha sido procesada. Serás el primero en
              ingresar los valores.
            </p>
            <StartButton modo="digitalizar" />
          </CardContent>
        </Card>

        {/* Opción: Validar */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-green-600" />
                Validar acta
              </CardTitle>
              <div className="text-right">
                <p className="text-2xl font-bold tabular-nums text-green-600">
                  {porcentajeValidaciones}%
                </p>
                <p className="text-xs text-muted-foreground">completado</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground">
              Revisa un acta que ya tiene valores y confirma que son correctos o reporta
              diferencias.
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
            <StartButton modo="validar" />
          </CardContent>
        </Card>
      </div>

      {/* Info sobre el proceso */}
      <Card className="bg-muted/50 border-dashed">
        <CardContent className="pt-6">
          <div className="lg:flex lg:items-start lg:gap-8">
            <div className="flex-1">
              <h3 className="font-semibold mb-2">¿Cómo funciona?</h3>
              <p className="text-sm text-muted-foreground">
                Cada acta necesita ser digitalizada una vez y validada por al menos 3 personas
                diferentes para garantizar la precisión de los datos.
              </p>
            </div>
            <div className="mt-4 lg:mt-0 lg:flex-1">
              <h3 className="font-semibold mb-2">¿Por qué importa?</h3>
              <p className="text-sm text-muted-foreground">
                Tu participación ayuda a crear un registro transparente e independiente de los
                resultados electorales de Honduras.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
