import {
  pgTable,
  pgSchema,
  pgEnum,
  serial,
  uuid,
  text,
  integer,
  smallint,
  timestamp,
  boolean,
  index,
  primaryKey,
  unique,
  foreignKey,
} from 'drizzle-orm/pg-core'

// ============================================================================
// Referencia al esquema de autenticación
// ============================================================================
// Supabase Auth vive en el esquema 'auth'. Definimos una referencia para
// poder crear claves foráneas a auth.users. Nota: No manejamos esta tabla
// - Supabase lo hace. Esto es solo para seguridad de tipos y referencias FK.
// ============================================================================

const authSchema = pgSchema('auth')

export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey(),
})

// ============================================================================
// Enums
// ============================================================================

// Estado del acta en el flujo de verificación
export const estadoActaEnum = pgEnum('estado_acta', [
  'pendiente', // Recién ingresada, sin digitalizar
  'en_proceso', // Actualmente siendo digitalizada (bloqueada)
  'digitada', // Digitalizada, pendiente de validación
  'en_validacion', // Al menos 1 validación, pero menos de 3
  'validada', // Validada por 3+ usuarios con consenso
  'con_discrepancia', // Marcada con discrepancias irreconciliables
])

// Tipos de discrepancia que puede tener un acta
export const tipoDiscrepanciaEnum = pgEnum('tipo_discrepancia', [
  'ilegible', // No se puede leer el acta
  'adulterada', // Señales de alteración física
  'datos_inconsistentes', // Los números no cuadran
  'imagen_incompleta', // Falta parte del acta
  'valores_incorrectos', // Los valores digitados no coinciden con la imagen
  'otro', // Otro tipo de problema
])

// Tipo de zona del centro de votación
export const tipoZonaEnum = pgEnum('tipo_zona', ['urbano', 'rural'])

// Tipo de cambio en el historial
export const tipoCambioEnum = pgEnum('tipo_cambio', [
  'digitacion_inicial', // Primera vez que se digitaron los valores
  'correccion_validador', // Un validador corrigió los valores
  'rectificacion', // Corrección después de discrepancia
])

// ============================================================================
// Tablas Geográficas (Claves Compuestas Jerárquicas)
// ============================================================================
//
// La jerarquía es: Departamento → Municipio → Centro de Votación → JRV
//
// Cada nivel lleva los códigos de sus padres, facilitando consultas:
// - Todas las actas del departamento 08: WHERE departamento_codigo = 8
// - Todas las actas del municipio 08-01: WHERE departamento_codigo = 8 AND municipio_codigo = 1
//
// Esta desnormalización es intencional y sigue el sistema de codificación del CNE.
// ============================================================================

/**
 * Departamento - Los 18 departamentos de Honduras + Exterior (código 20)
 */
export const departamento = pgTable('departamento', {
  // El código ES la clave primaria (1-18, 20)
  codigo: smallint('codigo').primaryKey(),
  nombre: text('nombre').notNull(),
})

/**
 * Municipio - Municipios dentro de cada departamento
 *
 * Clave primaria compuesta: (departamento_codigo, codigo)
 * Esto permite que el código de municipio sea único solo dentro de su departamento.
 */
export const municipio = pgTable(
  'municipio',
  {
    // Códigos que forman la clave compuesta
    departamentoCodigo: smallint('departamento_codigo')
      .notNull()
      .references(() => departamento.codigo, { onDelete: 'restrict' }),
    codigo: smallint('codigo').notNull(),

    nombre: text('nombre').notNull(),
  },
  (table) => [primaryKey({ columns: [table.departamentoCodigo, table.codigo] })]
)

/**
 * Centro de Votación - Escuelas, edificios donde se vota
 *
 * Clave compuesta: (departamento_codigo, municipio_codigo, codigo)
 */
export const centroVotacion = pgTable(
  'centro_votacion',
  {
    // Códigos heredados de la jerarquía
    departamentoCodigo: smallint('departamento_codigo').notNull(),
    municipioCodigo: smallint('municipio_codigo').notNull(),
    codigo: smallint('codigo').notNull(), // Código único dentro del municipio

    nombre: text('nombre').notNull(),
    tipoZona: tipoZonaEnum('tipo_zona'), // rural o urbano

    // Campos opcionales para más contexto
    direccion: text('direccion'),
  },
  (table) => [
    primaryKey({ columns: [table.departamentoCodigo, table.municipioCodigo, table.codigo] }),

    // FK compuesta al municipio
    foreignKey({
      columns: [table.departamentoCodigo, table.municipioCodigo],
      foreignColumns: [municipio.departamentoCodigo, municipio.codigo],
      name: 'centro_votacion_municipio_fk',
    }).onDelete('restrict'),
  ]
)

