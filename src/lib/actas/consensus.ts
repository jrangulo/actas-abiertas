/**
 * Lógica de consenso para el sistema de validación
 *
 * Funciones puras para comparar valores de votos y encontrar consenso.
 * Separado de actions.ts para poder exportar para testing.
 */

// ============================================================================
// Tipos
// ============================================================================

export type VoteValues = {
  pn: number
  plh: number
  pl: number
  pinu: number
  dc: number
  nulos: number
  blancos: number
  total: number
}

// ============================================================================
// Funciones de Consenso
// ============================================================================

/**
 * Comparar dos conjuntos de valores de votos para ver si coinciden
 */
export function valuesMatch(a: VoteValues, b: VoteValues): boolean {
  return (
    a.pn === b.pn &&
    a.plh === b.plh &&
    a.pl === b.pl &&
    a.pinu === b.pinu &&
    a.dc === b.dc &&
    a.nulos === b.nulos &&
    a.blancos === b.blancos
  )
}

/**
 * Encontrar consenso entre validaciones (2+ deben coincidir)
 * Retorna los valores ganadores y los IDs de usuarios que discreparon
 */
export function findConsensus(
  validaciones: Array<{ usuarioId: string; values: VoteValues }>
): { winningValues: VoteValues; discrepantUserIds: string[] } | null {
  if (validaciones.length < 3) return null

  // Comparar cada par
  for (let i = 0; i < validaciones.length; i++) {
    let matchCount = 1
    const matchingUserIds = [validaciones[i].usuarioId]

    for (let j = 0; j < validaciones.length; j++) {
      if (i !== j && valuesMatch(validaciones[i].values, validaciones[j].values)) {
        matchCount++
        matchingUserIds.push(validaciones[j].usuarioId)
      }
    }

    // Si 2+ coinciden, tenemos consenso
    if (matchCount >= 2) {
      const discrepantUserIds = validaciones
        .filter((v) => !matchingUserIds.includes(v.usuarioId))
        .map((v) => v.usuarioId)

      return {
        winningValues: validaciones[i].values,
        discrepantUserIds,
      }
    }
  }

  // Sin consenso - todos diferentes
  return null
}
