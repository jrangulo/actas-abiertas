/**
 * Tipos para estadísticas electorales
 *
 * Archivo separado para poder importar en componentes cliente
 * sin arrastrar dependencias de servidor (DB)
 */

// Partidos principales para análisis
export const PARTIDOS_PRINCIPALES = ['PN', 'PLH', 'PL'] as const
export type PartidoPrincipal = (typeof PARTIDOS_PRINCIPALES)[number]

// Colores oficiales de los partidos (consistentes con vote-input.tsx)
export const COLORES_PARTIDOS: Record<PartidoPrincipal, string> = {
  PN: '#0047ab', // Partido Nacional - Azul
  PLH: '#c1121f', // Partido Liberal de Honduras - Rojo
  PL: '#8b0000', // Partido Libre - Rojo oscuro/Guinda
}

export interface VotosPartido {
  partido: PartidoPrincipal
  votos: number
  porcentaje: number
}

export interface EstadisticasVotos {
  // Datos del CNE (todas las actas con datos oficiales)
  cne: {
    votosPartidos: VotosPartido[]
    votosTotales: number
    actasConDatos: number
  }
  // Nuestros datos (solo actas validadas)
  validados: {
    votosPartidos: VotosPartido[]
    votosTotales: number
    actasValidadas: number
  }
  // Cobertura
  cobertura: {
    actasTotales: number
    actasValidadas: number
    porcentaje: number
  }
}

export interface PuntoProgresion {
  cobertura: number // Porcentaje de cobertura (0-100)
  actasAcumuladas: number
  porcentajes: Record<PartidoPrincipal, number>
}
