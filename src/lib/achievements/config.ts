import type { NewLogro } from '@/db/schema'

/**
 * Configuración de logros del sistema
 * Define todos los logros disponibles con sus valores objetivo
 */
export const ACHIEVEMENTS_CONFIG: Omit<NewLogro, 'id' | 'creadoEn'>[] = [
  // Logros de validaciones totales (10 Logros principales)
  {
    tipo: 'validaciones_totales',
    valorObjetivo: 1,
    nombre: 'El Primer Vistazo',
    descripcion: 'Valida tu primera acta e inicia la participación.',
    icono: '👁️',
    orden: 1,
  },
  {
    tipo: 'validaciones_totales',
    valorObjetivo: 10,
    nombre: 'Doble Dígito',
    descripcion: 'Supera las 10 validaciones iniciales.',
    icono: '🔟',
    orden: 2,
  },
  {
    tipo: 'validaciones_totales',
    valorObjetivo: 50,
    nombre: 'Comprometido',
    descripcion: '50 validaciones completadas. Compromiso demostrado.',
    icono: '✅',
    orden: 3,
  },
  {
    tipo: 'validaciones_totales',
    valorObjetivo: 100,
    nombre: 'Maestro del Escrutinio',
    descripcion: '100 actas validadas. Enfoque de alta precisión.',
    icono: '🔪',
    orden: 4,
  },
  {
    tipo: 'validaciones_totales',
    valorObjetivo: 250,
    nombre: 'La Vara de Medir',
    descripcion: '250 validaciones. Establece el estándar de calidad.',
    icono: '📐',
    orden: 5,
  },
  {
    tipo: 'validaciones_totales',
    valorObjetivo: 500,
    nombre: 'Haciendo Historia',
    descripcion: '¡500 actas! Dejas una marca ineludible.',
    icono: '📜',
    orden: 6,
  },
  {
    tipo: 'validaciones_totales',
    valorObjetivo: 750,
    nombre: 'Héroe de las Actas',
    descripcion: 'Valida 750 actas y salva el conteo.',
    icono: '🦸',
    orden: 7,
  },
  {
    tipo: 'validaciones_totales',
    valorObjetivo: 1000,
    nombre: 'Inmortal del Conteo',
    descripcion: '1,000 actas. Tu leyenda en el sistema es permanente.',
    icono: '🛡️',
    orden: 8,
  },
  {
    tipo: 'validaciones_totales',
    valorObjetivo: 1500,
    nombre: 'Semidiós del Voto',
    descripcion: '7,500 actas. Un paso de la deidad.',
    icono: '✨',
    orden: 9,
  },
  {
    tipo: 'validaciones_totales',
    valorObjetivo: 2500,
    nombre: 'Dios del escrutinio',
    descripcion: '2,500 actas, dedicación divina.',
    icono: '👼',
    orden: 10,
  },

  // Logros de racha en sesión (Nombres divertidos, iconos únicos)
  {
    tipo: 'racha_sesion',
    valorObjetivo: 10,
    nombre: 'Café Cargado',
    descripcion: '10 actas sin levantarte. ¡El café está haciendo efecto!',
    icono: '☕',
    orden: 11,
  },
  {
    tipo: 'racha_sesion',
    valorObjetivo: 20,
    nombre: 'El Filtro Automático',
    descripcion: '20 validaciones seguidas. Mente en modo "piloto automático".',
    icono: '🤖',
    orden: 12,
  },
  {
    tipo: 'racha_sesion',
    valorObjetivo: 30,
    nombre: 'El Flujo del Escrutinio',
    descripcion: '¡30! Estás en la zona donde el tiempo se detiene.',
    icono: '🧘',
    orden: 13,
  },
  {
    tipo: 'racha_sesion',
    valorObjetivo: 40,
    nombre: 'Visión Láser',
    descripcion: '40 actas sin pestañear. ¡Más rápido que el internet!',
    icono: '💥',
    orden: 14,
  },
  {
    tipo: 'racha_sesion',
    valorObjetivo: 50,
    nombre: 'La Máquina del Tipeo',
    descripcion: '50 actas seguidas. ¡Eres más rápido que el CNE!',
    icono: '⌨️',
    orden: 15,
  },

  // Logros de reportes (Iconos únicos, orden reajustado)
  {
    tipo: 'reportes_totales',
    valorObjetivo: 5,
    nombre: 'Vigilante',
    descripcion: 'Reporta 5 problemas de datos.',
    icono: '🚨', // Nuevo icono
    orden: 16, // Ajustado
  },
  {
    tipo: 'reportes_totales',
    valorObjetivo: 10,
    nombre: 'Protector',
    descripcion: 'Reporta 10 problemas con éxito.',
    icono: '👑', // Nuevo icono
    orden: 17, // Ajustado
  },
  {
    tipo: 'reportes_totales',
    valorObjetivo: 20,
    nombre: 'Guardián',
    descripcion: 'Reporta 20 errores. Proteges la base de datos.',
    icono: '🔑', // Nuevo icono
    orden: 18, // Ajustado
  },
  {
    tipo: 'reportes_totales',
    valorObjetivo: 25,
    nombre: 'Defensor',
    descripcion: 'Reporta 25 problemas. Defiendes la integridad cívica.',
    icono: '🎖️', // Nuevo icono
    orden: 19, // Ajustado
  },
]