/**
 * JRV - Junta Receptora de Votos (la mesa de votación específica)
 *
 * Clave compuesta: (departamento_codigo, municipio_codigo, centro_codigo, numero)
 */
export const jrv = pgTable(
  'jrv',
  {
    // Códigos heredados de toda la jerarquía
    departamentoCodigo: smallint('departamento_codigo').notNull(),
    municipioCodigo: smallint('municipio_codigo').notNull(),
    centroCodigo: smallint('centro_codigo').notNull(),
    numero: smallint('numero').notNull(), // Número de JRV dentro del centro

    // Cantidad de votantes registrados en esta JRV (útil para validación)
    votantesRegistrados: integer('votantes_registrados'),
  },
  (table) => [
    primaryKey({
      columns: [table.departamentoCodigo, table.municipioCodigo, table.centroCodigo, table.numero],
    }),

    // FK compuesta al centro de votación
    foreignKey({
      columns: [table.departamentoCodigo, table.municipioCodigo, table.centroCodigo],
      foreignColumns: [
        centroVotacion.departamentoCodigo,
        centroVotacion.municipioCodigo,
        centroVotacion.codigo,
      ],
      name: 'jrv_centro_votacion_fk',
    }).onDelete('restrict'),
  ]
)

// ============================================================================
// Tablas Principales
// ============================================================================

/**
 * Acta - Registro principal de cada acta electoral
 *
 * Incluye los códigos geográficos desnormalizados para consultas eficientes.
 */
