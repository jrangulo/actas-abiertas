'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapPin, Building2, Trees, Globe } from 'lucide-react'
import { MapaHonduras } from './mapa-honduras'
import type { EstadisticasDepartamento } from '@/lib/stats/types'

type ZonaFilter = 'todos' | 'urbano' | 'rural'

interface MapaContainerClientProps {
  data: EstadisticasDepartamento[]
}

export function MapaContainerClient({ data }: MapaContainerClientProps) {
  const [zonaFilter, setZonaFilter] = useState<ZonaFilter>('todos')

  // Filtrar y recalcular datos basados en el filtro de zona
  const filteredData = useMemo(() => {
    if (zonaFilter === 'todos') return data

    return data.map((dept) => {
      // Si no hay municipios con zonas, devolver datos originales
      const tieneZonas = dept.municipios.some((m) => m.zonas && m.zonas.length > 0)
      if (!tieneZonas) return dept

      // Filtrar zonas en municipios y recalcular totales
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

  // Calcular estadísticas generales
  const estadisticas = useMemo(() => {
    const stats = filteredData.reduce(
      (acc, dept) => {
        acc.totalActas += dept.actasTotales
        acc.actasValidadas += dept.actasValidadas
        acc.votosPn += dept.votosPn
        acc.votosPlh += dept.votosPlh
        acc.votosPl += dept.votosPl
        acc.votosOtros += dept.votosOtros

        // Contar departamentos con datos
        const totalVotosDept = dept.votosPn + dept.votosPlh + dept.votosPl + dept.votosOtros
        if (totalVotosDept > 0) {
          acc.departamentosConDatos += 1
        }

        // Determinar partido ganador por departamento
        const votosPartidos = { PN: dept.votosPn, PLH: dept.votosPlh, PL: dept.votosPl }
        const maxVotos = Math.max(...Object.values(votosPartidos))
        if (maxVotos > 0) {
          const ganador = Object.entries(votosPartidos).find(([, v]) => v === maxVotos)?.[0]
          if (ganador) {
            acc.departamentosPorPartido[ganador] = (acc.departamentosPorPartido[ganador] || 0) + 1
          }
        }

        return acc
      },
      {
        totalActas: 0,
        actasValidadas: 0,
        votosPn: 0,
        votosPlh: 0,
        votosPl: 0,
        votosOtros: 0,
        departamentosConDatos: 0,
        departamentosPorPartido: {} as Record<string, number>,
      }
    )

    // Calcular partido con más departamentos ganados
    let partidoConMasDeptos = '-'
    let deptosGanados = 0

    for (const [partido, cantidad] of Object.entries(stats.departamentosPorPartido)) {
      if (cantidad > deptosGanados) {
        deptosGanados = cantidad
        partidoConMasDeptos = partido
      }
    }

    return { ...stats, partidoConMasDeptos, deptosGanados }
  }, [filteredData])

  const porcentajeProgreso = estadisticas.totalActas > 0
    ? (estadisticas.actasValidadas / estadisticas.totalActas) * 100
    : 0

  const totalVotos = estadisticas.votosPn + estadisticas.votosPlh + estadisticas.votosPl + estadisticas.votosOtros

  return (
    <div className="space-y-6">
      {/* Estadísticas resumidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">{estadisticas.actasValidadas.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Actas Validadas de {estadisticas.totalActas.toLocaleString()}
            </p>
            <div className="text-xs text-muted-foreground mt-1">
              {porcentajeProgreso.toFixed(1)}% completado
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalVotos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total de Votos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{estadisticas.partidoConMasDeptos}</div>
            <p className="text-xs text-muted-foreground">Más Departamentos Ganados</p>
            {estadisticas.deptosGanados > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                {estadisticas.deptosGanados} de 18 departamentos
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{estadisticas.departamentosConDatos}/18</div>
            <p className="text-xs text-muted-foreground">Departamentos con Datos</p>
          </CardContent>
        </Card>
      </div>

      {/* Mapa con filtros */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Mapa Electoral de Honduras
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Resultados por departamento basados en actas validadas
              </p>
            </div>

            {/* Tabs de filtrado por zona */}
            <Tabs value={zonaFilter} onValueChange={(v) => setZonaFilter(v as ZonaFilter)}>
              <TabsList>
                <TabsTrigger value="todos" className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">Todos</span>
                </TabsTrigger>
                <TabsTrigger value="urbano" className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Urbano</span>
                </TabsTrigger>
                <TabsTrigger value="rural" className="flex items-center gap-1.5">
                  <Trees className="h-4 w-4" />
                  <span className="hidden sm:inline">Rural</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <MapaHonduras data={filteredData} />
        </CardContent>
      </Card>
    </div>
  )
}
