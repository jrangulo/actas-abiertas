'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  FileCheck,
  Shield,
  Users,
  Eye,
  EyeOff,
  ChevronRight,
  Loader2,
  PartyPopper,
} from 'lucide-react'
import { completarOnboardingConPrivacidad } from '@/lib/users/actions'
import { cn } from '@/lib/utils'

interface WelcomeModalProps {
  userName?: string
  isOpen: boolean
}

export function WelcomeModal({ userName, isOpen }: WelcomeModalProps) {
  const [step, setStep] = useState(0)
  const [privacyEnabled, setPrivacyEnabled] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(isOpen)

  const handleComplete = () => {
    startTransition(async () => {
      await completarOnboardingConPrivacidad(privacyEnabled)
      setOpen(false)
    })
  }

  const steps = [
    // Step 0: Bienvenida
    {
      icon: <PartyPopper className="h-12 w-12 text-[#0069b4]" />,
      title: `¡Bienvenido${userName ? `, ${userName.split(' ')[0]}` : ''}!`,
      content: (
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Gracias por unirte a <strong>Actas Abiertas</strong>, un proyecto de observación
            ciudadana independiente.
          </p>
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#0069b4]/10 flex items-center justify-center mb-2">
                <FileCheck className="h-6 w-6 text-[#0069b4]" />
              </div>
              <p className="text-xs text-muted-foreground">Digitaliza actas</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground">Valida con otros</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
              <p className="text-xs text-muted-foreground">Garantiza precisión</p>
            </div>
          </div>
        </div>
      ),
    },
    // Step 1: Privacidad
    {
      icon: <Shield className="h-12 w-12 text-[#0069b4]" />,
      title: 'Tu privacidad importa',
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground text-center">
            Antes de comenzar, queremos que sepas qué datos guardamos y cómo puedes controlar tu
            visibilidad.
          </p>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-green-600 text-xs">✓</span>
              </div>
              <div>
                <p className="font-medium">Lo que guardamos</p>
                <p className="text-muted-foreground">
                  Tu nombre, foto de perfil y estadísticas de actividad
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-red-600 text-xs">✗</span>
              </div>
              <div>
                <p className="font-medium">Lo que NO compartimos</p>
                <p className="text-muted-foreground">Tu correo electrónico es siempre privado</p>
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    privacyEnabled
                      ? 'bg-amber-100 dark:bg-amber-900/30'
                      : 'bg-green-100 dark:bg-green-900/30'
                  )}
                >
                  {privacyEnabled ? (
                    <EyeOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <Label htmlFor="privacy-onboarding" className="font-medium cursor-pointer">
                  Modo anónimo
                </Label>
              </div>
              <Switch
                id="privacy-onboarding"
                checked={privacyEnabled}
                onCheckedChange={setPrivacyEnabled}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {privacyEnabled
                ? 'Tu nombre y foto estarán ocultos en los rankings públicos'
                : 'Tu nombre y foto serán visibles en los rankings públicos'}
            </p>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Puedes cambiar esto en cualquier momento desde tu perfil.
          </p>
        </div>
      ),
    },
  ]

  const currentStep = steps[step]
  const isLastStep = step === steps.length - 1

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        showCloseButton={false}
      >
        <DialogHeader className="text-center items-center shrink-0">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-[#0069b4]/10 flex items-center justify-center mb-2">
            {currentStep.icon}
          </div>
          <DialogTitle className="text-xl">{currentStep.title}</DialogTitle>
          <DialogDescription className="sr-only">
            Bienvenida y configuración de privacidad
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 overflow-y-auto flex-1 min-h-0">{currentStep.content}</div>

        {/* Indicadores de paso */}
        <div className="flex justify-center gap-2 py-2 shrink-0">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                i === step ? 'bg-[#0069b4]' : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Botones */}
        <div className="flex gap-3 shrink-0">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              Atrás
            </Button>
          )}
          {isLastStep ? (
            <Button
              onClick={handleComplete}
              disabled={isPending}
              className="flex-1 bg-[#0069b4] hover:bg-[#004a7c]"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              Comenzar
            </Button>
          ) : (
            <Button
              onClick={() => setStep(step + 1)}
              className="flex-1 bg-[#0069b4] hover:bg-[#004a7c]"
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
