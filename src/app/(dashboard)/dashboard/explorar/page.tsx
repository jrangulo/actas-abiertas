import { Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Database,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Filter,
} from 'lucide-react'
import {
  getActasParaExplorar,
  type ExplorarOrderBy,
  type ExplorarFilter,
} from '@/lib/actas/queries'
import { createClient } from '@/lib/supabase/server'
import { FilterForm } from './filter-form'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  searchParams: Promise<{
    pagina?: string
    orden?: string
    filtro?: string
    busqueda?: string
  }>
}

export default async function ExplorarPage({ searchParams }: PageProps) {
  const params = await searchParams
  const pagina = parseInt(params.pagina || '1', 10)
  const orden = (params.orden || 'jrv_asc') as ExplorarOrderBy
  const filtro = (params.filtro || 'todas') as ExplorarFilter
  const busqueda = params.busqueda || ''
  const porPagina = 25

  // Get user for personal filters
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="space-y-6 py-4 lg:py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-2">
          <Database className="h-7 w-7" />
          Explorar Actas
        </h1>
        <p className="text-muted-foreground">
          Audita y explora todas las actas validadas por la comunidad
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros y Ordenamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FilterForm
            initialOrden={orden}
            initialFiltro={filtro}
            initialBusqueda={busqueda}
            isLoggedIn={!!user}
          />
        </CardContent>
      </Card>

      {/* Results */}
      <Suspense fallback={<ListSkeleton />}>
        <ActasList
          pagina={pagina}
          porPagina={porPagina}
          orden={orden}
          filtro={filtro}
          busqueda={busqueda}
          userId={user?.id}
        />
      </Suspense>
    </div>
  )
}

