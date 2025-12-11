import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart3, TrendingUp, CheckCircle2, Database } from 'lucide-react'
import {
  getEstadisticasVotos,
  getProgresionVotos,
  getDistribucionZona,
  COLORES_TODOS_PARTIDOS,
  COLORES_PARTIDOS,
  LOGOS_PARTIDOS,
  type TodoPartido,
  type DistribucionZona,
} from '@/lib/stats/queries'
import { Building2, Trees } from 'lucide-react'
import { ProgresionChart } from './progresion-chart'
import Image from 'next/image'

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
  const [stats, progresion, distribucionZona] = await Promise.all([
    getEstadisticasVotos(),
    getProgresionVotos(25),
    getDistribucionZona(),
  ])

  return (
    <>
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
            <VotosBarChart votosPartidos={stats.cne.votosTodosPartidos} />
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
                <VotosBarChart votosPartidos={stats.validados.votosTodosPartidos} />
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

      {/* Urban vs Rural Distribution */}
      {(distribucionZona.urbano.actas > 0 || distribucionZona.rural.actas > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                <Building2 className="h-5 w-5 text-blue-500" />
                <Trees className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-base">Distribución Urbano vs Rural</CardTitle>
                <CardDescription>
                  Comparación de votos por tipo de zona (solo actas validadas)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ZonaDistributionChart data={distribucionZona} />
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center">
        La gráfica de progresión solo considera los tres partidos principales (PN, PLH, PL). Los
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
  votosPartidos: Array<{ partido: TodoPartido; votos: number; porcentaje: number }>
}) {
  // Ordenar por votos descendente
  const sorted = [...votosPartidos].sort((a, b) => b.votos - a.votos)

  return (
    <div className="space-y-4">
      {sorted.map((p) => {
        const logoPath = LOGOS_PARTIDOS[p.partido]
        return (
          <div key={p.partido} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {logoPath ? (
                  <Image
                    src={logoPath}
                    alt={p.partido}
                    width={20}
                    height={20}
                    className="shrink-0 rounded-sm object-contain"
                  />
                ) : (
                  <div
                    className="w-5 h-5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORES_TODOS_PARTIDOS[p.partido] }}
                  />
                )}
                <span className="font-medium">{p.partido}</span>
              </div>
              <span className="text-muted-foreground tabular-nums">
                {p.porcentaje.toFixed(2)}% ({p.votos.toLocaleString()})
              </span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(p.porcentaje, 0.5)}%`,
                  backgroundColor: COLORES_TODOS_PARTIDOS[p.partido],
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Urban vs Rural distribution component
function ZonaDistributionChart({ data }: { data: DistribucionZona }) {
  const partidos = [
    { key: 'pn' as const, name: 'PN', color: COLORES_PARTIDOS.PN, logo: LOGOS_PARTIDOS.PN },
    { key: 'plh' as const, name: 'PLH', color: COLORES_PARTIDOS.PLH, logo: LOGOS_PARTIDOS.PLH },
    { key: 'pl' as const, name: 'PL', color: COLORES_PARTIDOS.PL, logo: LOGOS_PARTIDOS.PL },
  ]

  const totalActas = data.urbano.actas + data.rural.actas

  if (totalActas === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aún no hay datos suficientes para mostrar distribución</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Building2 className="h-6 w-6 mx-auto mb-2 text-blue-500" />
          <p className="text-2xl font-bold">{data.urbano.actas.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Actas Urbanas</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.urbano.votos.total.toLocaleString()} votos
          </p>
        </div>
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <Trees className="h-6 w-6 mx-auto mb-2 text-green-500" />
          <p className="text-2xl font-bold">{data.rural.actas.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Actas Rurales</p>
          <p className="text-xs text-muted-foreground mt-1">
            {data.rural.votos.total.toLocaleString()} votos
          </p>
        </div>
      </div>

      {/* Comparison by party */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Porcentaje por partido</h4>

        <div className="grid gap-4">
          {partidos.map((partido) => {
            const urbanoPercent = data.urbano.porcentajes[partido.key]
            const ruralPercent = data.rural.porcentajes[partido.key]
            const diff = urbanoPercent - ruralPercent

            return (
              <div key={partido.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {partido.logo ? (
                      <Image
                        src={partido.logo}
                        alt={partido.name}
                        width={20}
                        height={20}
                        className="shrink-0 rounded-sm object-contain"
                      />
                    ) : (
                      <div
                        className="w-5 h-5 rounded-full shrink-0"
                        style={{ backgroundColor: partido.color }}
                      />
                    )}
                    <span className="font-medium">{partido.name}</span>
                  </div>
                  {Math.abs(diff) >= 0.5 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        diff > 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {diff > 0 ? '+' : ''}
                      {diff.toFixed(1)}% {diff > 0 ? 'urbano' : 'rural'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Urban bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> Urbano
                      </span>
                      <span className="tabular-nums">{urbanoPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(urbanoPercent, 0.5)}%`,
                          backgroundColor: partido.color,
                          opacity: 0.8,
                        }}
                      />
                    </div>
                  </div>

                  {/* Rural bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Trees className="h-3 w-3" /> Rural
                      </span>
                      <span className="tabular-nums">{ruralPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(ruralPercent, 0.5)}%`,
                          backgroundColor: partido.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
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
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <div key={j} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-muted animate-pulse rounded-full" />
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-2.5 bg-muted animate-pulse rounded-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
