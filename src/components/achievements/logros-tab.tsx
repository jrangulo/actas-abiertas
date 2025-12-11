import { obtenerTodosLogrosConEstado } from '@/lib/achievements/actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogrosTabProps {
  userId: string
}

interface TipoLogroConfig {
  color: string
  borderColor: string
  bgColor: string
  textColor: string
}

interface LogrosSectionProps {
  title: string
  logros: {
    obtenido: boolean
    obtenidoEn: Date | null
    valorAlcanzado: number | null
    id: number
    tipo: 'validaciones_totales' | 'racha_sesion' | 'reportes_totales'
    valorObjetivo: number
    nombre: string
    descripcion: string
    icono: string | null
    orden: number
    creadoEn: Date
  }[]
  label: string
  icon: string
}

const TIPOS_LOGRO: Record<string, TipoLogroConfig> = {
  validaciones_totales: {
    color: 'hsl(var(--primary))',
    borderColor: 'border-primary',
    bgColor: 'bg-primary/10',
    textColor: 'text-foreground',
  },
  racha_sesion: {
    color: 'hsl(var(--primary))',
    borderColor: 'border-primary',
    bgColor: 'bg-primary/10',
    textColor: 'text-foreground',
  },
  reportes_totales: {
    color: 'hsl(var(--primary))',
    borderColor: 'border-primary',
    bgColor: 'bg-primary/10',
    textColor: 'text-foreground',
  },
}

function LogrosSection({ title, logros, label, icon }: LogrosSectionProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {logros.map((logro) => {
          const tipoConfig = TIPOS_LOGRO[logro.tipo]
          const estaBloqueado = !logro.obtenido

          return (
            <Card
              key={logro.id}
              className={cn(
                'relative overflow-hidden border-2',
                logro.obtenido ? tipoConfig.borderColor : 'border-gray-300 opacity-60',
                !logro.obtenido && 'bg-blend-soft-light'
              )}
            >
              <div
                className={cn(
                  'absolute top-0 left-0 right-0 h-1',
                  logro.obtenido ? tipoConfig.bgColor : 'bg-gray-300'
                )}
              />
              <CardHeader className="pb-1 pt-2">
                {estaBloqueado ? (
                  <div className="flex items-center justify-center py-1">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{logro.icono || icon}</span>
                      <CardTitle className="text-sm">{logro.nombre}</CardTitle>
                    </div>
                    {logro.obtenido ? (
                      <Badge variant="default" className="bg-primary text-xs">
                        Obtenido
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          logro.obtenido ? tipoConfig.textColor : 'text-gray-500'
                        )}
                      >
                        Próximo
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="pb-2 pt-0">
                {estaBloqueado ? (
                  <div className="text-center py-1">
                    <p className="text-lg font-bold text-foreground">{logro.valorObjetivo}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ) : (
                  <>
                    <CardDescription className="text-xs">{logro.descripcion}</CardDescription>
                    <p className="text-xs text-muted-foreground mt-1">
                      Objetivo: {logro.valorObjetivo} {label}
                    </p>
                    {logro.obtenido && logro.obtenidoEn && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Obtenido: {new Date(logro.obtenidoEn).toLocaleDateString('es-HN')}
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export async function LogrosTab({ userId }: LogrosTabProps) {
  const logros = await obtenerTodosLogrosConEstado(userId)

  // Agrupar logros por tipo
  const logrosPorTipo = {
    validaciones_totales: logros
      .filter((l) => l.tipo === 'validaciones_totales')
      .sort((a, b) => a.valorObjetivo - b.valorObjetivo),
    racha_sesion: logros
      .filter((l) => l.tipo === 'racha_sesion')
      .sort((a, b) => a.valorObjetivo - b.valorObjetivo),
    reportes_totales: logros
      .filter((l) => l.tipo === 'reportes_totales')
      .sort((a, b) => a.valorObjetivo - b.valorObjetivo),
  }

  const totalObtenidos = logros.filter((l) => l.obtenido).length
  const totalDisponibles = logros.length

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Progreso Total</p>
              <p className="text-2xl font-bold">
                {totalObtenidos} / {totalDisponibles}
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Trophy className="h-8 w-8 text-foreground" />
            </div>
          </div>
          <div className="mt-4 w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(totalObtenidos / totalDisponibles) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <LogrosSection
        title="Validaciones Totales"
        logros={logrosPorTipo.validaciones_totales}
        label="validaciones"
        icon="🏆"
      />

      <LogrosSection
        title="Racha de Sesión"
        logros={logrosPorTipo.racha_sesion}
        label="actas en una sesión"
        icon="🔥"
      />

      <LogrosSection
        title="Reportes"
        logros={logrosPorTipo.reportes_totales}
        label="reportes"
        icon="🚨"
      />
    </div>
  )
}
