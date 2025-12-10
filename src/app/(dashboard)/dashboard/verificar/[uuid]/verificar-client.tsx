'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ImageViewer,
  VoteInputGroup,
  ReportDialog,
  LockTimer,
  ConfirmationDialog,
} from '@/components/verificar'
import {
  guardarValidacion,
  reportarProblema,
  obtenerNuevaActa,
  abandonarActa,
} from '@/lib/actas/actions'
import { Check, ChevronRight, Loader2, PenLine, CheckSquare, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'

// Enum para las acciones pendientes
enum PendingAction {
  GUARDAR_SIGUIENTE = 'guardar-siguiente',
  SOLO_GUARDAR = 'solo-guardar',
  CONFIRMAR = 'confirmar',
  CONFIRMAR_SOLO = 'confirmar-solo',
  CORRECCION = 'correccion',
  SALIR = 'salir',
}

// Clave para guardar valores en localStorage
const DRAFT_KEY_PREFIX = 'acta-draft-'

interface VerificarClientProps {
  uuid: string
  bloqueadoHasta: Date
  actaInfo: {
    cneId: string
    departamento: string
    municipio: string
    centro: string
    jrv: string
    estado: string
    escrutada: boolean
    cantidadValidaciones: number
  }
  valoresActuales: {
    fuente: 'cne' | 'digitado'
    pn: number | null
    plh: number | null
    pl: number | null
    pinu: number | null
    dc: number | null
    nulos: number | null
    blancos: number | null
    total: number | null
  }
  imagenUrl: string
}

export function VerificarClient({
  uuid,
  bloqueadoHasta,
  actaInfo,
  valoresActuales,
  imagenUrl,
}: VerificarClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // Rastrear qué acción específica está en progreso
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const draftKey = `${DRAFT_KEY_PREFIX}${uuid}`
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [dialogPendingAction, setDialogPendingAction] = useState<PendingAction | null>(null)

  // Función para obtener valores iniciales (de localStorage o de props)
  const getInitialValues = useCallback(() => {
    // Intentar cargar borrador de localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(draftKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Verificar que el borrador es válido
          if (parsed && typeof parsed === 'object') {
            return {
              pn: parsed.pn ?? '',
              plh: parsed.plh ?? '',
              pl: parsed.pl ?? '',
              pinu: parsed.pinu ?? '',
              dc: parsed.dc ?? '',
              nulos: parsed.nulos ?? '',
              blancos: parsed.blancos ?? '',
            }
          }
        } catch {
          // Si hay error parseando, ignorar el borrador
          localStorage.removeItem(draftKey)
        }
      }
    }

    // Valores por defecto
    return {
      pn: valoresActuales.pn?.toString() ?? '',
      plh: valoresActuales.plh?.toString() ?? '',
      pl: valoresActuales.pl?.toString() ?? '',
      pinu: valoresActuales.pinu?.toString() ?? '',
      dc: valoresActuales.dc?.toString() ?? '',
      nulos: valoresActuales.nulos?.toString() ?? '',
      blancos: valoresActuales.blancos?.toString() ?? '',
    }
  }, [draftKey, valoresActuales])

  // Estado del formulario - inicializado con valores guardados o por defecto
  const [valores, setValores] = useState(getInitialValues)

  const [showCorrectionForm, setShowCorrectionForm] = useState(false)

  // Guardar borrador en localStorage cada vez que cambian los valores
  useEffect(() => {
    // Solo guardar si hay algún valor ingresado
    const hasValues = Object.values(valores).some((v) => v !== '')
    if (hasValues) {
      localStorage.setItem(draftKey, JSON.stringify(valores))
    }
  }, [valores, draftKey])

  // Función para limpiar el borrador (llamar al guardar exitosamente)
  const clearDraft = useCallback(() => {
    localStorage.removeItem(draftKey)
  }, [draftKey])

  const handleChange = (partido: string, value: string) => {
    setValores((prev) => ({ ...prev, [partido]: value }))
  }

  // Manejar expiración del bloqueo
  const handleLockExpired = () => {
    router.push('/dashboard/verificar?error=expirado')
  }

  // Manejar cuando se llena el último input
  const handleLastInputFilled = () => {
    if (showCorrectionForm) {
      setDialogPendingAction(PendingAction.GUARDAR_SIGUIENTE)
      setShowConfirmationDialog(true)
    }
  }

  // Confirmar y guardar después del diálogo
  const handleConfirmationConfirm = () => {
    setShowConfirmationDialog(false)
    // Determinar qué acción realizar basado en dialogPendingAction
    const action = dialogPendingAction
    setDialogPendingAction(null)

    if (action === PendingAction.GUARDAR_SIGUIENTE || action === PendingAction.SOLO_GUARDAR) {
      const goToNext = action === PendingAction.GUARDAR_SIGUIENTE
      performGuardarCorreccion(goToNext)
    } else if (action === PendingAction.CONFIRMAR || action === PendingAction.CONFIRMAR_SOLO) {
      const goToNext = action === PendingAction.CONFIRMAR
      performConfirmarCorrecto(goToNext)
    } else if (action === PendingAction.CORRECCION) {
      performGuardarCorreccion(true)
    }
  }

  // Editar después de confirmar
  const handleConfirmationEdit = () => {
    setShowConfirmationDialog(false)
    setDialogPendingAction(null)
  }

  // Confirmar valores correctos (validación) - sin diálogo
  const handleConfirmarCorrecto = (goToNext: boolean = true) => {
    // Sin diálogo, guardar directamente
    performConfirmarCorrecto(goToNext)
  }

  // Realizar la acción de confirmar después del diálogo
  const performConfirmarCorrecto = (goToNext: boolean = true) => {
    startTransition(async () => {
      try {
        await guardarValidacion(uuid, { esCorrecta: true })
        // Limpiar borrador después de guardar exitosamente
        clearDraft()
        if (goToNext) {
          await goToNextActa()
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error(error)
      } finally {
        setPendingAction(null)
      }
    })
  }

  // Guardar corrección (validación con cambios)
  const handleGuardarCorreccion = (goToNext: boolean = true) => {
    setDialogPendingAction(goToNext ? PendingAction.GUARDAR_SIGUIENTE : PendingAction.SOLO_GUARDAR)
    setShowConfirmationDialog(true)
  }

  // Realizar la acción de guardar corrección después del diálogo
  const performGuardarCorreccion = (goToNext: boolean = true) => {
    startTransition(async () => {
      try {
        await guardarValidacion(uuid, {
          esCorrecta: false,
          correciones: {
            pn: parseInt(valores.pn) || 0,
            plh: parseInt(valores.plh) || 0,
            pl: parseInt(valores.pl) || 0,
            pinu: parseInt(valores.pinu) || 0,
            dc: parseInt(valores.dc) || 0,
            nulos: parseInt(valores.nulos) || 0,
            blancos: parseInt(valores.blancos) || 0,
          },
        })
        // Limpiar borrador después de guardar exitosamente
        clearDraft()
        if (goToNext) {
          await goToNextActa()
        } else {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error(error)
      } finally {
        setPendingAction(null)
      }
    })
  }

  // Reportar problema
  const handleReportarProblema = async (
    tipo: 'ilegible' | 'adulterada' | 'datos_inconsistentes' | 'imagen_incompleta' | 'otro',
    descripcion?: string
  ) => {
    await reportarProblema(uuid, { tipo, descripcion })
    // Limpiar borrador después de reportar
    clearDraft()
    await goToNextActa()
  }

  // Flag to prevent lock refresh during abandon
  const [isAbandoning, setIsAbandoning] = useState(false)

  // Salir sin guardar (abandonar acta)
  const handleSalir = () => {
    // Set abandoning flag FIRST to prevent any lock refresh
    setIsAbandoning(true)
    setPendingAction(PendingAction.SALIR)
    clearDraft()
    startTransition(async () => {
      try {
        // abandonarActa now uses redirect() internally
        // This prevents Next.js from re-rendering the current page
        await abandonarActa(uuid)
        // If we get here, redirect didn't work (shouldn't happen)
      } catch (error) {
        // redirect() throws NEXT_REDIRECT which is expected
        // Only log actual errors
        if (error instanceof Error && !error.message.includes('NEXT_REDIRECT')) {
          console.error(error)
          setIsAbandoning(false)
          setPendingAction(null)
        }
      }
    })
  }

  // Ir a siguiente acta
  const goToNextActa = async () => {
    const result = await obtenerNuevaActa('validar')
    if (result.success && result.uuid) {
      router.push(`/dashboard/verificar/${result.uuid}`)
    } else if ('pendingUuid' in result && result.pendingUuid) {
      // User still has a pending acta (shouldn't happen, but handle it)
      router.push(`/dashboard/verificar/${result.pendingUuid}`)
    } else {
      router.push('/dashboard/verificar?message=sin-actas')
    }
  }

  const isFormValid =
    valores.pn !== '' &&
    valores.plh !== '' &&
    valores.pl !== '' &&
    valores.pinu !== '' &&
    valores.dc !== ''

  return (
    <div className="space-y-4 py-4 lg:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-green-600" />
            <h1 className="text-xl font-bold">Validar Acta</h1>
          </div>
          <p className="text-sm text-muted-foreground">ID: {actaInfo.cneId}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <LockTimer
            bloqueadoHasta={bloqueadoHasta}
            uuid={uuid}
            onExpired={handleLockExpired}
            disableRefresh={isAbandoning}
          />
          <Badge variant={actaInfo.escrutada ? 'default' : 'secondary'}>
            {actaInfo.escrutada ? 'CNE' : 'Digitado'}
          </Badge>
          <Badge variant="outline">{actaInfo.cantidadValidaciones}/3</Badge>
        </div>
      </div>

      {/* Layout principal: Imagen + Formulario */}
      <div className="lg:grid lg:grid-cols-[1fr_420px] lg:gap-6">
        {/* Imagen */}
        <div className="mb-4 lg:mb-0">
          <Card className="lg:h-full gap-2 pb-0">
            <CardHeader>
              <CardTitle className="text-sm">Información del Acta</CardTitle>
              <div className="text-xs text-muted-foreground">
                {`Departamento: ${actaInfo.departamento}`}
                <br />
                {`Municipio: ${actaInfo.municipio}`}
                <br />
                {`Centro de Votación: ${actaInfo.centro}`}
                <br />
                {`JRV: ${actaInfo.jrv}`}
              </div>
              <CardTitle className="text-sm">Imagen del Acta</CardTitle>
            </CardHeader>
            <CardContent className="px-2 lg:px-4 pb-2 lg:pb-4 gap-2 flex flex-col">
              <ImageViewer src={imagenUrl} alt={`Acta ${actaInfo.cneId}`} />
            </CardContent>
          </Card>
        </div>

        {/* Formulario */}
        <div className="space-y-4 lg:ml-auto">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-sm">
                    {showCorrectionForm ? 'Corregir valores' : 'Verificar valores'}
                  </CardTitle>

                  {!showCorrectionForm && (
                    <p className="text-xs text-muted-foreground font-bold">
                      Fuente de los datos:{' '}
                      {valoresActuales.fuente === 'cne' ? 'CNE' : 'Digitado por usuario'}
                    </p>
                  )}
                </div>
                {!showCorrectionForm && (
                  <ReportDialog onReport={handleReportarProblema} disabled={isPending} compact />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showCorrectionForm ? (
                // Modo corrección
                <VoteInputGroup
                  valoresActuales={{
                    pn: valoresActuales.pn,
                    plh: valoresActuales.plh,
                    pl: valoresActuales.pl,
                    pinu: valoresActuales.pinu,
                    dc: valoresActuales.dc,
                    nulos: valoresActuales.nulos,
                    blancos: valoresActuales.blancos,
                  }}
                  valores={valores}
                  onChange={handleChange}
                  disabled={isPending}
                  showComparison={true}
                  onLastInputFilled={handleLastInputFilled}
                />
              ) : (
                // Modo validación: mostrar valores actuales para confirmar
                <div className="space-y-2">
                  {[
                    // Orden igual al que aparece en las actas presidenciales
                    {
                      label: 'DC',
                      value: valoresActuales.dc,
                      color: 'bg-[#16a34a]',
                      logoPath: '/logos-partidos/DC.png',
                    },
                    {
                      label: 'PL',
                      value: valoresActuales.pl,
                      color: 'bg-[#8b0000]',
                      logoPath: '/logos-partidos/PL.png',
                    },
                    {
                      label: 'PINU',
                      value: valoresActuales.pinu,
                      color: 'bg-[#f97316]',
                      logoPath: '/logos-partidos/PINU.png',
                    },
                    {
                      label: 'PLH',
                      value: valoresActuales.plh,
                      color: 'bg-[#c1121f]',
                      logoPath: '/logos-partidos/PLH.png',
                    },
                    {
                      label: 'PN',
                      value: valoresActuales.pn,
                      color: 'bg-[#0047ab]',
                      logoPath: '/logos-partidos/PNH.png',
                    },
                  ].map((p) => (
                    <div
                      key={p.label}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <Image
                          src={p.logoPath}
                          alt={p.label}
                          width={24}
                          height={24}
                          className="shrink-0 rounded-sm object-contain"
                        />
                        <div className={cn('w-3 h-3 rounded-full', p.color)} />
                        <span className="text-sm font-medium">{p.label}</span>
                      </div>
                      <span className="text-lg font-bold tabular-nums">{p.value ?? '-'}</span>
                    </div>
                  ))}
                  <div className="border-t my-2 pt-2 space-y-2">
                    {[
                      // Orden igual al que aparece en las actas presidenciales
                      { label: 'Blancos', value: valoresActuales.blancos, color: 'bg-gray-400' },
                      { label: 'Nulos', value: valoresActuales.nulos, color: 'bg-gray-600' },
                    ].map((p) => (
                      <div
                        key={p.label}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn('w-3 h-3 rounded-full', p.color)} />
                          <span className="text-sm font-medium">{p.label}</span>
                        </div>
                        <span className="text-lg font-bold tabular-nums">{p.value ?? '-'}</span>
                      </div>
                    ))}
                  </div>
                  {/* Total después de blancos/nulos, igual que en el acta física */}
                  <div className="flex items-center justify-between p-2 bg-muted rounded-lg mt-2">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold tabular-nums">
                      {valoresActuales.total ?? '-'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="space-y-4">
            {showCorrectionForm ? (
              // Acciones para corrección
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  Revisa tus correcciones y guarda los cambios
                </p>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 h-12"
                  disabled={!isFormValid || isPending}
                  onClick={() => handleGuardarCorreccion(true)}
                >
                  {pendingAction === PendingAction.GUARDAR_SIGUIENTE ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5 mr-2" />
                  )}
                  <span className="flex flex-col items-start w-full">
                    <span className="font-semibold">Guardar corrección</span>
                    <span className="text-xs opacity-80">
                      Se guardaran los nuevos valores para su revisión
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 ml-auto" />
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-12 text-muted-foreground"
                  onClick={() => setShowCorrectionForm(false)}
                  disabled={isPending}
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  <span className="flex flex-col w-full items-start">
                    <span className="font-semibold">Cancelar corrección</span>
                    <span className="text-xs opacity-80">No guardar cambios</span>
                  </span>
                </Button>
              </div>
            ) : (
              // Acciones para validación (confirmar o corregir)
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  ¿Los valores mostrados coinciden con el acta?
                </p>

                {/* Botón principal: Confirmar */}
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 h-12"
                  disabled={isPending}
                  onClick={() => handleConfirmarCorrecto(true)}
                >
                  {pendingAction === PendingAction.CONFIRMAR ? (
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5 mr-2" />
                  )}
                  <span className="flex flex-col w-full items-start">
                    <span className="font-semibold">Confirmar</span>
                    <span className="text-xs opacity-80">Sí, los valores son correctos</span>
                  </span>
                  <ChevronRight className="h-5 w-5 ml-auto" />
                </Button>

                {/* Botón de corrección */}
                <Button
                  variant="outline"
                  className="w-full h-12 border-amber-500 text-amber-600 hover:bg-amber-500/10"
                  onClick={() => setShowCorrectionForm(true)}
                  disabled={isPending}
                >
                  <PenLine className="h-5 w-5 mr-2" />
                  <span className="flex flex-col w-full items-start">
                    <span className="font-semibold">Corregir</span>
                    <span className="text-xs opacity-80">No, hay errores en los valores</span>
                  </span>
                </Button>
              </div>
            )}

            {/* Separador y botón salir */}
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                className="w-full h-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={handleSalir}
                disabled={isPending}
                aria-label="Salir sin guardar"
              >
                {pendingAction === PendingAction.SALIR ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <ArrowLeft className="h-5 w-5 mr-2" />
                )}
                <span className="flex flex-col w-full items-start">
                  <span className="font-semibold">Abandonar Acta</span>
                  <span className="text-xs opacity-80">No guardar cambios</span>
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationDialog
        open={showConfirmationDialog}
        onConfirm={handleConfirmationConfirm}
        onEdit={handleConfirmationEdit}
        valores={valores}
        valoresActuales={valoresActuales}
        showComparison={true}
      />
    </div>
  )
}
