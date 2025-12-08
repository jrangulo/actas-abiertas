'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { obtenerNuevaActa } from '@/lib/actas/actions'
import { FileCheck, CheckSquare, Loader2 } from 'lucide-react'

interface StartButtonProps {
  modo: 'digitalizar' | 'validar'
}

export function StartButton({ modo }: StartButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleStart = () => {
    startTransition(async () => {
      const result = await obtenerNuevaActa(modo)

      if (result.success && result.uuid) {
        router.push(`/dashboard/verificar/${result.uuid}`)
      } else {
        // No hay actas disponibles
        router.push('/dashboard/verificar?message=sin-actas')
      }
    })
  }

  if (modo === 'digitalizar') {
    return (
      <Button
        className="w-full bg-[#0069b4] hover:bg-[#004a7c]"
        onClick={handleStart}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileCheck className="mr-2 h-4 w-4" />
        )}
        {isPending ? 'Buscando acta...' : 'Comenzar a digitalizar'}
      </Button>
    )
  }

  return (
    <Button variant="outline" className="w-full" onClick={handleStart} disabled={isPending}>
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CheckSquare className="mr-2 h-4 w-4" />
      )}
      {isPending ? 'Buscando acta...' : 'Comenzar a validar'}
    </Button>
  )
}
