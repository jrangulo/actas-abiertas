/**
 * Generador de nombres anónimos consistentes
 * Similar a Discord/Slack anonymous names
 * Genera nombres como "Águila Valiente" o "León Azul"
 */

// Animales en español (sustantivos)
const ANIMALES = [
  'Águila',
  'León',
  'Tigre',
  'Oso',
  'Lobo',
  'Halcón',
  'Jaguar',
  'Puma',
  'Cóndor',
  'Búho',
  'Zorro',
  'Delfín',
  'Fénix',
  'Dragón',
  'Pantera',
  'Cuervo',
  'Gavilán',
  'Colibrí',
  'Quetzal',
  'Tucán',
]

// Adjetivos en español
const ADJETIVOS = [
  'Valiente',
  'Audaz',
  'Veloz',
  'Sabio',
  'Noble',
  'Astuto',
  'Sereno',
  'Fuerte',
  'Ágil',
  'Libre',
  'Dorado',
  'Plateado',
  'Azul',
  'Verde',
  'Rojo',
  'Oscuro',
  'Brillante',
  'Silente',
  'Eterno',
  'Fiero',
]

/**
 * Genera un hash numérico simple de un string
 * Consistente: el mismo string siempre produce el mismo número
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convertir a entero de 32 bits
  }
  return Math.abs(hash)
}

/**
 * Genera un nombre anónimo consistente basado en un ID de usuario
 * El mismo userId siempre genera el mismo nombre
 *
 * @param userId - ID único del usuario (UUID)
 * @returns Nombre anónimo como "Águila Valiente"
 */
export function generateAnonName(userId: string): string {
  const hash = hashString(userId)

  // Usar diferentes partes del hash para animal y adjetivo
  const animalIndex = hash % ANIMALES.length
  const adjetivoIndex = Math.floor(hash / ANIMALES.length) % ADJETIVOS.length

  return `${ANIMALES[animalIndex]} ${ADJETIVOS[adjetivoIndex]}`
}

/**
 * Obtiene el índice de color basado en el userId
 * Útil para mantener el color consistente con el nombre
 */
export function getAnonColorIndex(userId: string): number {
  return hashString(userId) % 10
}
