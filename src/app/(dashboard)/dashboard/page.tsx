import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FileCheck,
  Users,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  ArrowRight,
  Clock,
  TrendingUp,
  User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  getActaBloqueadaPorUsuario,
  getActasStats,
  getTopUsuarios,
  getEstadisticaUsuario,
  getRankingUsuario,
} from '@/lib/actas'
import { PendingTimer } from './pending-timer'
import { cn } from '@/lib/utils'
import { PositionBadge } from '@/components/leaderboard/PositionBadge'
import { getUserName } from '@/lib/users/utils'

// ============================================================================
// Componentes de Stats
// ============================================================================

function StatsCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="h-4 w-24 bg-muted rounded animate-pulse mb-3" />
        <div className="h-10 w-20 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}

async function GlobalStats() {
  const stats = await getActasStats()

  // Calcular porcentaje de progreso de actas completamente validadas
  const porcentajeValidadas =
    stats.total > 0 ? Math.round((stats.validadas / stats.total) * 100) : 0

  // Calcular progreso de validaciones individuales
  const porcentajeValidaciones =
    stats.validacionesNecesarias > 0
      ? Math.round((stats.validacionesRealizadas / stats.validacionesNecesarias) * 100)
      : 0

  const statsData = [
    {
      label: 'Total Actas',
      value: stats.total,
      icon: FileCheck,
      iconColor: 'text-muted-foreground',
      valueColor: 'text-foreground',
    },
    {
      label: 'Procesadas',
      value: stats.procesadas,
      icon: Users,
      iconColor: 'text-blue-500',
      valueColor: 'text-foreground',
    },
    {
      label: 'Discrepancias',
      value: stats.conDiscrepancias,
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      valueColor: 'text-amber-600 dark:text-amber-400',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <Card key={stat.label} className="overflow-hidden shadow-sm">
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3">
                <stat.icon className={cn('h-5 w-5', stat.iconColor)} />
                <span className="text-sm font-semibold text-muted-foreground">{stat.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className={cn('text-3xl lg:text-4xl font-bold tracking-tight', stat.valueColor)}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Validadas card with progress bar */}
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-5 lg:p-6">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm font-semibold text-muted-foreground">Validadas</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <p className="text-3xl lg:text-4xl font-bold tracking-tight text-green-600 dark:text-green-400">
                {stats.validadas.toLocaleString()}
              </p>
              <span className="text-sm font-medium text-muted-foreground">
                ({porcentajeValidadas}%)
              </span>
            </div>
            {/* Progress bar for individual validations */}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================================
// Componente de Leaderboard
// ============================================================================

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-28 bg-muted rounded animate-pulse mb-2" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

async function MiniLeaderboard() {
  const topUsuarios = await getTopUsuarios(3)
  if (topUsuarios.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">¡Sé el primero en verificar actas!</p>
      </div>
    )
  }

  const leaderboardData = topUsuarios.map((user, index) => ({
    position: index + 1,
    usuarioId: user.usuarioId,
    nombre: getUserName(user.rawUserMetaData),
    actasDigitadas: user.actasDigitadas || 0,
    actasValidadas: user.actasValidadas || 0,
  }))

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }
  // Verificar si el usuario actual está en el top 10
  let currentUserEntry = null
  let showEllipsis = false
  const userInTop = leaderboardData.find((u) => u.usuarioId === user?.id)

  if (!userInTop) {
    // El usuario no está en el top, obtener su ranking y estadísticas
    const userRanking = await getRankingUsuario(user?.id || '')

    if (userRanking && userRanking > 3) {
      const userStats = await getEstadisticaUsuario(user?.id || '')
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (userStats && authUser) {
        currentUserEntry = {
          position: userRanking,
          userId: user?.id || '',
          name: getUserName(authUser.user_metadata),
          digitadas: userStats.actasDigitadas || 0,
          validadas: userStats.actasValidadas || 0,
        }
        showEllipsis = true
      }
    }
  }

  return (
    <>
      {leaderboardData.map((user) => (
        <div
          key={user.position}
          className="flex items-center gap-3 px-3 py-2 border-b last:border-0"
        >
          <PositionBadge position={user.position} />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user.nombre}</p>
            <p className="text-xs text-muted-foreground">
              {user.actasDigitadas} digitadas · {user.actasValidadas} validadas
            </p>
          </div>
          <div
            className={`text-center rounded-full  ${
              user.position === 1
                ? 'bg-yellow-600'
                : user.position === 2
                  ? 'bg-gray-600'
                  : 'bg-amber-600'
            } px-4`}
          >
            <p className="font-bold">{user.actasDigitadas + user.actasValidadas}</p>
            <p className="text-xs text-stone-200">total</p>
          </div>
        </div>
      ))}

      {/* Mostrar puntos suspensivos si el usuario no está en el top 10 */}
      {showEllipsis && currentUserEntry && (
        <>
          <div className="flex items-center justify-center py-2">
            <span className="text-2xl text-muted-foreground">⋯</span>
          </div>
          <div className="flex items-center gap-3 py-2 bg-primary/5 rounded-lg px-3 border-2 border-primary/20">
            <PositionBadge position={currentUserEntry.position} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {currentUserEntry.name} <span className="text-xs text-muted-foreground">(Tú)</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {currentUserEntry.digitadas} digitadas · {currentUserEntry.validadas} validadas
              </p>
            </div>
            <div className="text-center rounded-full bg-muted px-4">
              <p className="font-bold">{currentUserEntry.digitadas + currentUserEntry.validadas}</p>
              <p className="text-xs text-muted-foreground">total</p>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ============================================================================
// Componente de Stats del Usuario
// ============================================================================

async function UserStats() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const [stats, ranking] = await Promise.all([
    getEstadisticaUsuario(user.id),
    getRankingUsuario(user.id),
  ])

  const digitadas = stats?.actasDigitadas ?? 0
  const validadas = stats?.actasValidadas ?? 0
  const total = digitadas + validadas
  const hasContributed = total > 0

  return (
    <div className="grid grid-cols-3 gap-4 py-3">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-1">
          <FileCheck className="h-5 w-5 text-blue-600" />
        </div>
        <p className="text-2xl lg:text-3xl font-bold">{digitadas}</p>
        <p className="text-xs text-muted-foreground font-medium">Digitadas</p>
      </div>

      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 mb-1">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        </div>
        <p className="text-2xl lg:text-3xl font-bold">{validadas}</p>
        <p className="text-xs text-muted-foreground font-medium">Validadas</p>
      </div>

      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-1">
          <TrendingUp className="h-5 w-5 text-amber-600" />
        </div>
        <p className="text-2xl lg:text-3xl font-bold">{hasContributed ? `#${ranking}` : '-'}</p>
        <p className="text-xs text-muted-foreground font-medium">Ranking</p>
      </div>
    </div>
  )
}

// ============================================================================
// Componente de CTA con estado de acta pendiente
// ============================================================================

async function MainCTA() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let actaPendiente = null
  if (user) {
    actaPendiente = await getActaBloqueadaPorUsuario(user.id)
  }

  // Si hay un acta pendiente, mostrar advertencia
  if (actaPendiente) {
    return (
      <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg shadow-amber-500/20">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Tienes un acta pendiente</h2>
              </div>
              <p className="text-sm text-white/90">
                Debes completar o liberar el acta que tienes en proceso antes de continuar.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <Button asChild variant="secondary" className="mt-2">
                  <Link href={`/dashboard/verificar/${actaPendiente.uuid}`}>
                    Continuar acta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                {actaPendiente.bloqueadoHasta && (
                  <PendingTimer bloqueadoHasta={actaPendiente.bloqueadoHasta} />
                )}
              </div>
            </div>
            <Clock className="h-12 w-12 text-white/20" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // CTA normal
  return (
    <Card className="bg-linear-to-br from-[#0069b4] to-[#004a7c] text-white border-0 shadow-lg shadow-blue-500/20">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-3">
            <h2 className="font-semibold text-xl">Comienza a verificar</h2>
            <p className="text-sm text-white/80">
              Ayuda a digitalizar y validar las actas electorales de Honduras.
            </p>
            <Button asChild variant="secondary" className="mt-2 font-semibold">
              <Link href="/dashboard/verificar">
                Verificar actas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <FileCheck className="h-14 w-14 text-white" />
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Página Principal del Dashboard
// ============================================================================

export default function DashboardPage() {
  return (
    <div className="space-y-8 py-4 lg:py-8">
      {/* Saludo y CTA principal */}
      <section className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-4xl font-bold tracking-tight">¡Bienvenido!</h1>
          <p className="text-muted-foreground text-lg mt-1">
            Tu participación fortalece la democracia.
          </p>
        </div>

        {/* Desktop: 2-column layout for CTA and User Stats */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Suspense
            fallback={
              <Card className="bg-gradient-to-br from-[#0069b4] to-[#004a7c] text-white border-0">
                <CardContent className="pt-6 pb-6">
                  <div className="h-28 flex items-center justify-center">
                    <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            }
          >
            <MainCTA />
          </Suspense>

          {/* Mi progreso - visible en desktop junto al CTA */}
          <Card className="hidden lg:flex lg:flex-col shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                Mi progreso
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center">
              <Suspense
                fallback={
                  <div className="w-full h-20 flex items-center justify-center">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  </div>
                }
              >
                <div className="w-full">
                  <UserStats />
                </div>
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Mi progreso - solo en móvil */}
      <section className="lg:hidden">
        <Card className="shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Mi progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="h-20 flex items-center justify-center">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                </div>
              }
            >
              <UserStats />
            </Suspense>
          </CardContent>
        </Card>
      </section>

      {/* Estadísticas globales */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Progreso general</h2>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <StatsCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <GlobalStats />
        </Suspense>
      </section>

      {/* Mini Leaderboard */}
      <section>
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Top verificadores
              </CardTitle>
              <Link
                href="/dashboard/leaderboard"
                className="text-sm text-[#0069b4] font-semibold hover:underline"
              >
                Ver todo →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<LeaderboardSkeleton />}>
              <MiniLeaderboard />
            </Suspense>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
