import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, MapPin, Building2, Vote, ArrowRight, AlertCircle, BarChart3 } from 'lucide-react'
import { getActaByJrvNumero } from '@/lib/actas/queries'
import { SearchForm } from './search-form'
import Link from 'next/link'
import { ImageViewer } from '@/components/verificar/image-viewer'
import { VotosBarChart } from '@/components/stats/votos-bar-chart'
import type { TodoPartido } from '@/lib/stats/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ jrv?: string }>
}

export default async function BuscarActaPage({ searchParams }: Readonly<PageProps>) {
  const params = await searchParams
  const jrvNumero = params.jrv ? Number.parseInt(params.jrv, 10) : null

  return (
    <div className="space-y-6 py-4 lg:py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Buscar Acta</h1>
        <p className="text-muted-foreground">
          Consulta los datos del CNE y compara con el consenso validado por la comunidad
        </p>
      </div>

      {/* Search Box */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar por Número de JRV
          </CardTitle>
          <CardDescription>Ingresa el número de tu Junta Receptora de Votos</CardDescription>
        </CardHeader>
        <CardContent>
          <SearchForm initialValue={params.jrv || ''} />
        </CardContent>
      </Card>

      {/* Results or Empty State */}
      {jrvNumero ? (
        <Suspense fallback={<ResultsSkeleton />}>
          <ActaResults jrvNumero={jrvNumero} />
        </Suspense>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 lg:py-16 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Busca un acta electoral</h3>
            <p className="text-sm text-muted-foreground">
              Ingresa el número de tu JRV en el cuadro de búsqueda para ver los datos oficiales del
              CNE y el consenso de validación de la comunidad.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to transform acta votes into chart format
function transformVotesToChartData(votos: {
  pn: number | null
  plh: number | null
  pl: number | null
  pinu: number | null
  dc: number | null
  nulos: number | null
  blancos: number | null
}): Array<{ partido: TodoPartido; votos: number; porcentaje: number }> | null {
  // Check if any vote data exists
  if (
    votos.pn === null &&
    votos.plh === null &&
    votos.pl === null &&
    votos.pinu === null &&
    votos.dc === null &&
    votos.nulos === null &&
    votos.blancos === null
  ) {
    return null
  }

  const total =
    (votos.pn || 0) +
    (votos.plh || 0) +
    (votos.pl || 0) +
    (votos.pinu || 0) +
    (votos.dc || 0) +
    (votos.nulos || 0) +
    (votos.blancos || 0)

  if (total === 0) return null

  return [
    {
      partido: 'PN' as TodoPartido,
      votos: votos.pn || 0,
      porcentaje: ((votos.pn || 0) / total) * 100,
    },
    {
      partido: 'PLH' as TodoPartido,
      votos: votos.plh || 0,
      porcentaje: ((votos.plh || 0) / total) * 100,
    },
    {
      partido: 'PL' as TodoPartido,
      votos: votos.pl || 0,
      porcentaje: ((votos.pl || 0) / total) * 100,
    },
    {
      partido: 'PINU' as TodoPartido,
      votos: votos.pinu || 0,
      porcentaje: ((votos.pinu || 0) / total) * 100,
    },
    {
      partido: 'DC' as TodoPartido,
      votos: votos.dc || 0,
      porcentaje: ((votos.dc || 0) / total) * 100,
    },
    {
      partido: 'Nulos' as TodoPartido,
      votos: votos.nulos || 0,
      porcentaje: ((votos.nulos || 0) / total) * 100,
    },
    {
      partido: 'Blancos' as TodoPartido,
      votos: votos.blancos || 0,
      porcentaje: ((votos.blancos || 0) / total) * 100,
    },
  ]
}

async function ActaResults({ jrvNumero }: Readonly<{ jrvNumero: number }>) {
  const acta = await getActaByJrvNumero(jrvNumero)

  if (!acta) {
    return (
      <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
          <h3 className="text-lg font-semibold mb-2">Acta no encontrada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            No se encontró un acta con el número de JRV{' '}
            <span className="font-mono font-bold">{jrvNumero}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Verifica que el número sea correcto e intenta nuevamente.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Transform data for charts
  const cneVotosData = transformVotesToChartData({
    pn: acta.votosPnOficial,
    plh: acta.votosPlhOficial,
    pl: acta.votosPlOficial,
    pinu: acta.votosPinuOficial,
    dc: acta.votosDcOficial,
    nulos: acta.votosNulosOficial,
    blancos: acta.votosBlancosOficial,
  })

  const consensoVotosData = acta.consenso
    ? transformVotesToChartData({
        pn: acta.consenso.pn,
        plh: acta.consenso.plh,
        pl: acta.consenso.pl,
        pinu: acta.consenso.pinu,
        dc: acta.consenso.dc,
        nulos: acta.consenso.nulos,
        blancos: acta.consenso.blancos,
      })
    : null

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Información del Acta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Departamento
              </p>
              <p className="font-mono text-sm font-medium">{acta.departamentoNombre || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Municipio
              </p>
              <p className="font-mono text-sm font-medium">{acta.municipioNombre || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Centro de Votación</p>
              <p className="font-mono text-sm font-medium">{acta.centroVotacionNombre || 'N/A'}</p>
              {acta.centroVotacionDireccion && (
                <p className="text-xs text-muted-foreground">{acta.centroVotacionDireccion}</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">JRV</p>
              <p className="font-mono text-2xl font-bold">{acta.jrvNumero}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Comparison: CNE vs Consensus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CNE Official Data */}
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              Datos del CNE
              {(acta.etiquetasCNE as string[] | null)?.includes('Inconsistencia') && (
                <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                  Inconsistencia
                </span>
              )}
            </CardTitle>
            <CardDescription>Información publicada por el CNE</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {cneVotosData ? (
              <>
                <VotosBarChart votosPartidos={cneVotosData} />
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Total: {acta.votosTotalOficial?.toLocaleString() || 'N/A'} votos
                </p>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No hay datos oficiales disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Consensus Data */}
        {acta.consenso ? (
          <Card className="shadow-sm border-green-200 dark:border-green-900/50">
            <CardHeader className="border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Consenso Validado
                {acta.consenso.hayConsensoCompleto && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
                    Consenso Total
                  </span>
                )}
              </CardTitle>
              <CardDescription>Validado por {acta.cantidadValidaciones} usuarios</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {consensoVotosData ? (
                <>
                  <VotosBarChart votosPartidos={consensoVotosData} />
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Total: {acta.consenso.total?.toLocaleString() || 'N/A'} votos
                  </p>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No hay consenso disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm border-dashed">
            <CardHeader className="border-b border-dashed">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                Consenso Pendiente
              </CardTitle>
              <CardDescription>
                {acta.cantidadValidaciones === 0
                  ? 'Esta acta aún no ha sido validada'
                  : `${acta.cantidadValidaciones} de 3 validaciones completadas`}
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <div className="max-w-sm mx-auto space-y-4">
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Vote className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Necesitamos tu ayuda</h4>
                  <p className="text-sm text-muted-foreground">
                    {`Faltan ${3 - acta.cantidadValidaciones} validaciones para establecer consenso`}
                  </p>
                </div>
                <Button asChild size="lg" className="mt-4">
                  <Link href="/dashboard/verificar">
                    Valida más actas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {/* Image */}
      {acta.imagenUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Imagen del Acta</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageViewer src={acta.imagenUrl} alt={`Acta JRV ${acta.jrvNumero}`} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ResultsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="relative w-full aspect-3/4 max-w-2xl mx-auto bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
