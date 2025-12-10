import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FileCheck, CheckSquare, AlertTriangle, Calendar, TrendingUp, Shield } from 'lucide-react'
import { getEstadisticaUsuario, getRankingUsuario } from '@/lib/actas'
import { PrivacyToggle } from './privacy-toggle'

export default async function PerfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userStats = await getEstadisticaUsuario(user?.id || '')
  const rankingUsuario = (await getRankingUsuario(user?.id || '')) || 0

  const initials =
    user?.user_metadata?.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase() ||
    user?.email?.substring(0, 2).toUpperCase() ||
    '??'

  return (
    <div className="space-y-6 py-4 lg:py-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground">Tu información y estadísticas</p>
      </div>

      {/* Desktop: Side-by-side layout */}
      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Info del usuario */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left lg:flex-row lg:gap-4">
              <Avatar className="h-20 w-20 lg:h-16 lg:w-16">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xl lg:text-lg bg-[#0069b4] text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="mt-4 lg:mt-0 flex-1 min-w-0">
                <p className="font-semibold text-lg truncate">
                  {user?.user_metadata?.full_name || 'Usuario'}
                </p>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                {userStats.primeraActividad && (
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-muted-foreground mt-2">
                    <Calendar className="h-4 w-4" />
                    <span>Desde {userStats.primeraActividad.toDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ranking badge */}
            <div className="mt-6 p-4 bg-gradient-to-br from-[#0069b4]/10 to-[#004a7c]/10 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-[#0069b4]" />
                <span className="text-sm font-medium">Tu ranking</span>
              </div>
              <p className="text-3xl font-bold text-[#0069b4]">
                {rankingUsuario ? `#${rankingUsuario}` : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <Card className="mt-6 lg:mt-0 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mis estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <FileCheck className="h-6 w-6 mx-auto mb-2 text-[#0069b4]" />
                <p className="text-3xl font-bold">{userStats.actasDigitadas}</p>
                <p className="text-sm text-muted-foreground">Digitadas</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <CheckSquare className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-3xl font-bold">{userStats.actasValidadas}</p>
                <p className="text-sm text-muted-foreground">Validadas</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                <p className="text-3xl font-bold">{userStats.discrepanciasReportadas}</p>
                <p className="text-sm text-muted-foreground">Reportes</p>
              </div>
            </div>

            {/* Contribución message */}
            <div className="mt-6 p-4 border border-dashed rounded-lg text-center">
              <p className="text-sm">
                <span className="font-semibold">¡Gracias por tu contribución!</span>
                <br />
                <span className="text-muted-foreground">
                  Has verificado{' '}
                  <strong className="text-foreground">
                    {userStats.actasDigitadas + userStats.actasValidadas}
                  </strong>{' '}
                  actas en total.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuración de privacidad */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0069b4]/10">
              <Shield className="h-5 w-5 text-[#0069b4]" />
            </div>
            <div>
              <CardTitle className="text-base">Configuración de Privacidad</CardTitle>
              <CardDescription>Controla cómo apareces en los rankings públicos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PrivacyToggle initialValue={userStats.perfilPrivado ?? false} />
        </CardContent>
      </Card>
    </div>
  )
}
