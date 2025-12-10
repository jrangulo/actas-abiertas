import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, MessageSquare, ExternalLink, Search } from 'lucide-react'
import { getActasConDiscrepancias, getEstadisticasDiscrepancias } from '@/lib/discrepancias/queries'
import { SearchForm } from './search-form'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ busqueda?: string; pagina?: string }>
}

export default async function DiscrepanciasPage({ searchParams }: PageProps) {
  const params = await searchParams
  const busqueda = params.busqueda || ''
  const pagina = parseInt(params.pagina || '1', 10)
  const porPagina = 20

  return (
    <div className="space-y-6 py-4 lg:py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Actas en Revisión</h1>
        <p className="text-muted-foreground">
          Actas reportadas por usuarios que necesitan revisión manual
        </p>
      </div>

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsCards />
      </Suspense>

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar Actas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SearchForm initialValue={busqueda} />
        </CardContent>
      </Card>

      {/* List */}
      <Suspense fallback={<ListSkeleton />}>
        <ActasList busqueda={busqueda} pagina={pagina} porPagina={porPagina} />
      </Suspense>
    </div>
  )
}

async function StatsCards() {
  const stats = await getEstadisticasDiscrepancias()

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-amber-600">{stats.actasBajoRevision}</div>
          <p className="text-xs text-muted-foreground">Bajo Revisión</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-red-600">{stats.actasConDiscrepancia}</div>
          <p className="text-xs text-muted-foreground">Sin Consenso</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{stats.totalReportes}</div>
          <p className="text-xs text-muted-foreground">Reportes Totales</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-green-600">{stats.reportesResueltos}</div>
          <p className="text-xs text-muted-foreground">Resueltos</p>
        </CardContent>
      </Card>
    </div>
  )
}

async function ActasList({
  busqueda,
  pagina,
  porPagina,
}: {
  busqueda: string
  pagina: number
  porPagina: number
}) {
  const { actas, total } = await getActasConDiscrepancias({
    limite: porPagina,
    offset: (pagina - 1) * porPagina,
    busqueda: busqueda || undefined,
  })

  const totalPaginas = Math.ceil(total / porPagina)

  if (actas.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            {busqueda
              ? 'No se encontraron actas con esa búsqueda'
              : '¡Excelente! No hay actas pendientes de revisión'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {total} acta{total !== 1 ? 's' : ''} en revisión
          </CardTitle>
          <CardDescription>Haz clic en una acta para ver detalles y discutir</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {actas.map((acta) => (
            <Link key={acta.uuid} href={`/dashboard/discrepancias/${acta.uuid}`} className="block">
              <div className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                {/* Status indicator */}
                <div
                  className={`w-2 h-2 rounded-full ${
                    acta.estado === 'bajo_revision' ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">
                      {acta.jrvNumero || acta.cneId || 'Sin ID'}
                    </span>
                    {acta.estado === 'bajo_revision' && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
                        Reportada
                      </span>
                    )}
                    {acta.estado === 'con_discrepancia' && (
                      <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">
                        Sin Consenso
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {acta.departamentoCodigo && acta.municipioCodigo
                      ? `Depto. ${acta.departamentoCodigo} · Mpio. ${acta.municipioCodigo}`
                      : 'Ubicación desconocida'}
                  </p>
                </div>

                {/* Counts */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{acta.cantidadReportes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{acta.cantidadComentarios}</span>
                  </div>
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPaginas > 1 && (
        <div className="flex justify-center gap-2">
          {pagina > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/dashboard/discrepancias?pagina=${pagina - 1}${busqueda ? `&busqueda=${busqueda}` : ''}`}
              >
                Anterior
              </Link>
            </Button>
          )}
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Página {pagina} de {totalPaginas}
          </span>
          {pagina < totalPaginas && (
            <Button variant="outline" size="sm" asChild>
              <Link
                href={`/dashboard/discrepancias?pagina=${pagina + 1}${busqueda ? `&busqueda=${busqueda}` : ''}`}
              >
                Siguiente
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <div className="h-8 w-12 bg-muted animate-pulse rounded" />
            <div className="h-3 w-20 bg-muted animate-pulse rounded mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
            <div className="w-2 h-2 bg-muted animate-pulse rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-48 bg-muted animate-pulse rounded" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
