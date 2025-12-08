import { Suspense } from 'react'
import Link from 'next/link'
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

// ============================================================================
// Componentes de Stats (Wireframe)
// ============================================================================

function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="h-4 w-20 bg-muted rounded animate-pulse mb-2" />
        <div className="h-8 w-16 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}

async function GlobalStats() {
  const stats = await getActasStats()

  // Calcular digitadas: total - porDigitalizar (aproximación)
  // ya que "digitadas" = las que ya tienen digitadoPor o escrutadaEnCne
  const digitadas = stats.total - stats.porDigitalizar

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <FileCheck className="h-4 w-4" />
            <span className="text-xs font-medium">Total Actas</span>
          </div>
          <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Procesadas</span>
          </div>
          <p className="text-2xl font-bold">{digitadas.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium">Validadas</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.validadas.toLocaleString()}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-medium">Discrepancias</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            {stats.conDiscrepancias.toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Componente de Leaderboard (Wireframe)
// ============================================================================

function LeaderboardSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-1" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

async function MiniLeaderboard() {
  const topUsers = await getTopUsuarios(5)

  if (topUsers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        ¡Sé el primero en verificar actas!
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {topUsers.map((user, index) => {
        const position = index + 1
        // Extraer nombre del metadata de OAuth (Google, Facebook, etc.)
        const metadata = user.rawUserMetaData as { full_name?: string; name?: string } | null
        const fullName = metadata?.full_name || metadata?.name || null
        // Mostrar solo el primer nombre
        const displayName = fullName ? fullName.split(' ')[0] : 'Anónimo'

        return (
          <div key={user.usuarioId} className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold ${
                position === 1
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : position === 2
                    ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              {position}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {user.total} actas ({user.actasDigitadas} dig. + {user.actasValidadas} val.)
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// Componente de Stats del Usuario (Wireframe)
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
  const posicion = ranking ?? '-'

  return (
    <div className="flex items-center justify-around py-2">
      <div className="text-center">
        <p className="text-2xl font-bold">{digitadas}</p>
        <p className="text-xs text-muted-foreground">Digitadas</p>
      </div>
      <div className="h-8 w-px bg-border" />
      <div className="text-center">
        <p className="text-2xl font-bold">{validadas}</p>
        <p className="text-xs text-muted-foreground">Validadas</p>
      </div>
      <div className="h-8 w-px bg-border" />
      <div className="text-center">
        <p className="text-2xl font-bold">#{posicion}</p>
        <p className="text-xs text-muted-foreground">Ranking</p>
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
      <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0">
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
    <Card className="bg-gradient-to-br from-[#0069b4] to-[#004a7c] text-white border-0">
      <CardContent className="pt-6 pb-6">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-3">
            <h2 className="font-semibold text-lg">Comienza a verificar</h2>
            <p className="text-sm text-white/80">
              Ayuda a digitalizar y validar las actas electorales de Honduras.
            </p>
            <Button asChild variant="secondary" className="mt-2">
              <Link href="/dashboard/verificar">
                Verificar actas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <FileCheck className="h-12 w-12 text-white/20" />
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
    <div className="space-y-6 py-4 lg:py-6">
      {/* Saludo y CTA principal */}
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">¡Bienvenido!</h1>
          <p className="text-muted-foreground">Tu participación fortalece la democracia.</p>
        </div>

        {/* Desktop: 2-column layout for CTA and User Stats */}
        <div className="grid lg:grid-cols-2 gap-4">
          <Suspense
            fallback={
              <Card className="bg-gradient-to-br from-[#0069b4] to-[#004a7c] text-white border-0">
                <CardContent className="pt-6 pb-6">
                  <div className="h-24 flex items-center justify-center">
                    <div className="h-4 w-32 bg-white/20 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            }
          >
            <MainCTA />
          </Suspense>

          {/* Mi progreso - visible en desktop junto al CTA */}
          <Card className="hidden lg:block">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mi progreso</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="h-16 flex items-center justify-center">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  </div>
                }
              >
                <UserStats />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Mi progreso - solo en móvil */}
      <section className="lg:hidden">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mi progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="h-16 flex items-center justify-center">
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
      <section className="space-y-3">
        <h2 className="font-semibold">Progreso general</h2>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
                Top verificadores
              </CardTitle>
              <Link
                href="/dashboard/leaderboard"
                className="text-sm text-[#0069b4] font-medium hover:underline"
              >
                Ver todo
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
