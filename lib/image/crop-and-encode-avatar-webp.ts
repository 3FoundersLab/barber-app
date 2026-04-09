import type { Area } from 'react-easy-crop'
import {
  AVATAR_OUTPUT_SIZE,
  AVATAR_WEBP_MAX_BYTES,
} from '@/lib/image/avatar-image-constants'

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('IMAGE_LOAD'))
    img.src = src
  })
}

function canvasToWebpQuality(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/webp', quality)
  })
}

/**
 * Gera WebP quadrada {size}×{size}, ajustando qualidade para caber em maxBytes.
 */
export async function encodeCanvasToWebpUnderMax(
  canvas: HTMLCanvasElement,
  maxBytes: number,
): Promise<Blob> {
  const qualities = [0.88, 0.82, 0.75, 0.68, 0.6, 0.52, 0.45, 0.38]
  let smallest: Blob | null = null

  for (const q of qualities) {
    const blob = await canvasToWebpQuality(canvas, q)
    if (!blob) continue
    if (!smallest || blob.size < smallest.size) smallest = blob
    if (blob.size <= maxBytes) return blob
  }

  if (smallest) return smallest

  const last = await canvasToWebpQuality(canvas, 0.35)
  if (last) return last

  throw new Error('WEBP_UNSUPPORTED')
}

/**
 * Recorta a região em pixels (coordenadas da imagem natural) e redimensiona para saída padronizada.
 * Re-decode via canvas remove a maior parte de metadados/EXIF e anexos estranhos.
 */
export async function cropImageToAvatarWebpFile(
  imageObjectUrl: string,
  pixelCrop: Area,
  outputSize: number = AVATAR_OUTPUT_SIZE,
): Promise<File> {
  const image = await loadHtmlImage(imageObjectUrl)
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('NO_2D_CONTEXT')
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const sx = Math.max(0, Math.round(pixelCrop.x))
  const sy = Math.max(0, Math.round(pixelCrop.y))
  const sw = Math.min(image.naturalWidth - sx, Math.round(pixelCrop.width))
  const sh = Math.min(image.naturalHeight - sy, Math.round(pixelCrop.height))

  if (sw < 1 || sh < 1) {
    throw new Error('INVALID_CROP')
  }

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outputSize, outputSize)

  const blob = await encodeCanvasToWebpUnderMax(canvas, AVATAR_WEBP_MAX_BYTES)
  return new File([blob], 'avatar.webp', { type: 'image/webp', lastModified: Date.now() })
}

export function avatarWebpProcessingErrorMessage(code: string): string {
  switch (code) {
    case 'IMAGE_LOAD':
      return 'Não foi possível carregar a pré-visualização da imagem.'
    case 'NO_2D_CONTEXT':
      return 'Seu navegador não suportou o processamento da imagem.'
    case 'INVALID_CROP':
      return 'Área de recorte inválida. Ajuste o enquadramento e tente de novo.'
    case 'WEBP_UNSUPPORTED':
      return 'Seu navegador não suporta exportação WebP. Atualize o navegador ou use outro (Chrome, Edge, Firefox recente).'
    default:
      return 'Não foi possível processar a imagem.'
  }
}
