'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, X, ArrowUp, ArrowDown } from 'lucide-react'
import type { ExplorarOrderBy, ExplorarFilter } from '@/lib/actas/queries'

interface FilterFormProps {
  initialOrden: ExplorarOrderBy
  initialFiltro: ExplorarFilter
  initialBusqueda: string
  isLoggedIn: boolean
}

// Order categories with their asc/desc variants
type OrderCategory = 'jrv' | 'confiabilidad' | 'reportes' | 'validaciones'

const ORDER_CATEGORIES: { value: OrderCategory; label: string }[] = [
  { value: 'jrv', label: 'Número JRV' },
  { value: 'confiabilidad', label: 'Confiabilidad' },
  { value: 'reportes', label: 'Reportes' },
  { value: 'validaciones', label: 'Validaciones' },
]

function parseOrder(order: ExplorarOrderBy): {
  category: OrderCategory
  direction: 'asc' | 'desc'
} {
  if (order.endsWith('_asc')) {
    return { category: order.replace('_asc', '') as OrderCategory, direction: 'asc' }
  }
  return { category: order.replace('_desc', '') as OrderCategory, direction: 'desc' }
}

function buildOrder(category: OrderCategory, direction: 'asc' | 'desc'): ExplorarOrderBy {
  return `${category}_${direction}` as ExplorarOrderBy
}

const FILTRO_OPTIONS: { value: ExplorarFilter; label: string; requiresAuth?: boolean }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'validadas', label: 'Validadas' },
  { value: 'reportadas', label: 'Reportadas' },
  { value: 'con_discrepancia', label: 'Sin consenso' },
  { value: 'inconsistencia_cne', label: 'Inconsistencia CNE' },
  { value: 'sin_imagen', label: 'Sin imagen' },
  { value: 'mis_validaciones', label: 'Mis validaciones', requiresAuth: true },
  { value: 'mis_reportes', label: 'Mis reportes', requiresAuth: true },
]

export function FilterForm({
  initialOrden,
  initialFiltro,
  initialBusqueda,
  isLoggedIn,
}: FilterFormProps) {
  const router = useRouter()
  const [orden, setOrden] = useState(initialOrden)
  const [filtro, setFiltro] = useState(initialFiltro)
  const [busqueda, setBusqueda] = useState(initialBusqueda)

  const { category: currentCategory, direction: currentDirection } = parseOrder(orden)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters(orden, filtro, busqueda)
  }

  const applyFilters = (
    newOrden: ExplorarOrderBy,
    newFiltro: ExplorarFilter,
    newBusqueda: string
  ) => {
    const params = new URLSearchParams()
    params.set('pagina', '1') // Reset to first page on filter change
    if (newOrden !== 'jrv_asc') params.set('orden', newOrden)
    if (newFiltro !== 'todas') params.set('filtro', newFiltro)
    if (newBusqueda.trim()) params.set('busqueda', newBusqueda.trim())
    router.push(`/dashboard/explorar?${params.toString()}`)
  }

  const handleCategoryClick = (category: OrderCategory) => {
    let newDirection: 'asc' | 'desc'

    if (currentCategory === category) {
      // Toggle direction if same category
      newDirection = currentDirection === 'asc' ? 'desc' : 'asc'
    } else {
      // Default direction for new category
      // For most categories, desc (highest first) makes more sense as default
      // For JRV, asc (lowest first) makes more sense
      newDirection = category === 'jrv' ? 'asc' : 'desc'
    }

    const newOrden = buildOrder(category, newDirection)
    setOrden(newOrden)
    applyFilters(newOrden, filtro, busqueda)
  }

  const handleFiltroChange = (newFiltro: ExplorarFilter) => {
    setFiltro(newFiltro)
    applyFilters(orden, newFiltro, busqueda)
  }

  const clearFilters = () => {
    setOrden('jrv_asc')
    setFiltro('todas')
    setBusqueda('')
    router.push('/dashboard/explorar')
  }

  const hasActiveFilters = orden !== 'jrv_asc' || filtro !== 'todas' || busqueda.trim() !== ''

  return (
    <div className="space-y-4">
      {/* Search */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="busqueda" className="sr-only">
            Buscar por JRV
          </Label>
          <Input
            id="busqueda"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Buscar por número de JRV..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="font-mono"
          />
        </div>
        <Button type="submit" size="default">
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>
      </form>

      {/* Quick filters */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Filtrar por estado</Label>
        <div className="flex flex-wrap gap-2">
          {FILTRO_OPTIONS.map((option) => {
            const isDisabled = option.requiresAuth && !isLoggedIn
            const isActive = filtro === option.value

            return (
              <Button
                key={option.value}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFiltroChange(option.value)}
                disabled={isDisabled}
                className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                title={isDisabled ? 'Inicia sesión para usar este filtro' : undefined}
              >
                {option.label}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Order by */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Ordenar por{' '}
          <span className="text-muted-foreground/60">(clic para cambiar dirección)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {ORDER_CATEGORIES.map((category) => {
            const isActive = currentCategory === category.value
            const DirectionIcon = currentDirection === 'asc' ? ArrowUp : ArrowDown

            return (
              <Button
                key={category.value}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryClick(category.value)}
                className="gap-1"
              >
                {category.label}
                {isActive && <DirectionIcon className="h-3 w-3" />}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <div className="pt-2 border-t">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  )
}
