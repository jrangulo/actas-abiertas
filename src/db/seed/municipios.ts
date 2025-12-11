import type { NewMunicipio } from '../schema'

/**
 * Los 298 municipios de Honduras organizados por departamento.
 *
 * Códigos de municipio son secuenciales dentro de cada departamento (01, 02, 03...)
 * según el orden oficial.
 */

// Función auxiliar para crear municipios de un departamento
const crearMunicipios = (departamentoCodigo: number, nombres: string[]): NewMunicipio[] =>
  nombres.map((nombre, index) => ({
    departamentoCodigo,
    codigo: index + 1,
    nombre,
  }))

// Función auxiliar para crear municipios de un departamento
const crearMunicipiosConCodigos = (
  departamentoCodigo: number,
  nombres: string[],
  codigos: number[]
): NewMunicipio[] =>
  nombres.map((nombre, index) => ({
    departamentoCodigo,
    codigo: codigos[index],
    nombre,
  }))

// =============================================================================
// Departamento 01: Atlántida (8 municipios)
// =============================================================================
const atlantida = crearMunicipios(1, [
  'La Ceiba',
  'El Porvenir',
  'Tela',
  'Jutiapa',
  'La Masica',
  'San Francisco',
  'Arizona',
  'Esparta',
])

// =============================================================================
// Departamento 02: Colón (10 municipios)
// =============================================================================
const colon = crearMunicipios(2, [
  'Trujillo',
  'Balfate',
  'Iriona',
  'Limón',
  'Sabá',
  'Santa Fe',
  'Santa Rosa de Aguán',
  'Sonaguera',
  'Tocoa',
  'Bonito Oriental',
])

// =============================================================================
// Departamento 03: Comayagua (21 municipios)
// =============================================================================
const comayagua = crearMunicipios(3, [
  'Comayagua',
  'Ajuterique',
  'El Rosario',
  'Esquías',
  'Humuya',
  'La Libertad',
  'Lamaní',
  'La Trinidad',
  'Lejamaní',
  'Meámbar',
  'Minas de Oro',
  'Ojos de Agua',
  'San Jerónimo',
  'San José de Comayagua',
  'San José del Potrero',
  'San Luis',
  'San Sebastián',
  'Siguatepeque',
  'Villa de San Antonio',
  'Las Lajas',
  'Taulabé',
])

// =============================================================================
// Departamento 04: Copán (23 municipios)
// =============================================================================
const copan = crearMunicipios(4, [
  'Santa Rosa de Copán',
  'Cabañas',
  'Concepción',
  'Copán Ruinas',
  'Corquín',
  'Cucuyagua',
  'Dolores',
  'Dulce Nombre',
  'El Paraíso',
  'Florida',
  'La Jigua',
  'La Unión',
  'Nueva Arcadia',
  'San Agustín',
  'San Antonio',
  'San Jerónimo',
  'San José',
  'San Juan de Opoa',
  'San Nicolás',
  'San Pedro',
  'Santa Rita',
  'Trinidad de Copán',
  'Veracruz',
])

// =============================================================================
// Departamento 05: Cortés (12 municipios)
// =============================================================================
const cortes = crearMunicipios(5, [
  'San Pedro Sula',
  'Choloma',
  'Omoa',
  'Pimienta',
  'Potrerillos',
  'Puerto Cortés',
  'San Antonio de Cortés',
  'San Francisco de Yojoa',
  'San Manuel',
  'Santa Cruz de Yojoa',
  'Villanueva',
  'La Lima',
])

// =============================================================================
// Departamento 06: Choluteca (16 municipios)
// =============================================================================
const choluteca = crearMunicipios(6, [
  'Choluteca',
  'Apacilagua',
  'Concepción de María',
  'Duyure',
  'El Corpus',
  'El Triunfo',
  'Marcovia',
  'Morolica',
  'Namasigüe',
  'Orocuina',
  'Pespire',
  'San Antonio de Flores',
  'San Isidro',
  'San José',
  'San Marcos de Colón',
  'Santa Ana de Yusguare',
])

