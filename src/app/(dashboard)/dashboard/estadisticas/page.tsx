import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  AlertTriangle,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Database,
  Building2,
  Trees,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  getEstadisticasVotos,
  getProgresionVotos,
  getDistribucionZona,
  getEstadisticasPorDepartamento,
  COLORES_PARTIDOS,
  LOGOS_PARTIDOS,
  type DistribucionZona,
} from '@/lib/stats/queries'
import { ProgresionPorcentajesChart } from './progresion-porcentajes-chart'
import { DepartamentosTable } from '@/components/estadisticas'
import Image from 'next/image'
import { VotosBarChart } from '@/components/stats/votos-bar-chart'

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

      {/* Tabs */}
      <Tabs defaultValue="comparacion" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comparacion">Comparación de Votos</TabsTrigger>
          <TabsTrigger value="departamentos">Departamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="comparacion" className="space-y-6">
          {/* Stats Cards */}
          <Suspense fallback={<StatsSkeletons />}>
            <StatsContent />
          </Suspense>
        </TabsContent>

        <TabsContent value="departamentos" className="space-y-6">
          <Suspense fallback={<DepartamentosTableSkeleton />}>
            <DepartamentosContent />
          </Suspense>
        </TabsContent>
      </Tabs>
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

      {/* Comparisons: CNE vs Validados on same actas + Inconsistencias subset */}
      {(stats.comparacionValidadosVsCne || stats.inconsistenciasValidadas) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {stats.comparacionValidadosVsCne && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  <div>
                    <CardTitle className="text-base">CNE vs Validados (mismas actas)</CardTitle>
                    <CardDescription>
                      Comparación solo entre actas validadas que también tienen datos oficiales del
                      CNE ({stats.comparacionValidadosVsCne.actasComparadas.toLocaleString()} actas)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      Actas donde diferimos con el CNE (PN/PLH/PL)
                    </p>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {stats.comparacionValidadosVsCne.actasComparadas.toLocaleString()} actas
                    </p>
                  </div>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                    {stats.comparacionValidadosVsCne.actasConDiferenciaTop3.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Conteo de actas (sin “Inconsistencia”) donde al menos uno de PN/PLH/PL no
                    coincide entre Validados y CNE.
                  </p>
                </div>

                <ComparacionTop3 tabla={stats.comparacionValidadosVsCne} />
                <p className="text-xs text-muted-foreground">
                  Totales PN/PLH/PL. Diferencia = (validados − CNE). La diferencia en % es en puntos
                  porcentuales.
                </p>
              </CardContent>
            </Card>
          )}

          {stats.inconsistenciasValidadas && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <CardTitle className="text-base">Inconsistencias (CNE) ya validadas</CardTitle>
                    <CardDescription>
                      Actas marcadas como “Inconsistencia” por el CNE, pero validadas por nosotros (
                      {stats.inconsistenciasValidadas.actas.toLocaleString()} actas)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <VotosTop3Bars votosPartidos={stats.inconsistenciasValidadas.votosPartidos} />
                <p className="text-xs text-muted-foreground">
                  Porcentajes calculados dentro del subconjunto de actas con “Inconsistencia”.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
            <ProgresionPorcentajesChart data={progresion} />
            <p className="mt-2 text-xs text-muted-foreground">
              Tip: toca PN/PLH/PL en la leyenda para ocultar/mostrar líneas.
            </p>
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
function VotosTop3Bars({
  votosPartidos,
}: {
  votosPartidos: Array<{ partido: 'PN' | 'PLH' | 'PL'; votos: number; porcentaje: number }>
}) {
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
                    style={{ backgroundColor: COLORES_PARTIDOS[p.partido] }}
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
                  backgroundColor: COLORES_PARTIDOS[p.partido],
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ComparacionTop3({
  tabla,
}: {
  tabla: NonNullable<Awaited<ReturnType<typeof getEstadisticasVotos>>['comparacionValidadosVsCne']>
}) {
  const cneMap = new Map(tabla.cne.votosPartidos.map((v) => [v.partido, v]))
  const valMap = new Map(tabla.validados.votosPartidos.map((v) => [v.partido, v]))

  return (
    <div className="space-y-3">
      {(['PN', 'PLH', 'PL'] as const).map((p) => {
        const cne = cneMap.get(p)!
        const val = valMap.get(p)!
        const diff = tabla.diferencias.find((d) => d.partido === p)!
        const logoPath = LOGOS_PARTIDOS[p]

        return (
          <div key={p} className="rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              {logoPath ? (
                <Image
                  src={logoPath}
                  alt={p}
                  width={20}
                  height={20}
                  className="shrink-0 rounded-sm object-contain"
                />
              ) : (
                <div
                  className="w-5 h-5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORES_PARTIDOS[p] }}
                />
              )}
              <span className="font-semibold">{p}</span>
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                Δ {diff.diferenciaVotos >= 0 ? '+' : ''}
                {diff.diferenciaVotos.toLocaleString()} ·{' '}
                {diff.diferenciaPorcentajePuntos >= 0 ? '+' : ''}
                {diff.diferenciaPorcentajePuntos.toFixed(2)} pp
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5">
                <span className="text-muted-foreground">Validados</span>
                <span className="tabular-nums font-medium">
                  {val.votos.toLocaleString()} ({val.porcentaje.toFixed(2)}%)
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5">
                <span className="text-muted-foreground">CNE</span>
                <span className="tabular-nums font-medium">
                  {cne.votos.toLocaleString()} ({cne.porcentaje.toFixed(2)}%)
                </span>
              </div>
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

async function DepartamentosContent() {
  const departamentosData = await getEstadisticasPorDepartamento()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Estadísticas por Departamento</CardTitle>
        <CardDescription>
          Votos de actas validadas. Haz clic en cualquier departamento para ver sus municipios.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DepartamentosTable data={departamentosData} />
      </CardContent>
    </Card>
  )
}

function DepartamentosTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-72 bg-muted animate-pulse rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <div className="h-10 bg-muted/50" />
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-12 border-t flex items-center gap-4 px-4">
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