async function ActasList({
  pagina,
  porPagina,
  orden,
  filtro,
  busqueda,
  userId,
}: {
  pagina: number
  porPagina: number
  orden: ExplorarOrderBy
  filtro: ExplorarFilter
  busqueda: string
  userId?: string
}) {
  const { actas, total } = await getActasParaExplorar({
    limite: porPagina,
    offset: (pagina - 1) * porPagina,
    orderBy: orden,
    filter: filtro,
    userId,
    busqueda: busqueda || undefined,
  })

  const totalPaginas = Math.ceil(total / porPagina)

  // Build URL params for pagination
  const buildUrl = (page: number) => {
    const params = new URLSearchParams()
    params.set('pagina', page.toString())
    if (orden !== 'jrv_asc') params.set('orden', orden)
    if (filtro !== 'todas') params.set('filtro', filtro)
    if (busqueda) params.set('busqueda', busqueda)
    return `/dashboard/explorar?${params.toString()}`
  }

  if (actas.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            {busqueda
              ? 'No se encontraron actas con esa búsqueda'
              : 'No se encontraron actas con los filtros seleccionados'}
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
            {total.toLocaleString()} acta{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
          </CardTitle>
          <CardDescription>
            Mostrando {(pagina - 1) * porPagina + 1} - {Math.min(pagina * porPagina, total)} de{' '}
            {total.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Table header */}
          <div className="hidden md:grid md:grid-cols-12 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
            <div className="col-span-1">JRV</div>
            <div className="col-span-2">Ubicación</div>
            <div className="col-span-2 text-center">Estado</div>
            <div className="col-span-2 text-center">CNE</div>
            <div className="col-span-2 text-center">Acuerdo</div>
            <div className="col-span-2 text-center">Confiabilidad</div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          <div className="divide-y">
            {actas.map((acta) => (
              <Link
                key={acta.uuid}
                href={`/dashboard/buscar-acta?jrv=${acta.jrvNumero}`}
                className="block"
              >
                <div className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-4 p-3 hover:bg-muted/50 transition-colors items-center">
                  {/* JRV */}
                  <div className="col-span-1">
                    <span className="font-mono text-sm font-bold">{acta.jrvNumero || 'N/A'}</span>
                  </div>

                  {/* Location */}
                  <div className="col-span-1 md:col-span-2 text-right md:text-left">
                    <p className="text-sm truncate">
                      {acta.departamentoNombre || `Depto. ${acta.departamentoCodigo}`}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {acta.municipioNombre || `Mpio. ${acta.municipioCodigo}`}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="hidden md:block md:col-span-2 text-center">
                    <EstadoBadge estado={acta.estado} cantidadReportes={acta.cantidadReportes} />
                  </div>

                  {/* CNE Inconsistencia */}
                  <div className="hidden md:block md:col-span-2 text-center">
                    {acta.tieneInconsistenciaCNE ? (
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800"
                      >
                        Inconsistencia
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Validations - show agreement ratio */}
                  <div className="col-span-1 md:col-span-2 text-right md:text-center">
                    <div className="flex items-center justify-end md:justify-center gap-1">
                      {acta.cantidadValidaciones > 0 ? (
                        <>
                          <CheckCircle2
                            className={`h-3 w-3 ${
                              acta.cantidadValidacionesCorrectas === acta.cantidadValidaciones
                                ? 'text-green-500'
                                : acta.cantidadValidacionesCorrectas >= 2
                                  ? 'text-blue-500'
                                  : 'text-amber-500'
                            }`}
                          />
                          <span className="text-sm font-medium">
                            {acta.cantidadValidacionesCorrectas}/{acta.cantidadValidaciones}
                          </span>
                          <span className="text-xs text-muted-foreground hidden md:inline">
                            acuerdo
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                      {acta.cantidadReportes > 0 && (
                        <div className="flex items-center gap-1 ml-2">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          <span className="text-sm">{acta.cantidadReportes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reliability */}
                  <div className="hidden md:block md:col-span-2 text-center">
                    <ConfiabilidadBadge score={acta.confiabilidad} />
                  </div>

                  {/* Link */}
                  <div className="hidden md:flex md:col-span-1 justify-end">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-2 flex-wrap">
          {pagina > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildUrl(pagina - 1)}>Anterior</Link>
            </Button>
          )}

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pagina > 2 && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={buildUrl(1)}>1</Link>
                </Button>
                {pagina > 3 && <span className="px-2 text-muted-foreground">...</span>}
              </>
            )}

            {pagina > 1 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={buildUrl(pagina - 1)}>{pagina - 1}</Link>
              </Button>
            )}

            <Button variant="default" size="sm" disabled>
              {pagina}
            </Button>

            {pagina < totalPaginas && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={buildUrl(pagina + 1)}>{pagina + 1}</Link>
              </Button>
            )}

            {pagina < totalPaginas - 1 && (
              <>
                {pagina < totalPaginas - 2 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                <Button variant="ghost" size="sm" asChild>
                  <Link href={buildUrl(totalPaginas)}>{totalPaginas}</Link>
                </Button>
              </>
            )}
          </div>

          {pagina < totalPaginas && (
            <Button variant="outline" size="sm" asChild>
              <Link href={buildUrl(pagina + 1)}>Siguiente</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function EstadoBadge({ estado, cantidadReportes }: { estado: string; cantidadReportes: number }) {
  switch (estado) {
    case 'validada':
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
        >
          Validada
        </Badge>
      )
    case 'bajo_revision':
      return (
        <Badge
          variant="outline"
          className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
        >
          Reportada ({cantidadReportes})
        </Badge>
      )
    case 'con_discrepancia':
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
        >
          Sin Consenso
        </Badge>
      )
    case 'en_validacion':
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
        >
          En Proceso
        </Badge>
      )
    case 'pendiente':
      return (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800"
        >
          Sin Imagen
        </Badge>
      )
    default:
      return <Badge variant="outline">{estado}</Badge>
  }
}

function ConfiabilidadBadge({ score }: { score: number }) {
  let colorClass = ''
  let icon = null

  if (score >= 90) {
    colorClass = 'text-green-600 dark:text-green-400'
    icon = <TrendingUp className="h-3 w-3" />
  } else if (score >= 70) {
    colorClass = 'text-blue-600 dark:text-blue-400'
  } else if (score >= 50) {
    colorClass = 'text-amber-600 dark:text-amber-400'
  } else {
    colorClass = 'text-red-600 dark:text-red-400'
  }

  return (
    <div className={`flex items-center justify-center gap-1 font-medium ${colorClass}`}>
      {icon}
      <span>{score}%</span>
    </div>
  )
}

function ListSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-5 w-48 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent className="space-y-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="flex items-center gap-4 p-3 rounded-lg border">
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
            <div className="flex-1 h-4 bg-muted animate-pulse rounded" />
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
