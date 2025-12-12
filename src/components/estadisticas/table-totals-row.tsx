import { TableCell, TableRow } from '@/components/ui/table'

interface Totals {
  actasTotales: number
  actasValidadas: number
  votosPn: number
  votosPlh: number
  votosPl: number
  votosOtros: number
}

interface TableTotalsRowProps {
  totals: Totals
}

export function TableTotalsRow({ totals }: TableTotalsRowProps) {
  const porcentaje =
    totals.actasTotales > 0
      ? ((totals.actasValidadas / totals.actasTotales) * 100).toFixed(1)
      : '0.0'
  const votosTotal = totals.votosPn + totals.votosPlh + totals.votosPl + totals.votosOtros

  return (
    <TableRow className="bg-muted/50 font-semibold border-t-2">
      <TableCell />
      <TableCell>Total General</TableCell>
      <TableCell className="text-right tabular-nums">
        {totals.actasValidadas.toLocaleString()}/{totals.actasTotales.toLocaleString()}
      </TableCell>
      <TableCell className="text-right tabular-nums">{porcentaje}%</TableCell>
      <TableCell className="text-right tabular-nums">{totals.votosPn.toLocaleString()}</TableCell>
      <TableCell className="text-right tabular-nums">{totals.votosPlh.toLocaleString()}</TableCell>
      <TableCell className="text-right tabular-nums">{totals.votosPl.toLocaleString()}</TableCell>
      <TableCell className="text-right tabular-nums">
        {totals.votosOtros.toLocaleString()}
      </TableCell>
      <TableCell className="text-right tabular-nums">{votosTotal.toLocaleString()}</TableCell>
    </TableRow>
  )
}
