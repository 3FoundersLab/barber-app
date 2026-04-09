/** Arquivo bruto antes do processamento (crop + WebP). */
export const AVATAR_SOURCE_MAX_BYTES = 10 * 1024 * 1024

/** Limite de aresta após decode (proteção contra imagens gigantes / decompression). */
export const AVATAR_MAX_DECODE_EDGE = 4096

export const AVATAR_MAX_DECODE_PIXELS = 12 * 1024 * 1024

/** Saída quadrada padronizada (px). */
export const AVATAR_OUTPUT_SIZE = 512

/** Teto do arquivo final WebP enviado ao storage. */
export const AVATAR_WEBP_MAX_BYTES = 450 * 1024
