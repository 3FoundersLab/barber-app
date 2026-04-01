'use client'

import { useRef, useState } from 'react'
import { ImageIcon, Upload, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { uploadProfileAvatar } from '@/lib/supabase/upload-profile-avatar'
import { cn } from '@/lib/utils'

type ProfileAvatarUploadProps = {
  userId: string
  /** URL atual (pode incluir query de cache-bust) */
  avatarUrl: string
  onAvatarUrlChange: (url: string) => void
  fallbackLetter: string
  disabled?: boolean
  /** Erros de upload são repassados para a página (ex.: Card de erro) */
  onError: (message: string | null) => void
  className?: string
}

export function ProfileAvatarUpload({
  userId,
  avatarUrl,
  onAvatarUrlChange,
  fallbackLetter,
  disabled,
  onError,
  className,
}: ProfileAvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const pickFile = () => {
    onError(null)
    inputRef.current?.click()
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || disabled) return

    setIsUploading(true)
    onError(null)
    const supabase = createClient()
    const result = await uploadProfileAvatar(supabase, userId, file)
    setIsUploading(false)

    if ('error' in result) {
      onError(result.error)
      return
    }
    onAvatarUrlChange(result.publicUrl)
  }

  const clearAvatar = () => {
    onError(null)
    onAvatarUrlChange('')
  }

  /** Remove só sufixo ?v=timestamp (cache do nosso upload) no campo de texto. */
  const displayUrl = avatarUrl.replace(/\?v=\d+$/, '')
  /** Preview usa URL completa para bust de cache após novo upload. */
  const previewSrc = avatarUrl || undefined

  return (
    <div className={cn('space-y-3', className)}>
      <Label className="flex items-center gap-1">
        <ImageIcon className="h-3.5 w-3.5" />
        Foto do perfil
      </Label>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar key={avatarUrl || 'empty'} className="h-20 w-20 ring-2 ring-border">
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
            disabled={disabled || isUploading}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={pickFile}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Enviar imagem
          </Button>
          {avatarUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAvatar}
              disabled={disabled || isUploading}
            >
              <X className="mr-2 h-4 w-4" />
              Remover
            </Button>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        JPG, PNG, WebP ou GIF · até 2 MB
      </p>

      <div className="space-y-2">
        <Label htmlFor="avatar-url" className="text-muted-foreground">
          Ou cole uma URL
        </Label>
        <Input
          id="avatar-url"
          value={displayUrl}
          onChange={(e) => onAvatarUrlChange(e.target.value.trim())}
          placeholder="https://..."
          inputMode="url"
          disabled={disabled}
        />
      </div>
    </div>
  )
}
