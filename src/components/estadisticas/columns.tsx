'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import type { EstadisticasDepartamento } from '@/lib/stats/types'

export const columns: ColumnDef<EstadisticasDepartamento>[] = [
  {
    id: 'expand',
    header: '',
    cell: () => null,
    enableSorting: false,
  },
  {
    accessorKey: 'nombre',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 px-2 -ml-2"
      >
        Departamento
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-medium">{row.getValue('nombre')}</span>,
  },
  {
    accessorKey: 'actasValidadas',
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 -mr-2"
        >
          Validadas
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const validadas = row.original.actasValidadas
      const totales = row.original.actasTotales
      return (
        <div className="text-right text-muted-foreground tabular-nums">
          {validadas.toLocaleString()}/{totales.toLocaleString()}
        </div>
      )
    },
  },
  {
    id: 'porcentajeValidadas',
    accessorFn: (row) => (row.actasTotales > 0 ? (row.actasValidadas / row.actasTotales) * 100 : 0),
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 -mr-2"
        >
          %
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const validadas = row.original.actasValidadas
      const totales = row.original.actasTotales
      const porcentaje = totales > 0 ? ((validadas / totales) * 100).toFixed(1) : '0.0'
      return <div className="text-right tabular-nums">{porcentaje}%</div>
    },
  },
  {
    accessorKey: 'votosPn',
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 -mr-2"
        >
          <Image src="/logos-partidos/PNH.png" alt="PN" width={20} height={20} className="mr-1" />
          <span>PN</span>
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {(row.getValue('votosPn') as number).toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: 'votosPlh',
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 -mr-2"
        >
          <Image src="/logos-partidos/PLH.png" alt="PLH" width={20} height={20} className="mr-1" />
          <span>PLH</span>
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {(row.getValue('votosPlh') as number).toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: 'votosPl',
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 -mr-2"
        >
          <Image src="/logos-partidos/PL.png" alt="PL" width={20} height={20} className="mr-1" />
          <span>PL</span>
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {(row.getValue('votosPl') as number).toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: 'votosOtros',
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 -mr-2"
        >
          Otros *
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right tabular-nums text-muted-foreground">
        {(row.getValue('votosOtros') as number).toLocaleString()}
      </div>
    ),
  },
  {
    id: 'votosTotal',
    accessorFn: (row) => row.votosPn + row.votosPlh + row.votosPl + row.votosOtros,
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 -mr-2"
        >
          Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const total =
        row.original.votosPn +
        row.original.votosPlh +
        row.original.votosPl +
        row.original.votosOtros
      return <div className="text-right tabular-nums font-medium">{total.toLocaleString()}</div>
    },
  },
]
