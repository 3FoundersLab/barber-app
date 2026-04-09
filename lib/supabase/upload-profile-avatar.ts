import type { SupabaseClient } from '@supabase/supabase-js'
import { AVATAR_WEBP_MAX_BYTES } from '@/lib/image/avatar-image-constants'
import { sniffImageKind } from '@/lib/image/sniff-image-kind'

export const AVATARS_BUCKET = 'avatars'

/**
 * Limite do arquivo já processado (WebP ~512px) enviado ao storage.
 * Mantém margem acima do teto de compressão do pipeline.
 */
export const AVATAR_MAX_BYTES = Math.max(AVATAR_WEBP_MAX_BYTES + 128 * 1024, 600 * 1024)

const HEAD_BYTES = 16

function isDeclaredWebp(file: File): boolean {
  return file.type === 'image/webp' || /\.webp$/i.test(file.name)
}

/**
 * Confere assinatura WebP no buffer (defesa após processamento no cliente).
 */
export async function assertAvatarWebpFile(file: File): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isDeclaredWebp(file)) {
    return { ok: false, error: 'Apenas imagens WebP processadas pelo app são aceitas no envio.' }
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return { ok: false, error: `O arquivo final deve ter no máximo ${Math.round(AVATAR_MAX_BYTES / 1024)} KB.` }
  }
  const head = await file.slice(0, HEAD_BYTES).arrayBuffer()
  if (sniffImageKind(head) !== 'webp') {
    return { ok: false, error: 'O arquivo não é um WebP válido.' }
  }
  return { ok: true }
}

/**
 * Envia WebP para `avatars/{userId}/profile.webp` (substitui versão anterior).
 * Remove objeto legado `avatars/{userId}/profile` sem extensão, se existir.
 * Requer bucket `avatars` e políticas do script 010_storage_avatars.sql.
 */
export async function uploadProfileAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<{ publicUrl: string } | { error: string }> {
  const check = await assertAvatarWebpFile(file)
  if (!check.ok) {
    return { error: check.error }
  }

  const path = `${userId}/profile.webp`
  await supabase.storage.from(AVATARS_BUCKET).remove([`${userId}/profile`])

  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: 'image/webp',
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