// =============================================================================
// Departamento 07: El Paraíso (19 municipios)
// =============================================================================
const elParaiso = crearMunicipios(7, [
  'Yuscarán',
  'Alauca',
  'Danlí',
  'El Paraíso',
  'Güinope',
  'Jacaleapa',
  'Liure',
  'Morocelí',
  'Oropolí',
  'Potrerillos',
  'San Antonio de Flores',
  'San Lucas',
  'San Matías',
  'Soledad',
  'Teupasenti',
  'Texiguat',
  'Vado Ancho',
  'Yauyupe',
  'Trojes',
])

// =============================================================================
// Departamento 08: Francisco Morazán (28 municipios)
// =============================================================================
const franciscoMorazan = crearMunicipios(8, [
  'Distrito Central', // Tegucigalpa y Comayagüela
  'Alubarén',
  'Cedros',
  'Curarén',
  'El Porvenir',
  'Guaimaca',
  'La Libertad',
  'La Venta',
  'Lepaterique',
  'Maraita',
  'Marale',
  'Nueva Armenia',
  'Ojojona',
  'Orica',
  'Reitoca',
  'Sabanagrande',
  'San Antonio de Oriente',
  'San Buenaventura',
  'San Ignacio',
  'Cantarranas',
  'San Miguelito',
  'Santa Ana',
  'Santa Lucía',
  'Talanga',
  'Tatumbla',
  'Valle de Ángeles',
  'Villa de San Francisco',
  'Vallecillo',
])

// =============================================================================
// Departamento 09: Gracias a Dios (6 municipios)
// =============================================================================
const graciasADios = crearMunicipios(9, [
  'Puerto Lempira',
  'Brus Laguna',
  'Ahuas',
  'Juan Francisco Bulnes',
  'Villeda Morales',
  'Wampusirpe',
])

// =============================================================================
// Departamento 10: Intibucá (17 municipios)
// =============================================================================
const intibuca = crearMunicipios(10, [
  'La Esperanza',
  'Camasca',
  'Colomoncagua',
  'Concepción',
  'Dolores',
  'Intibucá',
  'Jesús de Otoro',
  'Magdalena',
  'Masaguara',
  'San Antonio',
  'San Isidro',
  'San Juan',
  'San Marcos de la Sierra',
  'San Miguel Guancapla',
  'Santa Lucía',
  'Yamaranguila',
  'San Francisco de Opalaca',
])

// =============================================================================
// Departamento 11: Islas de la Bahía (4 municipios)
// =============================================================================
const islasDeLaBahia = crearMunicipios(11, ['Roatán', 'Guanaja', 'José Santos Guardiola', 'Utila'])

// =============================================================================
// Departamento 12: La Paz (19 municipios)
// =============================================================================
const laPaz = crearMunicipios(12, [
  'La Paz',
  'Aguanqueterique',
  'Cabañas',
  'Cane',
  'Chinacla',
  'Guajiquiro',
  'Lauterique',
  'Marcala',
  'Mercedes de Oriente',
  'Opatoro',
  'San Antonio del Norte',
  'San José',
  'San Juan',
  'San Pedro de Tutule',
  'Santa Ana',
  'Santa Elena',
  'Santa María',
  'Santiago de Puringla',
  'Yarula',
])

// =============================================================================
// Departamento 13: Lempira (28 municipios)
// =============================================================================
const lempira = crearMunicipios(13, [
  'Gracias',
  'Belén',
  'Candelaria',
  'Cololaca',
  'Erandique',
  'Gualcince',
  'Guarita',
  'La Campa',
  'La Iguala',
  'Las Flores',
  'La Unión',
  'La Virtud',
  'Lepaera',
  'Mapulaca',
  'Piraera',
  'San Andrés',
  'San Francisco',
  'San Juan Guarita',
  'San Manuel Colohete',
  'San Rafael',
  'San Sebastián',
  'Santa Cruz',
  'Talgua',
  'Tambla',
  'Tomalá',
  'Valladolid',
  'Virginia',
  'San Marcos de Caiquín',
])

