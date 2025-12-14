import type { NewDepartamento } from '../schema'
import { DEPARTAMENTOS_ARRAY } from '@/lib/data/departamentos'

/**
 * Los 18 departamentos de Honduras + el código para voto en el exterior
 *
 * Importado desde la fuente central de datos.
 * Códigos basados en la división política oficial.
 * Código 20 es usado por el CNE para votos desde el exterior.
 */
export const departamentosHonduras: NewDepartamento[] = DEPARTAMENTOS_ARRAY
