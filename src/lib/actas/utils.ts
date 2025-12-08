/**
 * Utilidades para manejo de actas
 */

// Duración del bloqueo en minutos (exportado para UI)
export const LOCK_DURATION_MINUTES = 10

// Bucket y carpeta de Supabase Storage donde están las imágenes
const ACTAS_BUCKET = 'actas'
const ACTAS_FOLDER = 'presidente'

/**
 * Construye la URL pública de la imagen de un acta
 *
 * Las imágenes están almacenadas en Supabase Storage con el formato:
 * actas/presidente/{cneId}.jpeg
 *
 * Ejemplo: https://xxx.supabase.co/storage/v1/object/public/actas/presidente/01010010100110.jpeg
 *
 * @param cneId - El identificador único del CNE para el acta
 * @returns URL pública de la imagen o null si no hay cneId
 */
export function getActaImageUrl(cneId: string | null): string | null {
  if (!cneId) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL no está configurado')
    return null
  }

  return `${supabaseUrl}/storage/v1/object/public/${ACTAS_BUCKET}/${ACTAS_FOLDER}/${cneId}.jpeg`
}

/**
 * Extrae información geográfica del cneId
 *
 * El cneId parece seguir el formato:
 * DDMMCCCCJJJJNN
 * - DD: Código de departamento (2 dígitos)
 * - MM: Código de municipio (2 dígitos)
 * - CCCC: Código de centro (4 dígitos)
 * - JJJJ: Número de JRV (4 dígitos)
 * - NN: Sufijo adicional (2 dígitos)
 *
 * @param cneId - El identificador único del CNE
 */
export function parseCneId(cneId: string): {
  departamento: string
  municipio: string
  centro: string
  jrv: string
  raw: string
} | null {
  if (!cneId || cneId.length < 10) return null

  // El formato puede variar, así que hacemos parsing básico
  return {
    departamento: cneId.substring(0, 2),
    municipio: cneId.substring(2, 4),
    centro: cneId.substring(4, 8),
    jrv: cneId.substring(8, 12),
    raw: cneId,
  }
}