// =============================================================================
// Departamento 14: Ocotepeque (16 municipios)
// =============================================================================
const ocotepeque = crearMunicipios(14, [
  'Ocotepeque',
  'Belén Gualcho',
  'Concepción',
  'Dolores Merendón',
  'Fraternidad',
  'La Encarnación',
  'La Labor',
  'Lucerna',
  'Mercedes',
  'San Fernando',
  'San Francisco del Valle',
  'San Jorge',
  'San Marcos',
  'Santa Fe',
  'Sensenti',
  'Sinuapa',
])

// =============================================================================
// Departamento 15: Olancho (23 municipios)
// =============================================================================
const olancho = crearMunicipios(15, [
  'Juticalpa',
  'Campamento',
  'Catacamas',
  'Concordia',
  'Dulce Nombre de Curlí',
  'El Rosario',
  'Esquipulas del Norte',
  'Gualaco',
  'Guarizama',
  'Guata',
  'Guayape',
  'Jano',
  'La Unión',
  'Mangulile',
  'Manto',
  'Salamá',
  'San Esteban',
  'San Francisco de Becerra',
  'San Francisco de la Paz',
  'Santa María del Real',
  'Silca',
  'Yocón',
  'Patuca',
])

// =============================================================================
// Departamento 16: Santa Bárbara (28 municipios)
// =============================================================================
const santaBarbara = crearMunicipios(16, [
  'Santa Bárbara',
  'Arada',
  'Atima',
  'Azacualpa',
  'Ceguaca',
  'Concepción del Norte',
  'Concepción del Sur',
  'Chinda',
  'El Níspero',
  'Gualala',
  'Ilama',
  'Las Vegas',
  'Macuelizo',
  'Naranjito',
  'Nuevo Celilac',
  'Nueva Frontera',
  'Petoa',
  'Protección',
  'Quimistán',
  'San Francisco de Ojuera',
  'San José de las Colinas',
  'San Luis',
  'San Marcos',
  'San Nicolás',
  'San Pedro Zacapa',
  'San Vicente Centenario',
  'Santa Rita',
  'Trinidad',
])

// =============================================================================
// Departamento 17: Valle (9 municipios)
// =============================================================================
const valle = crearMunicipios(17, [
  'Nacaome',
  'Alianza',
  'Amapala',
  'Aramecina',
  'Caridad',
  'Goascorán',
  'Langue',
  'San Francisco de Coray',
  'San Lorenzo',
])

// =============================================================================
// Departamento 18: Yoro (11 municipios)
// =============================================================================
const yoro = crearMunicipios(18, [
  'Yoro',
  'Arenal',
  'El Negrito',
  'El Progreso',
  'Jocón',
  'Morazán',
  'Olanchito',
  'Santa Rita',
  'Sulaco',
  'Victoria',
  'Yorito',
])

// =============================================================================
// Departamento 20: Exterior (12 municipios)
// =============================================================================

const exterior = crearMunicipiosConCodigos(
  20,
  [
    'Atlanta',
    'Boston',
    'Charlotte',
    'Chicago',
    'Dallas',
    'Houston',
    'Los Angeles',
    'Miami',
    'New Orleans',
    'New York',
    'San Francisco',
    'Washington',
  ],
  [7, 13, 15, 8, 9, 1, 2, 3, 4, 5, 14, 6]
)

// =============================================================================
// Exportación completa: 298 municipios
// =============================================================================
export const municipiosHonduras: NewMunicipio[] = [
  ...atlantida, // 01: 8 municipios
  ...colon, // 02: 10 municipios
  ...comayagua, // 03: 21 municipios
  ...copan, // 04: 23 municipios
  ...cortes, // 05: 12 municipios
  ...choluteca, // 06: 16 municipios
  ...elParaiso, // 07: 19 municipios
  ...franciscoMorazan, // 08: 28 municipios
  ...graciasADios, // 09: 6 municipios
  ...intibuca, // 10: 17 municipios
  ...islasDeLaBahia, // 11: 4 municipios
  ...laPaz, // 12: 19 municipios
  ...lempira, // 13: 28 municipios
  ...ocotepeque, // 14: 16 municipios
  ...olancho, // 15: 23 municipios
  ...santaBarbara, // 16: 28 municipios
  ...valle, // 17: 9 municipios
  ...yoro, // 18: 11 municipios
  ...exterior, // 20: 12 municipios
] // Total: 298 municipios HN + 12 exterior
