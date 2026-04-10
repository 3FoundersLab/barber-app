'use client'

import { useEffect, useRef, useState } from 'react'
import { ImageIcon, Upload, X } from 'lucide-react'
import { AvatarCropDialog } from '@/components/shared/avatar-crop-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { uploadBarbeiroFoto } from '@/lib/supabase/upload-barbeiro-foto'
import { validateAvatarSourceFile } from '@/lib/image/validate-avatar-source'
import { cn } from '@/lib/utils'

type BarbeiroFotoUploadProps = {
  barbeariaId: string
  /** Null enquanto o cadastro ainda não foi salvo — a foto fica pendente no estado do formulário. */
  barbeiroId: string | null
  remoteAvatarUrl: string
  pendingWebpFile: File | null
  onRemoteAvatarUrlChange: (url: string) => void
  onPendingWebpFileChange: (file: File | null) => void
  fallbackLetter: string
  disabled?: boolean
  onError: (message: string | null) => void
  className?: string
}

export function BarbeiroFotoUpload({
  barbeariaId,
  barbeiroId,
  remoteAvatarUrl,
  pendingWebpFile,
  onRemoteAvatarUrlChange,
  onPendingWebpFileChange,
  fallbackLetter,
  disabled,
  onError,
  className,
}: BarbeiroFotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cropSrcRef = useRef<string | null>(null)
  const pendingRevokeRef = useRef<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [localBlobPreview, setLocalBlobPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!pendingWebpFile) {
      setLocalBlobPreview(null)
      return
    }
    const url = URL.createObjectURL(pendingWebpFile)
    setLocalBlobPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingWebpFile])

  const revokePendingOrActive = () => {
    if (pendingRevokeRef.current) {
      URL.revokeObjectURL(pendingRevokeRef.current)
      pendingRevokeRef.current = null
    }
    if (cropSrcRef.current) {
      URL.revokeObjectURL(cropSrcRef.current)
      cropSrcRef.current = null
    }
    setCropSrc(null)
  }

  const revokeCropSrcImmediate = () => {
    revokePendingOrActive()
  }

  const closeCrop = (open: boolean) => {
    setCropOpen(open)
    if (!open) {
      const url = cropSrcRef.current
      cropSrcRef.current = null
      setCropSrc(null)
      if (url) {
        pendingRevokeRef.current = url
        window.setTimeout(() => {
          const pending = pendingRevokeRef.current
          if (pending) {
            URL.revokeObjectURL(pending)
            pendingRevokeRef.current = null
          }
        }, 0)
      }
    }
  }

  useEffect(() => {
    return () => {
      revokePendingOrActive()
    }
  }, [])

  const pickFile = () => {
    onError(null)
    inputRef.current?.click()
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || disabled) return

    onError(null)
    const validation = await validateAvatarSourceFile(file)
    if (!validation.ok) {
      onError(validation.message)
      return
    }

    revokeCropSrcImmediate()
    const url = URL.createObjectURL(file)
    cropSrcRef.current = url
    setCropSrc(url)
    setCropOpen(true)
  }

  const handleCroppedFile = async (file: File) => {
    if (!barbeiroId) {
      onPendingWebpFileChange(file)
      onRemoteAvatarUrlChange('')
      return
    }

    setIsUploading(true)
    onError(null)
    const supabase = createClient()
    const result = await uploadBarbeiroFoto(supabase, barbeariaId, barbeiroId, file)
    setIsUploading(false)

    if ('error' in result) {
      onError(result.error)
      return
    }
    onPendingWebpFileChange(null)
    onRemoteAvatarUrlChange(result.publicUrl)
  }

  const clearFoto = () => {
    onError(null)
    onPendingWebpFileChange(null)
    onRemoteAvatarUrlChange('')
  }

  const previewSrc = localBlobPreview || remoteAvatarUrl || undefined
  const hasFoto = Boolean(pendingWebpFile || remoteAvatarUrl.replace(/\?v=\d+$/, ''))

  return (
    <div className={cn('space-y-3', className)}>
      <AvatarCropDialog
        open={cropOpen}
        onOpenChange={closeCrop}
        imageSrc={cropSrc}
        onCroppedFile={handleCroppedFile}
        onError={(msg) => onError(msg)}
      />

      <Label className="flex items-center gap-1">
        <ImageIcon className="h-3.5 w-3.5" />
        Foto do barbeiro
      </Label>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar key={previewSrc || 'empty'} className="h-20 w-20 ring-2 ring-border">
          <AvatarImage src={previewSrc} />
          <AvatarFallback className="text-xl">{fallbackLetter}</AvatarFallback>
        </Avatar>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleFile}
            disabled={disabled || isUploading || cropOpen}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={pickFile}
            disabled={disabled || isUploading || cropOpen || !barbeariaId}
          >
            {isUploading ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Enviar imagem
          </Button>
          {hasFoto ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFoto}
              disabled={disabled || isUploading || cropOpen}
            >
              <X className="mr-2 h-4 w-4" />
              Remover
            </Button>
          ) : null}
        </div>
      </div>

      {!barbeiroId ? (
        <p className="text-xs text-muted-foreground">
          Após salvar o cadastro, a foto será enviada automaticamente (ou envie de novo na edição).
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          JPG, PNG, GIF ou WebP · até 10 MB · recorte quadrado · envio em WebP (~512 px)
        </p>
      )}
    </div>
  )
}
