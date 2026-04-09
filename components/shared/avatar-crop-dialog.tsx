'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Spinner } from '@/components/ui/spinner'
import {
  avatarWebpProcessingErrorMessage,
  cropImageToAvatarWebpFile,
} from '@/lib/image/crop-and-encode-avatar-webp'

type AvatarCropDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string | null
  onCroppedFile: (file: File) => void | Promise<void>
  onError: (message: string) => void
}

export function AvatarCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onCroppedFile,
  onError,
}: AvatarCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const croppedAreaPixelsRef = useRef<Area | null>(null)

  useEffect(() => {
    if (!open || !imageSrc) return
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    croppedAreaPixelsRef.current = null
  }, [open, imageSrc])

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    croppedAreaPixelsRef.current = areaPixels
  }, [])

  const handleApply = async () => {
    if (!imageSrc) return
    const pixels = croppedAreaPixelsRef.current
    if (!pixels) {
      onError('Aguarde o carregamento do recorte ou ajuste a imagem.')
      return
    }
    setIsProcessing(true)
    try {
      const file = await cropImageToAvatarWebpFile(imageSrc, pixels)
      await onCroppedFile(file)
      onOpenChange(false)
    } catch (err) {
      const code = err instanceof Error ? err.message : ''
      onError(avatarWebpProcessingErrorMessage(code))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && isProcessing) return
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] sm:max-w-xl"
        showCloseButton={!isProcessing}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Ajustar foto do perfil</DialogTitle>
          <DialogDescription>
            Arraste para posicionar. A foto será recortada em quadrado, convertida para WebP e otimizada
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        {imageSrc ? (
          <div className="space-y-4">
            <div className="relative h-56 w-full overflow-hidden rounded-lg bg-muted sm:h-64 md:h-72">
              <Cropper
                key={imageSrc}
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Zoom</Label>
              <Slider
                min={1}
                max={3}
                step={0.02}
                value={[zoom]}
                onValueChange={(v) => setZoom(v[0] ?? 1)}
                disabled={isProcessing}
              />
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleApply} disabled={isProcessing || !imageSrc}>
            {isProcessing ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Processando…
              </>
            ) : (
              'Aplicar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
