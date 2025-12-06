import type { NewCentroVotacion, TipoZona } from '../schema'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

/**
 * Interfaz para la estructura de los archivos JSON de puestos
 */
interface PuestoJSON {
  puesto: string
  id_puesto: string
}

/**
 * Parsea el nombre del archivo para extraer departamento, municipio y tipo de zona
 * Formato esperado: puestos_DD_MMM_TZ.json
 * Ejemplo: puestos_01_001_01.json
 */
function parsearNombreArchivo(filename: string): {
  departamentoCodigo: number
  municipioCodigo: number
  tipoZona: TipoZona
} | null {
  const match = filename.match(/^puestos_(\d{2})_(\d{3})_(\d{2})\.json$/)

  if (!match) {
    console.warn(`⚠️  Archivo ignorado (formato inválido): ${filename}`)
    return null
  }

  const [, depStr, munStr, zonaStr] = match

  const departamentoCodigo = parseInt(depStr, 10)
  const municipioCodigo = parseInt(munStr, 10)
  const zonaCode = parseInt(zonaStr, 10)

  // 01 = urbano, 02 = rural
  const tipoZona: TipoZona = zonaCode === 1 ? 'urbano' : 'rural'

  return {
    departamentoCodigo,
    municipioCodigo,
    tipoZona,
  }
}

/**
 * Carga y procesa todos los archivos JSON de centros de votación
 * Retorna un array de NewCentroVotacion listo para insertar
 */
function cargarCentrosDesdeArchivos(directorioBase: string): NewCentroVotacion[] {
  const centrosVotacion: NewCentroVotacion[] = []

  try {
    // Leer todos los archivos JSON del directorio
    const archivos = readdirSync(directorioBase).filter((file) => file.endsWith('.json'))

    for (const archivo of archivos) {
      // Parsear metadatos del nombre del archivo
      const metadatos = parsearNombreArchivo(archivo)

      if (!metadatos) {
        continue
      }

      const { departamentoCodigo, municipioCodigo, tipoZona } = metadatos

      try {
        // Leer y parsear el archivo JSON
        const rutaCompleta = join(directorioBase, archivo)
        const contenido = readFileSync(rutaCompleta, 'utf-8')
        const puestos: PuestoJSON[] = JSON.parse(contenido)

        if (!Array.isArray(puestos)) {
          console.error(`❌ Error en ${archivo}: El contenido no es un array`)
          continue
        }

        // Transformar cada puesto a NewCentroVotacion
        for (const puesto of puestos) {
          // Extraer el nombre del centro y la dirección
          const [direccion, nombre] = puesto.puesto.split(' - ')

          centrosVotacion.push({
            departamentoCodigo,
            municipioCodigo,
            codigo: parseInt(puesto.id_puesto, 10),
            nombre: nombre.trim(),
            direccion: direccion?.trim() || null,
            tipoZona,
          })
        }
      } catch (error) {
        console.error(`❌ Error procesando ${archivo}:`, error)
      }
    }
  } catch (error) {
    console.error('❌ Error leyendo directorio:', error)
    throw error
  }

  return centrosVotacion
}

/**
 * Array de todos los centros de votación de Honduras
 * Cargados desde archivos JSON en src/db/seed/datos/centros/
 */
export const centrosVotacionHonduras: NewCentroVotacion[] = cargarCentrosDesdeArchivos(
  join(__dirname, 'datos', 'centros')
)
