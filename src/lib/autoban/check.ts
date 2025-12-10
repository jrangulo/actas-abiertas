'use server'

import { db } from '@/db'
import { estadisticaUsuario, historialUsuarioEstado } from '@/db/schema'
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
 * Generar una razón legible para el cambio de estado
 */
function generarRazonCambio(nuevoEstado: EstadoUsuario, porcentajeAcierto = 0): string {
  const porcentaje = porcentajeAcierto

  switch (nuevoEstado) {
    case 'advertido':
      return `Precisión baja detectada: ${porcentaje}%. Se requiere al menos 70% de precisión.`
    case 'restringido':
      return `Precisión muy baja: ${porcentaje}%. Advertencia final. Se requiere al menos 50% de precisión.`
    case 'baneado':
      return `Precisión crítica: ${porcentaje}%. Contribuciones suspendidas. Se requiere al menos 30% de precisión.`
    case 'activo':
      return `Precisión mejorada: ${porcentaje}%. Restricciones levantadas.`
  }
}
