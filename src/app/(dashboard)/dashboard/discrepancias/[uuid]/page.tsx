import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle, Image as ImageIcon, MessageSquare, User } from 'lucide-react'
import {
  getActaConReportes,
  getReportesDeActa,
  getComentariosDeActa,
} from '@/lib/discrepancias/queries'
import { createClient } from '@/lib/supabase/server'
import { generateAnonName } from '@/lib/users/anon-names'
import { ImageViewer } from './image-viewer'
import { ComentariosList } from './comentarios-list'
import { ComentarioForm } from './comentario-form'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ uuid: string }>
}

export default async function DiscrepanciaDetailPage({ params }: PageProps) {
  const { uuid } = await params
  const actaData = await getActaConReportes(uuid)

  if (!actaData) {
    notFound()
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="space-y-6 py-4 lg:py-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/discrepancias">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold flex items-center gap-2">
            Acta {actaData.jrvNumero || actaData.cneId || actaData.uuid.slice(0, 8)}
            {actaData.estado === 'bajo_revision' && (
              <span className="text-sm font-normal bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
                Bajo Revisión
              </span>
            )}
            {actaData.estado === 'con_discrepancia' && (
              <span className="text-sm font-normal bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">
                Sin Consenso
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {actaData.departamentoCodigo && actaData.municipioCodigo
              ? `Depto. ${actaData.departamentoCodigo} · Mpio. ${actaData.municipioCodigo}`
              : 'Ubicación desconocida'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Image Viewer */}
        <Card className="lg:row-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Imagen del Acta
            </CardTitle>
          </CardHeader>
          <CardContent>
            {actaData.imagenUrl ? (
              <ImageViewer src={actaData.imagenUrl} alt={`Acta ${actaData.cneId}`} />
            ) : (
              <div className="aspect-[3/4] bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">No hay imagen disponible</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Digitized Values */}
        {actaData.votosTotalDigitado !== null && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Valores Digitados</CardTitle>
              <CardDescription>Los valores actualmente registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">PN:</span>
                  <span className="font-mono">{actaData.votosPnDigitado ?? '-'}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">PLH:</span>
                  <span className="font-mono">{actaData.votosPlhDigitado ?? '-'}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">PL:</span>
                  <span className="font-mono">{actaData.votosPlDigitado ?? '-'}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">PINU:</span>
                  <span className="font-mono">{actaData.votosPinuDigitado ?? '-'}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">DC:</span>
                  <span className="font-mono">{actaData.votosDcDigitado ?? '-'}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">Nulos:</span>
                  <span className="font-mono">{actaData.votosNulosDigitado ?? '-'}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/50 rounded">
                  <span className="text-muted-foreground">Blancos:</span>
                  <span className="font-mono">{actaData.votosBlancosDigitado ?? '-'}</span>
                </div>
                <div className="flex justify-between p-2 bg-primary/10 rounded font-medium">
                  <span>Total:</span>
                  <span className="font-mono">{actaData.votosTotalDigitado ?? '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reports */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Reportes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ReportesSkeleton />}>
              <ReportesList actaId={actaData.id} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Comments Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Discusión
          </CardTitle>
          <CardDescription>Comenta para analizar esta acta con otros verificadores</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && <ComentarioForm uuid={uuid} />}
          <Suspense fallback={<ComentariosSkeleton />}>
            <ComentariosSection actaId={actaData.id} currentUserId={user?.id} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

async function ReportesList({ actaId }: { actaId: number }) {
  const reportes = await getReportesDeActa(actaId)

  if (reportes.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay reportes para esta acta</p>
  }

  const tipoLabels: Record<string, string> = {
    ilegible: 'Ilegible',
    adulterada: 'Posible Adulteración',
    datos_inconsistentes: 'Datos Inconsistentes',
    imagen_incompleta: 'Imagen Incompleta',
    valores_incorrectos: 'Valores Incorrectos',
    otro: 'Otro',
  }

  return (
    <div className="space-y-3">
      {reportes.map((reporte) => (
        <div key={reporte.id} className="p-3 border rounded-lg space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-block px-2 py-0.5 text-xs rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                {tipoLabels[reporte.tipo] || reporte.tipo}
              </span>
              {reporte.resuelta && (
                <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  Resuelto
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(reporte.creadoEn).toLocaleDateString('es-HN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {reporte.descripcion && (
            <p className="text-sm text-muted-foreground">{reporte.descripcion}</p>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>
              {reporte.perfilPrivado
                ? generateAnonName(reporte.usuarioId)
                : reporte.usuarioNombre || 'Usuario'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

async function ComentariosSection({
  actaId,
  currentUserId,
}: {
  actaId: number
  currentUserId?: string
}) {
  const comentarios = await getComentariosDeActa(actaId)
  return <ComentariosList comentarios={comentarios} currentUserId={currentUserId} />
}

function ReportesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="p-3 border rounded-lg space-y-2">
          <div className="h-5 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  )
}

function ComentariosSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-full bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
