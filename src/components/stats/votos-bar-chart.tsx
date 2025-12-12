'use client'

import Image from 'next/image'
import { LOGOS_PARTIDOS, COLORES_TODOS_PARTIDOS, type TodoPartido } from '@/lib/stats/types'

interface VotosBarChartProps {
  votosPartidos: Array<{ partido: TodoPartido; votos: number; porcentaje: number }>
}

export function VotosBarChart({ votosPartidos }: Readonly<VotosBarChartProps>) {
  // Ordenar por votos descendente
  const sorted = [...votosPartidos].sort((a, b) => b.votos - a.votos)

  return (
    <div className="space-y-4">
      {sorted.map((p) => {
        const logoPath = LOGOS_PARTIDOS[p.partido]
        return (
          <div key={p.partido} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {logoPath ? (
                  <Image
                    src={logoPath}
                    alt={p.partido}
                    width={20}
                    height={20}
                    className="shrink-0 rounded-sm object-contain"
                  />
                ) : (
                  <div
                    className="w-5 h-5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORES_TODOS_PARTIDOS[p.partido] }}
                  />
                )}
                <span className="font-medium">{p.partido}</span>
              </div>
              <span className="text-muted-foreground tabular-nums">
                {p.porcentaje.toFixed(2)}% ({p.votos.toLocaleString()})
              </span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(p.porcentaje, 0.5)}%`,
                  backgroundColor: COLORES_TODOS_PARTIDOS[p.partido],
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
