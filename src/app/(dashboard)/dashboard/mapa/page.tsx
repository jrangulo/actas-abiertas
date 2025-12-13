import { Suspense } from 'react'
import { getEstadisticasPorDepartamento } from '@/lib/stats/queries'
import { MapaContainerClient } from '@/components/mapa/mapa-container'

// Force dynamic - estos datos cambian constantemente
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function MapaConDatos() {
  const data = await getEstadisticasPorDepartamento()
  return <MapaContainerClient data={data} />
}

export default function MapaPage() {
  return (
    <div className="space-y-6 py-4 lg:py-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Mapa Electoral de Honduras</h1>
        <p className="text-muted-foreground">
          Visualización geográfica de los resultados electorales por departamento.
          Los colores representan el partido ganador y la intensidad del color indica el porcentaje de victoria.
        </p>
      </div>

      {/* Mapa principal con estadísticas */}
      <Suspense fallback={<MapaSkeleton />}>
        <MapaConDatos />
      </Suspense>
    </div>
  )
}

function MapaSkeleton() {
  return (
    <div className="space-y-6">
      {/* Estadísticas skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border shadow-sm p-4">
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-1/2 animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Mapa skeleton */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
          <div className="h-96 md:h-[500px] bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  )
}
