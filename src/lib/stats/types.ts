/**
 * Tipos para estadísticas electorales
 *
 * Archivo separado para poder importar en componentes cliente
 * sin arrastrar dependencias de servidor (DB)
 */

// Partidos principales para análisis (solo 3 para la gráfica de progresión)
export const PARTIDOS_PRINCIPALES = ['PN', 'PLH', 'PL'] as const
export type PartidoPrincipal = (typeof PARTIDOS_PRINCIPALES)[number]

// Todos los partidos para las cards de estadísticas
export const TODOS_PARTIDOS = ['DC', 'PL', 'PINU', 'PLH', 'PN', 'Blancos', 'Nulos'] as const
export type TodoPartido = (typeof TODOS_PARTIDOS)[number]

// Colores oficiales de los partidos (consistentes con vote-input.tsx)
export const COLORES_PARTIDOS: Record<PartidoPrincipal, string> = {
  PN: '#0047ab', // Partido Nacional - Azul
  PLH: '#c1121f', // Partido Liberal de Honduras - Rojo
  PL: '#8b0000', // Partido Libre - Rojo oscuro/Guinda
}

// Colores de todos los partidos incluyendo blancos y nulos
export const COLORES_TODOS_PARTIDOS: Record<TodoPartido, string> = {
  PN: '#0047ab', // Partido Nacional - Azul
  PLH: '#c1121f', // Partido Liberal de Honduras - Rojo
  PL: '#8b0000', // Partido Libre - Rojo oscuro/Guinda
  PINU: '#f97316', // PINU - Naranja
  DC: '#16a34a', // Democracia Cristiana - Verde
  Blancos: '#9ca3af', // Gris claro
  Nulos: '#4b5563', // Gris oscuro
}

// Logos de partidos
export const LOGOS_PARTIDOS: Partial<Record<TodoPartido, string>> = {
  DC: '/logos-partidos/DC.png',
  PL: '/logos-partidos/PL.png',
  PINU: '/logos-partidos/PINU.png',
  PLH: '/logos-partidos/PLH.png',
  PN: '/logos-partidos/PNH.png',
}

export interface VotosPartido {
  partido: PartidoPrincipal
  votos: number
  porcentaje: number
}

export interface VotosTodoPartido {
  partido: TodoPartido
  votos: number
  porcentaje: number
}

export interface EstadisticasVotos {
  // Datos del CNE (todas las actas con datos oficiales)
  cne: {
    votosPartidos: VotosPartido[]
    votosTodosPartidos: VotosTodoPartido[]
    votosTotales: number
    actasConDatos: number
  }
  // Nuestros datos (solo actas validadas)
  validados: {
    votosPartidos: VotosPartido[]
    votosTodosPartidos: VotosTodoPartido[]
    votosTotales: number
    actasValidadas: number
  }
  // Cobertura
  cobertura: {
    actasTotales: number
    // Actas completamente validadas (3+ validaciones con consenso)
    actasValidadas: number
    porcentajeValidadas: number
    // Actas en proceso de validación (1-2 validaciones)
    actasEnValidacion: number
    porcentajeEnValidacion: number
    // Progreso total de validaciones individuales
    validacionesRealizadas: number
    validacionesNecesarias: number
    porcentajeValidaciones: number
  }

  /**
   * Comparación "manzana con manzana":
   * Solo actas que están validadas por nosotros y además tienen datos oficiales del CNE.
   * (Top 3 partidos para consistencia con el resto de la app)
   */
  comparacionValidadosVsCne?: {
    actasComparadas: number
    actasConDiferenciaTop3: number
    // Diagnóstico: actas validadas SIN inconsistencia donde el CNE no trae desglose top-3 (o suma 0)
    // Útil para entender por qué ciertas comparaciones pueden verse raras.
    cneTop3CeroEnValidadasSinInconsistencia: number
    cneTop3CeroPeroTotalOficialPositivoSinInconsistencia: number
    cne: {
      votosPartidos: VotosPartido[]
      totalPartidos: number
    }
    validados: {
      votosPartidos: VotosPartido[]
      totalPartidos: number
    }
    diferencias: Array<{
      partido: PartidoPrincipal
      diferenciaVotos: number // validados - cne
      diferenciaPorcentajePuntos: number // puntos porcentuales (validados% - cne%)
    }>
  }

  /**
   * Subconjunto: actas marcadas como "Inconsistencia" por el CNE pero que ya fueron validadas por nosotros.
   * Mostramos top 3 (votos y % dentro del subconjunto).
   */
  inconsistenciasValidadas?: {
    actas: number
    votosPartidos: VotosPartido[]
    totalPartidos: number
  }
}

export interface PuntoProgresion {
  cobertura: number // Porcentaje de cobertura (0-100)
  actasAcumuladas: number
  porcentajes: Record<PartidoPrincipal, number>
}

export interface PuntoProgresionValores {
  cobertura: number // Porcentaje de cobertura (0-100)
  actasAcumuladas: number
  votos: Record<PartidoPrincipal, number>
}

export interface VotosZona {
  actas: number
  votos: {
    pn: number
    plh: number
    pl: number
    total: number
  }
  porcentajes: {
    pn: number
    plh: number
    pl: number
  }
}

export interface DistribucionZona {
  urbano: VotosZona
  rural: VotosZona
}

/**
 * Estadísticas por departamento para la tabla de departamentos
 */
export interface EstadisticasDepartamento {
  codigo: number
  nombre: string
  actasTotales: number
  actasValidadas: number
  votosPn: number
  votosPlh: number
  votosPl: number
  votosOtros: number // PINU + DC + Blancos + Nulos
  municipios: EstadisticasMunicipio[]
}

export interface EstadisticasMunicipio {
  codigo: number
  nombre: string
  actasTotales: number
  actasValidadas: number
  votosPn: number
  votosPlh: number
  votosPl: number
  votosOtros: number
  zonas: EstadisticasZona[]
}

export interface EstadisticasZona {
  tipoZona: 'urbano' | 'rural'
  actasTotales: number
  actasValidadas: number
  votosPn: number
  votosPlh: number
  votosPl: number
  votosOtros: number
}
