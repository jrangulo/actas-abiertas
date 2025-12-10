import Link from 'next/link'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted mb-6">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>

        {/* Message */}
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <h2 className="text-xl font-semibold mb-4">Página no encontrada</h2>
        <p className="text-muted-foreground mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href="javascript:history.back()">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver atrás
            </Link>
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
