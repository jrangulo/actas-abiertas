'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { obtenerNuevaActa } from '@/lib/actas/actions'
import { FileCheck, Loader2 } from 'lucide-react'

export function StartButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleStart = () => {
    startTransition(async () => {
      const result = await obtenerNuevaActa('validar')

      if (result.success && result.uuid) {
        router.push(`/dashboard/verificar/${result.uuid}`)
      } else if ('pendingUuid' in result && result.pendingUuid) {
        // User already has a pending acta - redirect to it
        router.push(`/dashboard/verificar/${result.pendingUuid}`)
      } else {
        // No hay actas disponibles
        router.push('/dashboard/verificar?message=sin-actas')
      }
    })
  }

  return (
    <Button
      variant="outline"
      className="w-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white dark:border-green-500 dark:text-green-500 dark:hover:bg-green-600 dark:hover:text-white cursor-pointer"
      onClick={handleStart}
      size="lg"
      disabled={isPending}
      aria-label="Comenzar a validar acta"
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileCheck className="mr-2 h-4 w-4" />
      )}
      {isPending ? 'Buscando acta...' : 'Comenzar a validar'}
    </Button>
  )
}
