'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'

interface ImageViewerProps {
  src: string
  alt: string
}

export function ImageViewer({ src, alt }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)
  const handleReset = () => {
    setZoom(1)
    setRotation(0)
  }

  return (
    <div className="space-y-2">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
              <div className="relative w-full h-[90vh] overflow-auto bg-black">
                <Image src={src} alt={alt} fill className="object-contain" unoptimized />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Image */}
      <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain cursor-grab active:cursor-grabbing"
            unoptimized
            onClick={handleReset}
          />
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Clic en la imagen para restablecer zoom
      </p>
    </div>
  )
}
