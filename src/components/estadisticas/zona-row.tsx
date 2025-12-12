import { TableCell, TableRow } from '@/components/ui/table'
import type { EstadisticasMunicipio, EstadisticasZona } from '@/lib/stats/types'

interface ZonaRowProps {
  municipio: EstadisticasMunicipio
  zona: EstadisticasZona
}

export function ZonaRow({ municipio, zona }: ZonaRowProps) {
  const porcentaje =
    zona.actasTotales > 0 ? ((zona.actasValidadas / zona.actasTotales) * 100).toFixed(1) : '0.0'
  const zonaLabel = zona.tipoZona === 'urbano' ? 'Urbano' : 'Rural'

  return (
    <TableRow className="bg-muted/30">
      <TableCell />
      <TableCell className="pl-8 text-sm text-muted-foreground">
        {municipio.nombre} <span className="text-xs opacity-70">({zonaLabel})</span>
      </TableCell>
      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
        {zona.actasValidadas.toLocaleString()}/{zona.actasTotales.toLocaleString()}
      </TableCell>
      <TableCell className="text-right text-sm tabular-nums">{porcentaje}%</TableCell>
      <TableCell className="text-right text-sm tabular-nums">
        {zona.votosPn.toLocaleString()}
      </TableCell>
      <TableCell className="text-right text-sm tabular-nums">
        {zona.votosPlh.toLocaleString()}
      </TableCell>
      <TableCell className="text-right text-sm tabular-nums">
        {zona.votosPl.toLocaleString()}
      </TableCell>
      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
        {zona.votosOtros.toLocaleString()}
      </TableCell>
      <TableCell className="text-right text-sm tabular-nums font-medium">
        {(zona.votosPn + zona.votosPlh + zona.votosPl + zona.votosOtros).toLocaleString()}
      </TableCell>
    </TableRow>
  )
}
