/**
 * Datos de Departamentos de Honduras
 *
 * Fuente única de verdad para todos los departamentos.
 * Basado en la división política oficial del CNE.
 */

// Los 18 departamentos de Honduras + Exterior (código 20)
export const DEPARTAMENTOS = {
  1: 'Atlántida',
  2: 'Choluteca',
  3: 'Colón',
  4: 'Comayagua',
  5: 'Copán',
  6: 'Cortés',
  7: 'El Paraíso',
  8: 'Francisco Morazán',
  9: 'Gracias a Dios',
  10: 'Intibucá',
  11: 'Islas de la Bahía',
  12: 'La Paz',
  13: 'Lempira',
  14: 'Ocotepeque',
  15: 'Olancho',
  16: 'Santa Bárbara',
  17: 'Valle',
  18: 'Yoro',
  20: 'Exterior', // Código especial para voto en el exterior
} as const

export type CodigoDepartamento = keyof typeof DEPARTAMENTOS

// Array para inserción en base de datos
export const DEPARTAMENTOS_ARRAY = Object.entries(DEPARTAMENTOS).map(([codigo, nombre]) => ({
  codigo: parseInt(codigo),
  nombre,
}))

// Solo los 18 departamentos geográficos (sin Exterior)
export const DEPARTAMENTOS_GEOGRAFICOS = Object.entries(DEPARTAMENTOS)
  .filter(([codigo]) => parseInt(codigo) !== 20)
  .reduce((acc, [codigo, nombre]) => {
    acc[parseInt(codigo) as keyof typeof DEPARTAMENTOS] = nombre
    return acc
  }, {} as Record<number, string>)

/**
 * Mapeo de IDs del paquete @svg-maps/honduras a códigos de departamento
 * Nota: El paquete tiene un typo "francico-morazan" en lugar de "francisco-morazan"
 */
export const SVG_ID_TO_CODIGO: Record<string, number> = {
  'atlantida': 1,
  'choluteca': 2,
  'colon': 3,
  'comayagua': 4,
  'copan': 5,
  'cortes': 6,
  'el-paraiso': 7,
  'francico-morazan': 8, // typo en el paquete
  'gracias-a-dios': 9,
  'intibuca': 10,
  'islas-de-la-bahia': 11,
  'la-paz': 12,
  'lempira': 13,
  'ocotepeque': 14,
  'olancho': 15,
  'santa-barbara': 16,
  'valle': 17,
  'yoro': 18,
}

// Mapeo inverso: código a ID del SVG
export const CODIGO_TO_SVG_ID: Record<number, string> = Object.entries(SVG_ID_TO_CODIGO)
  .reduce((acc, [svgId, codigo]) => {
    acc[codigo] = svgId
    return acc
  }, {} as Record<number, string>)
