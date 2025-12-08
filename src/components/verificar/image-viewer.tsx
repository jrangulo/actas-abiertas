'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Maximize2, ZoomIn, ZoomOut, RotateCw, FileImage } from 'lucide-react'

interface ImageViewerProps {
  src: string
  alt: string
}

/**
 * Visor de imagen para móvil - Solo muestra un botón que abre la imagen en pantalla completa
 */
export function MobileImageViewer({ src, alt }: ImageViewerProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-24 border-dashed">
          <div className="flex flex-col items-center gap-2">
            <FileImage className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">Ver imagen del acta</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 border-0">
        <DialogTitle className="sr-only">Imagen del acta</DialogTitle>
        <FullscreenImageViewer src={src} alt={alt} />
      </DialogContent>
    </Dialog>
  )
}

/**
 * Visor de imagen para desktop - Imagen inline con controles
 */
export function DesktopImageViewer({ src, alt }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)

  return (
    <div className="relative w-full bg-muted rounded-lg overflow-hidden">
      {/* Imagen principal - altura completa en desktop */}
      <div className="relative h-[calc(100vh-280px)] min-h-[400px] overflow-auto">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
            draggable={false}
          />
        </div>
      </div>

      {/* Controles */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <div className="flex gap-1">
          <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="h-8 w-8" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Botón de pantalla completa */}
        <Dialog>
          <DialogTrigger asChild>
            <Button size="icon" variant="secondary" className="h-8 w-8">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 border-0">
            <DialogTitle className="sr-only">Imagen del acta en pantalla completa</DialogTitle>
            <FullscreenImageViewer src={src} alt={alt} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

/**
 * Visor en pantalla completa con todos los controles
 * Soporta pinch-to-zoom en móvil
 */
function FullscreenImageViewer({ src, alt }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null)
  const [initialZoom, setInitialZoom] = useState(1)

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.5, 5))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.5, 0.5))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  // Calcular distancia entre dos puntos touch
  const getDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    )
  }

  // Touch handlers para móvil con pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch gesture start
      setInitialPinchDistance(getDistance(e.touches))
      setInitialZoom(zoom)
    } else if (e.touches.length === 1) {
      // Pan gesture
      setIsDragging(true)
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance) {
      // Pinch gesture - zoom
      const currentDistance = getDistance(e.touches)
      const scale = currentDistance / initialPinchDistance
      const newZoom = Math.min(Math.max(initialZoom * scale, 0.5), 5)
      setZoom(newZoom)
    } else if (isDragging && e.touches.length === 1) {
      // Pan gesture
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    setInitialPinchDistance(null)
  }

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      {/* Controles superiores */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-center gap-2 flex-wrap safe-area-pt">
        <Button size="sm" variant="secondary" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Alejar</span>
        </Button>
        <span className="text-white text-sm bg-black/50 px-2 py-1 rounded">
          {Math.round(zoom * 100)}%
        </span>
        <Button size="sm" variant="secondary" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Acercar</span>
        </Button>
        <Button size="sm" variant="secondary" onClick={handleRotate}>
          <RotateCw className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Rotar</span>
        </Button>
        <Button size="sm" variant="outline" onClick={handleReset}>
          Restablecer
        </Button>
      </div>

      {/* Imagen - objeto-contain para que siempre quepa completa */}
      <div
        className="flex-1 overflow-hidden cursor-move flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full object-contain transition-transform duration-100 select-none touch-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
          }}
          draggable={false}
        />
      </div>

      {/* Instrucciones */}
      <div className="absolute bottom-4 left-4 right-4 text-center safe-area-pb">
        <p className="text-white/60 text-sm">
          {zoom > 1 ? 'Arrastra para mover' : 'Pellizca para hacer zoom'}
        </p>
      </div>
    </div>
  )
}

/**
 * Componente adaptativo que muestra diferente UI en móvil vs desktop
 */
export function ImageViewer({ src, alt }: ImageViewerProps) {
  return (
    <>
      {/* Móvil: Solo botón para abrir fullscreen */}
      <div className="lg:hidden">
        <MobileImageViewer src={src} alt={alt} />
      </div>

      {/* Desktop: Visor inline */}
      <div className="hidden lg:block">
        <DesktopImageViewer src={src} alt={alt} />
      </div>
    </>
  )
}
