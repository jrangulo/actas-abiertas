import type { NewDepartamento } from '../schema'

/**
 * Los 18 departamentos de Honduras + el código para voto en el exterior
 *
 * Códigos basados en la división política oficial.
 * Código 20 es usado por el CNE para votos desde el exterior.
 */
export const departamentosHonduras: NewDepartamento[] = [
  { codigo: 1, nombre: 'Atlántida' },
  { codigo: 2, nombre: 'Colón' },
  { codigo: 3, nombre: 'Comayagua' },
  { codigo: 4, nombre: 'Copán' },
  { codigo: 5, nombre: 'Cortés' },
  { codigo: 6, nombre: 'Choluteca' },
  { codigo: 7, nombre: 'El Paraíso' },
  { codigo: 8, nombre: 'Francisco Morazán' },
  { codigo: 9, nombre: 'Gracias a Dios' },
  { codigo: 10, nombre: 'Intibucá' },
  { codigo: 11, nombre: 'Islas de la Bahía' },
  { codigo: 12, nombre: 'La Paz' },
  { codigo: 13, nombre: 'Lempira' },
  { codigo: 14, nombre: 'Ocotepeque' },
  { codigo: 15, nombre: 'Olancho' },
  { codigo: 16, nombre: 'Santa Bárbara' },
  { codigo: 17, nombre: 'Valle' },
  { codigo: 18, nombre: 'Yoro' },
  // Código especial para voto en el exterior
  { codigo: 20, nombre: 'Exterior' },
]
