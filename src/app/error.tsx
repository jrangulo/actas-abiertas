'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console (or send to error tracking service)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-100 dark:bg-red-900/30 mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold mb-2">Algo salió mal</h1>
        <p className="text-muted-foreground mb-6">
          Ocurrió un error inesperado. Por favor intenta de nuevo o vuelve al inicio.
        </p>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="text-xs text-muted-foreground mb-6 font-mono bg-muted px-3 py-2 rounded">
            Código de error: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Intentar de nuevo
          </Button>
          <Button asChild className="bg-[#0069b4] hover:bg-[#004a7c]">
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Ir al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
