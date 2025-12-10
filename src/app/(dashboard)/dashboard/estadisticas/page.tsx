import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart3, TrendingUp, CheckCircle2, Database } from 'lucide-react'
import {
  getEstadisticasVotos,
  getProgresionVotos,
  COLORES_PARTIDOS,
  type PartidoPrincipal,
} from '@/lib/stats/queries'
import { ProgresionChart } from './progresion-chart'

// Force dynamic - estos datos cambian constantemente
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function EstadisticasPage() {
  return (
    <div className="space-y-6 py-4 lg:py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Estadísticas</h1>
        <p className="text-muted-foreground">
          Comparación de votos: datos oficiales del CNE vs nuestros datos validados
        </p>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsSkeletons />}>
        <StatsContent />
      </Suspense>
    </div>
  )
}

async function StatsContent() {
  const [stats, progresion] = await Promise.all([getEstadisticasVotos(), getProgresionVotos(25)])

  return (
    <>
      {/* Cobertura Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base">Cobertura de Validación</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{stats.cobertura.porcentaje.toFixed(2)}%</span>
            <span className="text-muted-foreground">
              ({stats.cobertura.actasValidadas.toLocaleString()} de{' '}
              {stats.cobertura.actasTotales.toLocaleString()} actas)
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all duration-500"
              style={{ width: `${Math.min(stats.cobertura.porcentaje, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Comparison Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CNE Data */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Datos Oficiales CNE</CardTitle>
                <CardDescription>
                  {stats.cne.actasConDatos.toLocaleString()} actas con datos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <VotosBarChart votosPartidos={stats.cne.votosPartidos} label="CNE" />
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Total: {stats.cne.votosTotales.toLocaleString()} votos
            </p>
          </CardContent>
        </Card>

        {/* Validated Data */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <CardTitle className="text-base">Datos Validados</CardTitle>
                <CardDescription>
                  {stats.validados.actasValidadas.toLocaleString()} actas validadas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats.validados.actasValidadas > 0 ? (
              <>
                <VotosBarChart votosPartidos={stats.validados.votosPartidos} label="Validados" />
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Total: {stats.validados.votosTotales.toLocaleString()} votos
                </p>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Aún no hay actas validadas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progression Chart */}
      {progresion.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#0069b4]" />
              <div>
                <CardTitle className="text-base">Progresión de Porcentajes</CardTitle>
                <CardDescription>
                  Cómo cambian los porcentajes a medida que aumenta la cobertura
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ProgresionChart data={progresion} />
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        Los porcentajes mostrados solo consideran los tres partidos principales (PN, PLH, PL). Los
        datos validados provienen únicamente de actas que han pasado por nuestro proceso de
        validación por consenso.
      </p>
    </>
  )
}

// Componente de barras horizontales para votos
function VotosBarChart({
  votosPartidos,
}: {
  votosPartidos: Array<{ partido: PartidoPrincipal; votos: number; porcentaje: number }>
  label: string
}) {
  // Ordenar por votos descendente
  const sorted = [...votosPartidos].sort((a, b) => b.votos - a.votos)

  return (
    <div className="space-y-4">
      {sorted.map((p) => (
        <div key={p.partido} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{p.partido}</span>
            <span className="text-muted-foreground">
              {p.porcentaje.toFixed(2)}% ({p.votos.toLocaleString()})
            </span>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${p.porcentaje}%`,
                backgroundColor: COLORES_PARTIDOS[p.partido],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

// Skeleton loading
function StatsSkeletons() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="mt-4 h-3 bg-muted animate-pulse rounded-full" />
        </CardContent>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
