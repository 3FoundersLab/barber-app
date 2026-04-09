import {
  AVATAR_MAX_DECODE_EDGE,
  AVATAR_MAX_DECODE_PIXELS,
  AVATAR_SOURCE_MAX_BYTES,
} from '@/lib/image/avatar-image-constants'
import { sniffImageKind } from '@/lib/image/sniff-image-kind'

const HEAD_BYTES = 16

export type AvatarSourceValidation =
  | { ok: true }
  | { ok: false; message: string }

/**
 * Valida tamanho, assinatura binária e limites após decode (createImageBitmap).
 */
export async function validateAvatarSourceFile(file: File): Promise<AvatarSourceValidation> {
  if (!file || file.size < 1) {
    return { ok: false, message: 'Arquivo inválido.' }
  }

  if (file.size > AVATAR_SOURCE_MAX_BYTES) {
    return {
      ok: false,
      message: `A imagem deve ter no máximo ${Math.round(AVATAR_SOURCE_MAX_BYTES / (1024 * 1024))} MB antes do recorte.`,
    }
  }

  const head = await file.slice(0, HEAD_BYTES).arrayBuffer()
  const kind = sniffImageKind(head)
  if (!kind) {
    return {
      ok: false,
      message: 'Formato não suportado ou arquivo corrompido. Use JPG, PNG, GIF ou WebP.',
    }
  }

  let bitmap: ImageBitmap | null = null
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return {
      ok: false,
      message: 'Não foi possível ler a imagem. O arquivo pode estar corrompido ou não ser uma imagem real.',
    }
  }

  try {
    const w = bitmap.width
    const h = bitmap.height
    if (w < 32 || h < 32) {
      return { ok: false, message: 'Use uma imagem com pelo menos 32×32 pixels.' }
    }
    if (w > AVATAR_MAX_DECODE_EDGE || h > AVATAR_MAX_DECODE_EDGE) {
      return {
        ok: false,
        message: `Dimensões máximas: ${AVATAR_MAX_DECODE_EDGE}×${AVATAR_MAX_DECODE_EDGE} pixels.`,
      }
    }
    const pixels = w * h
    if (pixels > AVATAR_MAX_DECODE_PIXELS) {
      return { ok: false, message: 'Imagem muito grande em número de pixels. Reduza a resolução.' }
    }
    return { ok: true }
  } finally {
    bitmap.close()
  }
}
