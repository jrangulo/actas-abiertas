import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  getActaByUuid,
  getModoVerificacion,
  getValoresActuales,
  bloquearActa,
  getActaImageUrl,
} from '@/lib/actas'
import { db } from '@/db'
import { validacion, acta as actaTable } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { VerificarClient } from './verificar-client'

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
    .where(and(eq(validacion.actaId, actaData.id), eq(validacion.usuarioId, user.id)))
    .limit(1)

  if (yaValidada.length > 0) {
    redirect('/dashboard')
  }

  // Si el usuario digitó esta acta, no puede validarla
  // IMPORTANTE: Esta verificación también previene un bug donde Next.js re-ejecuta
  // este server component durante la navegación, causando que bloquearActa() se llame
  // de nuevo después de que guardarDigitalizacion() liberó el bloqueo
  if (actaData.digitadoPor === user.id) {
    redirect('/dashboard')
  }

  // Intentar bloquear el acta
  const bloqueoResult = await bloquearActa(uuid, user.id)

  if (!bloqueoResult) {
    // Acta está siendo usada por otro usuario
    redirect('/dashboard/verificar?error=bloqueada')
  }

  // Determinar modo y valores
  const modo = getModoVerificacion(actaData)
  const valoresActuales = getValoresActuales(actaData)

  // Construir URL de imagen de Supabase Storage
  const imagenUrl = getActaImageUrl(actaData.cneId) || '/placeholder-acta.png'

  return (
    <VerificarClient
      uuid={uuid}
      modo={modo}
      bloqueadoHasta={bloqueoResult.bloqueadoHasta!}
      actaInfo={{
        cneId: actaData.cneId || 'Sin ID',
        departamento: actaData.departamentoCodigo?.toString() || '-',
        municipio: actaData.municipioCodigo?.toString() || '-',
        centro: actaData.centroCodigo?.toString() || '-',
        jrv: actaData.jrvNumero?.toString() || '-',
        estado: actaData.estado,
        escrutada: actaData.escrutadaEnCne || false,
        cantidadValidaciones: actaData.cantidadValidaciones,
      }}
      valoresActuales={valoresActuales}
      imagenUrl={imagenUrl}
    />
  )
}
