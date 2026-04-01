import type { SupabaseClient } from '@supabase/supabase-js'

export const AVATARS_BUCKET = 'avatars'

/** Limite alinhado ao uso em perfil (evita abusos no bucket). */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export function avatarFileExtension(file: File): string | null {
  return MIME_TO_EXT[file.type] ?? null
}

/**
 * Envia a imagem para `avatars/{userId}/profile` (substitui versão anterior).
 * Requer bucket `avatars` e políticas do script 010_storage_avatars.sql.
 */
export async function uploadProfileAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ publicUrl: string } | { error: string }> {
  if (file.size > AVATAR_MAX_BYTES) {
    return { error: 'A imagem deve ter no máximo 2 MB.' }
  }
  if (!avatarFileExtension(file)) {
    return { error: 'Use JPG, PNG, WebP ou GIF.' }
  }

  const path = `${userId}/profile`
  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || 'image/jpeg',
    })

  if (uploadError) {
    return {
      error:
        'Não foi possível enviar a imagem. Verifique no Supabase o bucket "avatars" e as políticas de storage.',
    }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path)

  const cacheBust = `${publicUrl}?v=${Date.now()}`
  return { publicUrl: cacheBust }
}