export const acta = pgTable(
  'acta',
  {
    id: serial('id').primaryKey(),

    // Identificador único del CNE
    cneId: text('cne_id').unique(),

    // -------------------------------------------------------------------------
    // Ubicación geográfica (desnormalizada para consultas eficientes)
    // -------------------------------------------------------------------------
    departamentoCodigo: smallint('departamento_codigo'),
    municipioCodigo: smallint('municipio_codigo'),
    centroCodigo: smallint('centro_codigo'),
    jrvNumero: smallint('jrv_numero'),

    // URL a la imagen en Supabase Storage
    imagenUrl: text('imagen_url'),

    // -------------------------------------------------------------------------
    // Votos oficiales (reportados por el CNE) - INMUTABLES
    // -------------------------------------------------------------------------
    votosPnOficial: integer('votos_pn_oficial'),
    votosPlhOficial: integer('votos_plh_oficial'),
    votosPlOficial: integer('votos_pl_oficial'),
    votosPinuOficial: integer('votos_pinu_oficial'),
    votosDcOficial: integer('votos_dc_oficial'),
    votosTotalOficial: integer('votos_total_oficial'), // Suma para validación rápida

    // -------------------------------------------------------------------------
    // Votos digitados (valores ACTUALES después de posibles correcciones)
    // -------------------------------------------------------------------------
    votosPnDigitado: integer('votos_pn_digitado'),
    votosPlhDigitado: integer('votos_plh_digitado'),
    votosPlDigitado: integer('votos_pl_digitado'),
    votosPinuDigitado: integer('votos_pinu_digitado'),
    votosDcDigitado: integer('votos_dc_digitado'),
    votosTotalDigitado: integer('votos_total_digitado'),

    // -------------------------------------------------------------------------
    // Estado y flujo de trabajo
    // -------------------------------------------------------------------------
    estado: estadoActaEnum('estado').default('pendiente').notNull(),

    digitadoPor: uuid('digitado_por').references(() => authUsers.id, { onDelete: 'set null' }),
    digitadoEn: timestamp('digitado_en', { withTimezone: true }),

    // -------------------------------------------------------------------------
    // Sistema de bloqueo distribuido (10 minutos)
    // -------------------------------------------------------------------------
    bloqueadoHasta: timestamp('bloqueado_hasta', { withTimezone: true }),
    bloqueadoPor: uuid('bloqueado_por').references(() => authUsers.id, { onDelete: 'set null' }),

    // -------------------------------------------------------------------------
    // Contadores desnormalizados
    // -------------------------------------------------------------------------
    cantidadValidaciones: integer('cantidad_validaciones').default(0).notNull(),
    cantidadValidacionesCorrectas: integer('cantidad_validaciones_correctas').default(0).notNull(),

    // -------------------------------------------------------------------------
    // Timestamps
    // -------------------------------------------------------------------------
    creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // -------------------------------------------------------------------------
    // FK compuesta a la JRV (opcional, puede ser null si aún no se asigna)
    // -------------------------------------------------------------------------
    foreignKey({
      columns: [
        table.departamentoCodigo,
        table.municipioCodigo,
        table.centroCodigo,
        table.jrvNumero,
      ],
      foreignColumns: [jrv.departamentoCodigo, jrv.municipioCodigo, jrv.centroCodigo, jrv.numero],
      name: 'acta_jrv_fk',
    }).onDelete('set null'),

    // -------------------------------------------------------------------------
    // Índices para patrones de consulta comunes
    // -------------------------------------------------------------------------

    // Buscar por estado (digitalizar, validar, etc.)
    index('acta_estado_idx').on(table.estado),

    // Buscar actas disponibles para digitalizar
    index('acta_disponible_idx').on(table.estado, table.bloqueadoHasta),

    // Buscar actas pendientes de validación
    index('acta_para_validar_idx').on(table.estado, table.cantidadValidaciones),

    // -------------------------------------------------------------------------
    // Índices geográficos (¡la magia de la desnormalización!)
    // -------------------------------------------------------------------------

    // Todas las actas de un departamento
    index('acta_departamento_idx').on(table.departamentoCodigo),

    // Todas las actas de un municipio
    index('acta_municipio_idx').on(table.departamentoCodigo, table.municipioCodigo),

    // Todas las actas de un centro de votación
    index('acta_centro_idx').on(
      table.departamentoCodigo,
      table.municipioCodigo,
      table.centroCodigo
    ),

    // Acta específica de una JRV
    index('acta_jrv_idx').on(
      table.departamentoCodigo,
      table.municipioCodigo,
      table.centroCodigo,
      table.jrvNumero
    ),

    // Restricción única: solo puede haber un acta por JRV
    unique('acta_jrv_unique').on(
      table.departamentoCodigo,
      table.municipioCodigo,
      table.centroCodigo,
      table.jrvNumero
    ),
  ]
)

/**
 * Historial de Digitación - Auditoría de cambios
 *
 * Cada vez que se digitalizan o corrigen los valores, se guarda un registro.
 * Esto permite auditar quién cambió qué y cuándo.
 */
export const historialDigitacion = pgTable(
  'historial_digitacion',
  {
    id: serial('id').primaryKey(),

    actaId: integer('acta_id')
      .notNull()
      .references(() => acta.id, { onDelete: 'cascade' }),

    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),

    tipoCambio: tipoCambioEnum('tipo_cambio').notNull(),

    // Los valores establecidos en este cambio
    votosPn: integer('votos_pn'),
    votosPlh: integer('votos_plh'),
    votosPl: integer('votos_pl'),
    votosPinu: integer('votos_pinu'),
    votosDc: integer('votos_dc'),
    votosTotal: integer('votos_total'),

    comentario: text('comentario'),

    creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('historial_acta_idx').on(table.actaId),
    index('historial_usuario_idx').on(table.usuarioId),
  ]
)

/**
 * Validación - Registro de cada validación de un acta
 *
 * Un usuario puede validar un acta solo una vez.
 * No puede validar un acta que él mismo digitó (se verifica en código).
 */
export const validacion = pgTable(
  'validacion',
  {
    actaId: integer('acta_id')
      .notNull()
      .references(() => acta.id, { onDelete: 'cascade' }),

    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),

    // ¿El usuario confirma que los datos digitados son correctos?
    esCorrecto: boolean('es_correcto').notNull(),

    // Si corrigió valores, referencia al historial de la corrección
    historialCorreccionId: integer('historial_correccion_id').references(
      () => historialDigitacion.id,
      { onDelete: 'set null' }
    ),

    comentario: text('comentario'),

    creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Clave primaria compuesta: un usuario solo puede validar un acta una vez
    primaryKey({ columns: [table.actaId, table.usuarioId] }),
    index('validacion_acta_idx').on(table.actaId),
  ]
)

