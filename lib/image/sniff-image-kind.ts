export type SniffedImageKind = 'jpeg' | 'png' | 'gif' | 'webp'

/**
 * Identifica formato real pelo cabeçalho (não confia em MIME/extensão).
 */
export function sniffImageKind(buffer: ArrayBuffer): SniffedImageKind | null {
  const u8 = new Uint8Array(buffer)
  if (u8.length < 12) return null

  if (u8[0] === 0xff && u8[1] === 0xd8 && u8[2] === 0xff) {
    return 'jpeg'
  }

  if (
    u8[0] === 0x89 &&
    u8[1] === 0x50 &&
    u8[2] === 0x4e &&
    u8[3] === 0x47 &&
    u8[4] === 0x0d &&
    u8[5] === 0x0a &&
    u8[6] === 0x1a &&
    u8[7] === 0x0a
  ) {
    return 'png'
  }

  if (
    u8[0] === 0x47 &&
    u8[1] === 0x49 &&
    u8[2] === 0x46 &&
    u8[3] === 0x38 &&
    (u8[4] === 0x37 || u8[4] === 0x39) &&
    u8[5] === 0x61
  ) {
    return 'gif'
  }

  if (
    u8[0] === 0x52 &&
    u8[1] === 0x49 &&
    u8[2] === 0x46 &&
    u8[3] === 0x46 &&
    u8[8] === 0x57 &&
    u8[9] === 0x45 &&
    u8[10] === 0x42 &&
    u8[11] === 0x50
  ) {
    return 'webp'
  }

  return null
}
