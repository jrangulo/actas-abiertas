'use client'

import { Building2, Trees, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ZonaFilter = 'todos' | 'urbano' | 'rural'

interface TableToolbarProps {
  zonaFilter: ZonaFilter
  onZonaFilterChange: (filter: ZonaFilter) => void
  isRefreshing: boolean
  onRefresh: () => void
}

export function TableToolbar({
  zonaFilter,
  onZonaFilterChange,
  isRefreshing,
  onRefresh,
}: TableToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Filtrar por zona:</span>
        <div className="inline-flex rounded-lg border bg-muted/30 p-1">
          <Button
            variant={zonaFilter === 'todos' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-3"
            onClick={() => onZonaFilterChange('todos')}
          >
            Todos
          </Button>
          <Button
            variant={zonaFilter === 'urbano' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-3"
            onClick={() => onZonaFilterChange('urbano')}
          >
            <Building2 className="h-4 w-4 mr-1" />
            Urbano
          </Button>
          <Button
            variant={zonaFilter === 'rural' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-3"
            onClick={() => onZonaFilterChange('rural')}
          >
            <Trees className="h-4 w-4 mr-1" />
            Rural
          </Button>
        </div>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="h-8 px-3"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
        {isRefreshing ? 'Cargando...' : 'Refrescar datos'}
      </Button>
    </div>
  )
}
