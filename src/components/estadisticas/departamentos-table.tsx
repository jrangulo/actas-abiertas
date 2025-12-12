'use client'
'use no memo'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import type { EstadisticasDepartamento } from '@/lib/stats/types'

import { columns } from './columns'
import { ZonaRow } from './zona-row'
import { TableToolbar, type ZonaFilter } from './table-toolbar'
import { TableTotalsRow } from './table-totals-row'

interface DepartamentosTableProps {
  data: EstadisticasDepartamento[]
}

export function DepartamentosTable({ data }: DepartamentosTableProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [expandedDepts, setExpandedDepts] = React.useState<Set<number>>(new Set())
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [zonaFilter, setZonaFilter] = React.useState<ZonaFilter>('todos')

  // Recalcular los totales de departamento basados en el filtro de zona
  const filteredData = React.useMemo(() => {
    if (zonaFilter === 'todos') return data

    return data.map((dept) => {
      // Filtrar municipios y recalcular sus totales
      const municipiosConZonasFiltradas = dept.municipios.map((muni) => {
        const zonasFiltradas = muni.zonas.filter((z) => z.tipoZona === zonaFilter)
        return {
          ...muni,
          zonas: zonasFiltradas,
          actasTotales: zonasFiltradas.reduce((sum, z) => sum + z.actasTotales, 0),
          actasValidadas: zonasFiltradas.reduce((sum, z) => sum + z.actasValidadas, 0),
          votosPn: zonasFiltradas.reduce((sum, z) => sum + z.votosPn, 0),
          votosPlh: zonasFiltradas.reduce((sum, z) => sum + z.votosPlh, 0),
          votosPl: zonasFiltradas.reduce((sum, z) => sum + z.votosPl, 0),
          votosOtros: zonasFiltradas.reduce((sum, z) => sum + z.votosOtros, 0),
        }
      })

      // Recalcular totales del departamento
      return {
        ...dept,
        municipios: municipiosConZonasFiltradas,
        actasTotales: municipiosConZonasFiltradas.reduce((sum, m) => sum + m.actasTotales, 0),
        actasValidadas: municipiosConZonasFiltradas.reduce((sum, m) => sum + m.actasValidadas, 0),
        votosPn: municipiosConZonasFiltradas.reduce((sum, m) => sum + m.votosPn, 0),
        votosPlh: municipiosConZonasFiltradas.reduce((sum, m) => sum + m.votosPlh, 0),
        votosPl: municipiosConZonasFiltradas.reduce((sum, m) => sum + m.votosPl, 0),
        votosOtros: municipiosConZonasFiltradas.reduce((sum, m) => sum + m.votosOtros, 0),
      }
    })
  }, [data, zonaFilter])

  // Calcular totales generales
  const totals = React.useMemo(() => {
    return filteredData.reduce(
      (acc, dept) => ({
        actasTotales: acc.actasTotales + dept.actasTotales,
        actasValidadas: acc.actasValidadas + dept.actasValidadas,
        votosPn: acc.votosPn + dept.votosPn,
        votosPlh: acc.votosPlh + dept.votosPlh,
        votosPl: acc.votosPl + dept.votosPl,
        votosOtros: acc.votosOtros + dept.votosOtros,
      }),
      { actasTotales: 0, actasValidadas: 0, votosPn: 0, votosPlh: 0, votosPl: 0, votosOtros: 0 }
    )
  }, [filteredData])

  const toggleDepartment = (codigo: number) => {
    const newExpanded = new Set(expandedDepts)
    if (newExpanded.has(codigo)) {
      newExpanded.delete(codigo)
    } else {
      newExpanded.add(codigo)
    }
    setExpandedDepts(newExpanded)
  }

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="space-y-4">
      <TableToolbar
        zonaFilter={zonaFilter}
        onZonaFilterChange={setZonaFilter}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className={header.id === 'expand' ? 'w-12' : ''}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => {
                  const dept = row.original
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow data-state={row.getIsSelected() && 'selected'}>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => toggleDepartment(dept.codigo)}
                            disabled={dept.municipios.length === 0}
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                expandedDepts.has(dept.codigo) ? 'rotate-180' : ''
                              } ${dept.municipios.length === 0 ? 'opacity-30' : ''}`}
                            />
                          </Button>
                        </TableCell>
                        {row.getVisibleCells().map((cell) => {
                          if (cell.column.id === 'expand') return null
                          return (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                      {expandedDepts.has(dept.codigo) &&
                        dept.municipios.flatMap((municipio) =>
                          municipio.zonas.map((zona) => (
                            <ZonaRow
                              key={`${municipio.codigo}-${zona.tipoZona}`}
                              municipio={municipio}
                              zona={zona}
                            />
                          ))
                        )}
                    </React.Fragment>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No hay resultados.
                  </TableCell>
                </TableRow>
              )}
              <TableTotalsRow totals={totals} />
            </TableBody>
          </Table>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        *Otros incluye los votos de DC, PINU, nulos y en blanco.
      </p>
    </div>
  )
}
