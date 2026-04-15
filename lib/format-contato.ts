/** Máscara de telefone BR: (XX) XXXXX-XXXX (11 dígitos) ou (XX) XXXX-XXXX (10). */

export function maskTelefoneBr(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Remove formatação; útil se precisar persistir só dígitos. */
export function telefoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Normaliza e-mail ao digitar: minúsculas, sem espaços internos.
 */
export function normalizeEmailInput(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s/g, '')
}

/** Máscara de CNPJ: 00.000.000/0000-00 */
export function maskCnpj(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 14)
  if (d.length === 0) return ''
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function cnpjDigits(value: string): string {
  return value.replace(/\D/g, '')
}
