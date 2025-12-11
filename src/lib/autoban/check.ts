'use server'

import { db } from '@/db'
import { estadisticaUsuario, historialUsuarioEstado, validacion, discrepancia } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  calcularPorcentajeAcierto,
  determinarEstadoPorAcierto,
  determinarNuevoEstado,
} from './calculations'
import type { EstadoUsuario } from './config'

/**
 * Verificar si un usuario debe ser advertido/restringido/baneado basado en la precisión
 *
 * Llamado después de que se alcance el consenso y se actualizan las correcciones recibidas
 * Ejecuta de manera asíncrona sin bloquear el flujo de validación
 *
 * @param userId - Usuario a verificar
 * @returns Promise que resuelve cuando el chequeo completa (o falla silenciosamente)
 */
export async function verificarEstadoUsuario(userId: string): Promise<void> {
  try {
    const [userStats] = await db
      .select()
      .from(estadisticaUsuario)
      .where(eq(estadisticaUsuario.usuarioId, userId))
      .limit(1)

    if (!userStats) {
      return
    }

    const porcentajeAcierto = calcularPorcentajeAcierto({
      actasValidadas: userStats.actasValidadas,
      correccionesRecibidas: userStats.correccionesRecibidas,
    })

    const estadoSugerido = determinarEstadoPorAcierto(porcentajeAcierto)

    const nuevoEstado = determinarNuevoEstado(
      userStats.estado,
      estadoSugerido,
      userStats.estadoBloqueadoPorAdmin
    )

    if (!nuevoEstado) {
      return
    }

    // Prevenir duplicados por race conditions: si el estado cambió recientemente (< 5 segundos)
    // y ya está en el estado objetivo, no hacer nada
    if (
      userStats.estadoCambiadoEn &&
      Date.now() - userStats.estadoCambiadoEn.getTime() < 5000 &&
      userStats.estado === nuevoEstado
    ) {
      return
    }

    const now = new Date()

    await db.transaction(async (tx) => {
      // Si el usuario está siendo baneado, eliminar sus contribuciones
      if (nuevoEstado === 'baneado') {
        await eliminarContribucionesUsuario(userId, tx)
      }

      await tx
        .update(estadisticaUsuario)
        .set({
          estado: nuevoEstado,
          estadoCambiadoEn: now,
          razonEstado: generarRazonCambio(nuevoEstado, porcentajeAcierto),
          ultimaAdvertenciaEn: now,
          conteoAdvertencias: userStats.conteoAdvertencias + 1,
        })
        .where(eq(estadisticaUsuario.usuarioId, userId))

      await tx.insert(historialUsuarioEstado).values({
        usuarioId: userId,
        estadoAnterior: userStats.estado,
        estadoNuevo: nuevoEstado,
        razon: generarRazonCambio(nuevoEstado, porcentajeAcierto),
        validacionesTotales: userStats.actasValidadas,
        correccionesRecibidas: userStats.correccionesRecibidas,
        porcentajeAcierto: porcentajeAcierto ?? undefined,
        esAutomatico: true,
        modificadoPor: null,
      })
    })
  } catch (error) {
    console.error('Error en verificarEstadoUsuario:', error)
  }
}

/**
 * Eliminar todas las contribuciones de un usuario baneado
 *
 * Esto incluye:
 * - Validaciones (votos en el sistema de consenso)
 * - Reportes de discrepancias
 *
 * Las actas afectadas volverán al pool para ser re-validadas por otros usuarios.
 */
async function eliminarContribucionesUsuario(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any
): Promise<void> {
  // Eliminar todas las validaciones del usuario
  await tx.delete(validacion).where(eq(validacion.usuarioId, userId))

  // Eliminar todos los reportes/discrepancias del usuario
  await tx.delete(discrepancia).where(eq(discrepancia.usuarioId, userId))

  console.log(`Contribuciones eliminadas para usuario baneado: ${userId}`)
}

/**
 * Generar una razón legible para el cambio de estado
 */
function generarRazonCambio(nuevoEstado: EstadoUsuario, porcentajeAcierto = 0): string {
  const porcentaje = porcentajeAcierto

  switch (nuevoEstado) {
    case 'advertido':
      return `Precisión baja detectada: ${porcentaje}%. Se requiere al menos 90% de precisión (máx. 10% de error).`
    case 'restringido':
      return `Precisión muy baja: ${porcentaje}%. Advertencia final. Se requiere al menos 80% de precisión (máx. 20% de error).`
    case 'baneado':
      return `Precisión crítica: ${porcentaje}%. Contribuciones suspendidas y eliminadas. Se requiere al menos 70% de precisión (máx. 30% de error).`
    case 'activo':
      return `Precisión mejorada: ${porcentaje}%. Restricciones levantadas.`
  }
}
