'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MapPin, FileText, Users, TrendingUp } from 'lucide-react'
import { COLORES_TODOS_PARTIDOS } from '@/lib/stats/types'
import type { EstadisticasDepartamento } from '@/lib/stats/types'

interface DepartamentoConGanador extends EstadisticasDepartamento {
  partidoGanador: 'PN' | 'PLH' | 'PL' | 'PINU' | 'DC' | null
  porcentajeGanador: number
  totalVotos: number
}

interface DepartamentoModalProps {
  departamento: DepartamentoConGanador
  isOpen: boolean
  onClose: () => void
}

export function DepartamentoModal({ departamento, isOpen, onClose }: DepartamentoModalProps) {
  const porcentajeProgreso = departamento.actasTotales > 0
    ? (departamento.actasValidadas / departamento.actasTotales) * 100
    : 0

  const actasRestantes = departamento.actasTotales - departamento.actasValidadas

  // Calcular porcentajes de votos
  const totalVotos = departamento.totalVotos
  const porcentajesVotos = totalVotos > 0 ? {
    PN: (departamento.votosPn / totalVotos) * 100,
    PLH: (departamento.votosPlh / totalVotos) * 100,
    PL: (departamento.votosPl / totalVotos) * 100,
    Otros: (departamento.votosOtros / totalVotos) * 100,
  } : {
    PN: 0, PLH: 0, PL: 0, Otros: 0
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {departamento.nombre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progreso de validación */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Progreso de Validación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Actas validadas: {departamento.actasValidadas.toLocaleString()}</span>
                <span>Total: {departamento.actasTotales.toLocaleString()}</span>
              </div>
              <Progress value={porcentajeProgreso} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{porcentajeProgreso.toFixed(1)}% completado</span>
                <span className="text-amber-600">{actasRestantes.toLocaleString()} restantes</span>
              </div>
            </CardContent>
          </Card>

          {/* Resultados por partido */}
          {totalVotos > 0 ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  Resultados por Partido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Partidos principales */}
                <div className="space-y-3">
                  {Object.entries({
                    PN: { votos: departamento.votosPn, porcentaje: porcentajesVotos.PN, color: COLORES_TODOS_PARTIDOS.PN },
                    PLH: { votos: departamento.votosPlh, porcentaje: porcentajesVotos.PLH, color: COLORES_TODOS_PARTIDOS.PLH },
                    PL: { votos: departamento.votosPl, porcentaje: porcentajesVotos.PL, color: COLORES_TODOS_PARTIDOS.PL },
                  })
                    .sort((a, b) => b[1].votos - a[1].votos)
                    .map(([partido, data]) => (
                      <div key={partido} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: data.color }}
                            />
                            <span className="font-medium text-sm">{partido}</span>
                            {departamento.partidoGanador === partido && (
                              <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                                Ganando
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-sm">
                              {data.votos.toLocaleString()} votos
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {data.porcentaje.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-300 ease-in-out"
                              style={{
                                width: `${data.porcentaje}%`,
                                backgroundColor: data.color
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Otros votos (PINU, DC, Nulos, Blancos combinados) */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Otros Votos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORES_TODOS_PARTIDOS.Nulos }}
                        />
                        <span className="text-sm text-muted-foreground">Otros (PINU, DC, Nulos, Blancos)</span>
                      </div>
                      <span className="text-sm font-medium">{departamento.votosOtros.toLocaleString()}</span>
                    </div>
                    <div className="relative">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300 ease-in-out"
                          style={{
                            width: `${porcentajesVotos.Otros}%`,
                            backgroundColor: COLORES_TODOS_PARTIDOS.Nulos
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {porcentajesVotos.Otros.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Total de Votos
                    </span>
                    <span className="font-bold text-lg">
                      {totalVotos.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  No hay resultados disponibles para este departamento
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Se mostrarán los datos una vez que las actas sean validadas
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
