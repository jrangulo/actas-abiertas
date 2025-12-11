import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActaByUuid, getValoresActuales, bloquearActa, getActaImageUrl } from '@/lib/actas'
import { getUserTotalValidaciones } from '@/lib/users/actions'
import { db } from '@/db'
import { validacion, discrepancia } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { VerificarClient } from './verificar-client'

// Force dynamic rendering - never cache this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface VerificarActaPageProps {
  params: Promise<{ uuid: string }>
}

export default async function VerificarActaPage({ params }: VerificarActaPageProps) {
  const { uuid } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Obtener el acta
  const actaData = await getActaByUuid(uuid)

  if (!actaData) {
    notFound()
  }

  // Si el usuario ya validó esta acta, no volver a bloquear ni mostrarla
  const yaValidada = await db
    .select({ id: validacion.actaId })
    .from(validacion)
    .where(and(eq(validacion.actaId, actaData.acta.id), eq(validacion.usuarioId, user.id)))
    .limit(1)

  if (yaValidada.length > 0) {
    redirect('/dashboard')
  }

  // Si el usuario ya reportó esta acta, no volver a bloquear ni mostrarla
  const yaReportada = await db
    .select({ id: discrepancia.id })
    .from(discrepancia)
    .where(and(eq(discrepancia.actaId, actaData.acta.id), eq(discrepancia.usuarioId, user.id)))
    .limit(1)

  if (yaReportada.length > 0) {
    redirect('/dashboard')
  }

  // Si el usuario digitó esta acta, no puede validarla
  // IMPORTANTE: Esta verificación también previene un bug donde Next.js re-ejecuta
  // este server component durante la navegación, causando que bloquearActa() se llame
  // de nuevo después de que guardarDigitalizacion() liberó el bloqueo
  if (actaData.acta.digitadoPor === user.id) {
    redirect('/dashboard')
  }

  // Intentar bloquear el acta
  const bloqueoResult = await bloquearActa(uuid, user.id)

  if (!bloqueoResult) {
    // Acta está siendo usada por otro usuario
    redirect('/dashboard/verificar?error=bloqueada')
  }

  // Obtener valores actuales
  const valoresActuales = getValoresActuales(actaData.acta)

  // Construir URL de imagen de Supabase Storage
  const imagenUrl = getActaImageUrl(actaData.acta.cneId) || '/placeholder-acta.png'

  // Obtener total de validaciones del usuario
  const userTotalValidaciones = await getUserTotalValidaciones(user.id)

  return (
    <VerificarClient
      uuid={uuid}
      bloqueadoHasta={bloqueoResult.bloqueadoHasta!}
      userTotalValidaciones={userTotalValidaciones}
      actaInfo={{
        cneId: actaData.acta.cneId || 'Sin ID',
        departamento: `${actaData.departamento?.nombre || '-'} (${actaData.acta.departamentoCodigo?.toString().padStart(2, '0')})`,
        municipio: `${actaData.municipio?.nombre || '-'} (${actaData.acta.municipioCodigo?.toString().padStart(3, '0')})`,
        centro: `${actaData.acta.centroCodigo?.toString().padStart(3, '0')} - ${actaData.centro_votacion?.nombre || 'Desconocido'} ${actaData.centro_votacion?.direccion ? `(${actaData.centro_votacion.direccion})` : ''}`,
        jrv: actaData.acta.jrvNumero?.toString().padStart(5, '0') || '-',
        estado: actaData.acta.estado,
        escrutada: actaData.acta.escrutadaEnCne || false,
        cantidadValidaciones: actaData.acta.cantidadValidaciones,
        etiquetasCNE: (actaData.acta.etiquetasCNE as string[] | null) || [],
      }}
      valoresActuales={valoresActuales}
      imagenUrl={imagenUrl}
    />
  )
}
