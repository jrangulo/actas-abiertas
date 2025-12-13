'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, BarChart3, Newspaper, ArrowRight } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useEffect, useCallback } from 'react'

// Force dynamic rendering - never cache this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Helper function for random range
function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min
}

export default function CompletedPage({ position }: Readonly<{ position: number }>) {
  let positionText: string | undefined
  if (position === 1) {
    positionText = 'primero'
  } else if (position === 2) {
    positionText = 'segundo'
  } else if (position === 3) {
    positionText = 'tercero'
  }

  const fireCompletionConfetti = useCallback(() => {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = {
      startVelocity: 30,
      spread: 360,
      ticks: 60,
      zIndex: 0,
      disableForReducedMotion: true,
    }

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      // Left side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#fbbf24', '#f59e0b', '#eab308', '#facc15', '#fde047'],
      })

      // Right side
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#fbbf24', '#f59e0b', '#eab308', '#facc15', '#fde047'],
      })
    }, 250)
  }, [])

  const handleCardHover = () => {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#eab308', '#facc15', '#fde047'],
      disableForReducedMotion: true,
    })
  }

  // Fire confetti on mount (only once)
  useEffect(() => {
    fireCompletionConfetti()
  }, [fireCompletionConfetti])

  return (
    <div className="space-y-6 py-4 lg:py-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">¡Gracias por tu participación!</h1>
        <p className="text-muted-foreground">Tu contribución nos ha ayudado llegar a la meta</p>
      </div>

      {/* First two cards side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Thank you and celebrate achievement */}
        <Card
          className="transition-all duration-200 hover:shadow-lg"
          onMouseEnter={handleCardHover}
        >
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-lg">¡Gracias por tu ayuda!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground">
              Gracias por participar en la verificación de actas. Terminaste
              {positionText ? ` ${positionText}` : ` en la posición ${position}`} entre todos los
              contribuyentes. Tu esfuerzo nos ha ayudado a crear un registro transparente e
              independiente de los resultados electorales de Honduras. Cada una de las actas que
              validaste contribuyó a la democracia y la transparencia.
            </p>
          </CardContent>
        </Card>

        {/* Card: Redirect to estadisticas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Ver resultados
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <p className="text-sm text-muted-foreground">
              Explora las estadísticas y resultados de las actas verificadas. Compara los datos del
              CNE con nuestros datos validados y descubrí el impacto de tu contribución.
            </p>
            <div className="flex justify-start w-full pt-4">
              <Button asChild>
                <Link href="/dashboard/estadisticas">
                  Ver estadísticas
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third card takes full width */}
      <Card className="max-w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-purple-600" />
              Mantente informado
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <p className="text-sm text-muted-foreground">
            Mantente al día con las últimas actualizaciones, noticias y análisis sobre el proyecto
            Actas Abiertas. Descubre nuevos hallazgos, mejoras en la plataforma y más contenido
            relevante.
          </p>
          <div className="flex justify-start w-full pt-4">
            <Button asChild variant="outline">
              <Link href="/dashboard/blog">
                Visitar blog
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
