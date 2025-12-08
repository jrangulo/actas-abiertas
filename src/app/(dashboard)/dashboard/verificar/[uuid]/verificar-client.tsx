'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ImageViewer, VoteInputGroup, ReportDialog, LockTimer } from '@/components/verificar'
import {
  guardarDigitalizacion,
  guardarValidacion,
  reportarProblema,
  obtenerNuevaActa,
} from '@/lib/actas/actions'
import { Check, ChevronRight, Loader2, PenLine, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

// Clave para guardar valores en localStorage
const DRAFT_KEY_PREFIX = 'acta-draft-'

interface VerificarClientProps {
  uuid: string
  modo: 'digitalizar' | 'validar'
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
  modo,
  bloqueadoHasta,
  actaInfo,
  valoresActuales,
  imagenUrl,
}: VerificarClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // Rastrear qué acción específica está en progreso
  const [pendingAction, setPendingAction] = useState<
    'guardar-siguiente' | 'solo-guardar' | 'confirmar' | 'confirmar-solo' | 'correccion' | null
  >(null)
  const draftKey = `${DRAFT_KEY_PREFIX}${uuid}`

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

    // Valores por defecto según el modo
    return {
      pn: modo === 'validar' ? (valoresActuales.pn?.toString() ?? '') : '',
      plh: modo === 'validar' ? (valoresActuales.plh?.toString() ?? '') : '',
      pl: modo === 'validar' ? (valoresActuales.pl?.toString() ?? '') : '',
      pinu: modo === 'validar' ? (valoresActuales.pinu?.toString() ?? '') : '',
      dc: modo === 'validar' ? (valoresActuales.dc?.toString() ?? '') : '',
      nulos: modo === 'validar' ? (valoresActuales.nulos?.toString() ?? '') : '',
      blancos: modo === 'validar' ? (valoresActuales.blancos?.toString() ?? '') : '',
    }
  }, [draftKey, modo, valoresActuales])

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

  // Guardar digitalización y siguiente
  const handleGuardarDigitalizacion = (goToNext: boolean = true) => {
    setPendingAction(goToNext ? 'guardar-siguiente' : 'solo-guardar')
    startTransition(async () => {
      try {
        await guardarDigitalizacion(uuid, {
          pn: parseInt(valores.pn) || 0,
          plh: parseInt(valores.plh) || 0,
          pl: parseInt(valores.pl) || 0,
          pinu: parseInt(valores.pinu) || 0,
          dc: parseInt(valores.dc) || 0,
          nulos: parseInt(valores.nulos) || 0,
          blancos: parseInt(valores.blancos) || 0,
        })
        // Limpiar borrador después de guardar exitosamente
        clearDraft()
        if (goToNext) {
          await goToNextActa('digitalizar')
        } else {
          // Ir al dashboard
          router.push('/dashboard')
        }
      } catch (error) {
        console.error(error)
        // TODO: Mostrar error al usuario
      } finally {
        setPendingAction(null)
      }
    })
  }

  // Confirmar valores correctos (validación)
  const handleConfirmarCorrecto = (goToNext: boolean = true) => {
    setPendingAction(goToNext ? 'confirmar' : 'confirmar-solo')
    startTransition(async () => {
      try {
        await guardarValidacion(uuid, { esCorrecta: true })
        // Limpiar borrador después de guardar exitosamente
        clearDraft()
        if (goToNext) {
          await goToNextActa('validar')
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
    setPendingAction(goToNext ? 'guardar-siguiente' : 'solo-guardar')
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
          await goToNextActa('validar')
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
    await goToNextActa(modo)
  }

  // Ir a siguiente acta
  const goToNextActa = async (nextModo: 'digitalizar' | 'validar') => {
    const result = await obtenerNuevaActa(nextModo)
    if (result.success && result.uuid) {
      router.push(`/dashboard/verificar/${result.uuid}`)
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
            {modo === 'digitalizar' ? (
              <PenLine className="h-5 w-5 text-[#0069b4]" />
            ) : (
              <CheckSquare className="h-5 w-5 text-green-600" />
            )}
            <h1 className="text-xl font-bold">
              {modo === 'digitalizar' ? 'Digitalizar Acta' : 'Validar Acta'}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">ID: {actaInfo.cneId}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <LockTimer bloqueadoHasta={bloqueadoHasta} uuid={uuid} onExpired={handleLockExpired} />
          <Badge variant={actaInfo.escrutada ? 'default' : 'secondary'}>
            {actaInfo.escrutada ? 'CNE' : 'Por digitalizar'}
          </Badge>
          {modo === 'validar' && <Badge variant="outline">{actaInfo.cantidadValidaciones}/3</Badge>}
        </div>
      </div>

      {/* Layout principal: Imagen + Formulario */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        {/* Imagen */}
        <div className="mb-4 lg:mb-0">
          <Card className="lg:h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Imagen del Acta</CardTitle>
            </CardHeader>
            <CardContent className="p-2 lg:p-4">
              <ImageViewer src={imagenUrl} alt={`Acta ${actaInfo.cneId}`} />
            </CardContent>
          </Card>
        </div>

        {/* Formulario */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm">
                    {modo === 'digitalizar'
                      ? 'Ingresa los votos'
                      : showCorrectionForm
                        ? 'Corregir valores'
                        : 'Verificar valores'}
                  </CardTitle>
                  {modo === 'validar' && !showCorrectionForm && (
                    <p className="text-xs text-muted-foreground">
                      Fuente: {valoresActuales.fuente === 'cne' ? 'CNE' : 'Digitado por usuario'}
                    </p>
                  )}
                </div>
                {!showCorrectionForm && (
                  <ReportDialog onReport={handleReportarProblema} disabled={isPending} compact />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {modo === 'digitalizar' ? (
                // Modo digitalización: formulario vacío
                <VoteInputGroup
                  valoresActuales={{
                    pn: null,
                    plh: null,
                    pl: null,
                    pinu: null,
                    dc: null,
                    nulos: null,
                    blancos: null,
                  }}
                  valores={valores}
                  onChange={handleChange}
                  disabled={isPending}
                  showComparison={false}
                />
              ) : showCorrectionForm ? (
                // Modo validación con corrección
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
                />
              ) : (
                // Modo validación: mostrar valores actuales para confirmar
                <div className="space-y-2">
                  {[
                    // Orden igual al que aparece en las actas presidenciales
                    { label: 'DC', value: valoresActuales.dc, color: 'bg-[#16a34a]' },
                    { label: 'PL', value: valoresActuales.pl, color: 'bg-[#8b0000]' },
                    { label: 'PINU', value: valoresActuales.pinu, color: 'bg-[#f97316]' },
                    { label: 'PLH', value: valoresActuales.plh, color: 'bg-[#c1121f]' },
                    { label: 'PN', value: valoresActuales.pn, color: 'bg-[#0047ab]' },
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
          <div className="space-y-3">
            {modo === 'digitalizar' ? (
              // Acciones para digitalización
              <>
                <Button
                  className="w-full bg-[#0069b4] hover:bg-[#004a7c]"
                  disabled={!isFormValid || isPending}
                  onClick={() => handleGuardarDigitalizacion(true)}
                >
                  {pendingAction === 'guardar-siguiente' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Guardar y siguiente
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={!isFormValid || isPending}
                  onClick={() => handleGuardarDigitalizacion(false)}
                >
                  {pendingAction === 'solo-guardar' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Guardar y salir
                </Button>
              </>
            ) : showCorrectionForm ? (
              // Acciones para corrección
              <>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!isFormValid || isPending}
                  onClick={() => handleGuardarCorreccion(true)}
                >
                  {pendingAction === 'guardar-siguiente' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Guardar y siguiente
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={!isFormValid || isPending}
                  onClick={() => handleGuardarCorreccion(false)}
                >
                  {pendingAction === 'solo-guardar' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Guardar y salir
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowCorrectionForm(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              // Acciones para validación (confirmar o corregir)
              <>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isPending}
                  onClick={() => handleConfirmarCorrecto(true)}
                >
                  {pendingAction === 'confirmar' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Valores correctos
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isPending}
                  onClick={() => handleConfirmarCorrecto(false)}
                >
                  {pendingAction === 'confirmar-solo' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Valores correctos (y salir)
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCorrectionForm(true)}
                  disabled={isPending}
                >
                  <PenLine className="h-4 w-4 mr-2" />
                  Hay diferencias
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
