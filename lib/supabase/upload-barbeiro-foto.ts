import type { SupabaseClient } from '@supabase/supabase-js'
import { assertAvatarWebpFile } from '@/lib/supabase/upload-profile-avatar'

export const BARBEIRO_FOTOS_BUCKET = 'barbeiro-fotos'

function objectPath(barbeariaId: string, barbeiroId: string) {
  return `${barbeariaId}/${barbeiroId}.webp`
}

export async function uploadBarbeiroFoto(
  supabase: SupabaseClient,
  barbeariaId: string,
  barbeiroId: string,
  file: File,
): Promise<{ publicUrl: string } | { error: string }> {
  const check = await assertAvatarWebpFile(file)
  if (!check.ok) {
    return { error: check.error }
  }

  const path = objectPath(barbeariaId, barbeiroId)
  const { error: uploadError } = await supabase.storage
    .from(BARBEIRO_FOTOS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: 'image/webp',
    })

  if (uploadError) {
    return {
      error:
        'Não foi possível enviar a foto. Confira no Supabase o bucket "barbeiro-fotos" e o script 033_barbeiros_funcao_equipe_fotos.sql.',
    }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BARBEIRO_FOTOS_BUCKET).getPublicUrl(path)

  return { publicUrl: `${publicUrl}?v=${Date.now()}` }
}

export async function removeBarbeiroFotoStorage(
  supabase: SupabaseClient,
  barbeariaId: string,
  barbeiroId: string,
): Promise<void> {
  await supabase.storage.from(BARBEIRO_FOTOS_BUCKET).remove([objectPath(barbeariaId, barbeiroId)])
}