/**
 * Discrepancia - Reportes de problemas con actas
 *
 * Tanto digitadores como validadores pueden reportar discrepancias.
 */
export const discrepancia = pgTable(
  'discrepancia',
  {
    id: serial('id').primaryKey(),

    actaId: integer('acta_id')
      .notNull()
      .references(() => acta.id, { onDelete: 'cascade' }),

    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),

    tipo: tipoDiscrepanciaEnum('tipo').notNull(),
    descripcion: text('descripcion'),

    // ¿Esta discrepancia fue resuelta?
    resuelta: boolean('resuelta').default(false).notNull(),
    resueltaPor: uuid('resuelta_por').references(() => authUsers.id, { onDelete: 'set null' }),
    resolucionComentario: text('resolucion_comentario'),
    resueltaEn: timestamp('resuelta_en', { withTimezone: true }),

    creadoEn: timestamp('creado_en', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('discrepancia_acta_idx').on(table.actaId),
    index('discrepancia_tipo_idx').on(table.tipo),
    index('discrepancia_resuelta_idx').on(table.resuelta),
  ]
)

// ============================================================================
// Estadísticas de Usuario (Leaderboard)
// ============================================================================

/**
 * Estadísticas de Usuario - Contadores desnormalizados para leaderboard
 *
 * Esta tabla almacena conteos por usuario para consultas rápidas de leaderboard.
 * Los contadores se actualizan cuando el usuario realiza acciones.
 */
export const estadisticaUsuario = pgTable(
  'estadistica_usuario',
  {
    // El usuario - clave primaria
    usuarioId: uuid('usuario_id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),

    // Contadores de actividad
    actasDigitadas: integer('actas_digitadas').default(0).notNull(),
    actasValidadas: integer('actas_validadas').default(0).notNull(),
    validacionesCorrectas: integer('validaciones_correctas').default(0).notNull(),
    discrepanciasReportadas: integer('discrepancias_reportadas').default(0).notNull(),

    // Para detectar posibles malos actores
    correccionesRecibidas: integer('correcciones_recibidas').default(0).notNull(),

    // Timestamps
    primeraActividad: timestamp('primera_actividad', { withTimezone: true }),
    ultimaActividad: timestamp('ultima_actividad', { withTimezone: true }),
  },
  (table) => [
    // Índices para ordenar el leaderboard
    index('estadistica_digitadas_idx').on(table.actasDigitadas),
    index('estadistica_validadas_idx').on(table.actasValidadas),
    index('estadistica_ultima_actividad_idx').on(table.ultimaActividad),
  ]
)

// ============================================================================
// Exportación de Tipos
// ============================================================================

export type Departamento = typeof departamento.$inferSelect
export type NewDepartamento = typeof departamento.$inferInsert

export type Municipio = typeof municipio.$inferSelect
export type NewMunicipio = typeof municipio.$inferInsert

export type CentroVotacion = typeof centroVotacion.$inferSelect
export type NewCentroVotacion = typeof centroVotacion.$inferInsert

export type Jrv = typeof jrv.$inferSelect
export type NewJrv = typeof jrv.$inferInsert

export type Acta = typeof acta.$inferSelect
export type NewActa = typeof acta.$inferInsert

export type HistorialDigitacion = typeof historialDigitacion.$inferSelect
export type NewHistorialDigitacion = typeof historialDigitacion.$inferInsert

export type Validacion = typeof validacion.$inferSelect
export type NewValidacion = typeof validacion.$inferInsert

export type Discrepancia = typeof discrepancia.$inferSelect
export type NewDiscrepancia = typeof discrepancia.$inferInsert

export type EstadisticaUsuario = typeof estadisticaUsuario.$inferSelect
export type NewEstadisticaUsuario = typeof estadisticaUsuario.$inferInsert

export type EstadoActa = (typeof estadoActaEnum.enumValues)[number]
export type TipoDiscrepancia = (typeof tipoDiscrepanciaEnum.enumValues)[number]
export type TipoZona = (typeof tipoZonaEnum.enumValues)[number]
export type TipoCambio = (typeof tipoCambioEnum.enumValues)[number]
