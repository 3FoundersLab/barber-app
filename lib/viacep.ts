/** Consulta pública ViaCEP (sem chave). */

export type ViaCepSuccess = {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  ibge?: string
}

export type ViaCepJson = ViaCepSuccess | { erro: true }

export function cepDigits(input: string): string {
  return input.replace(/\D/g, '').slice(0, 8)
}

export function formatCepMask(digits: string): string {
  const d = cepDigits(digits)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

export async function fetchViaCep(
  digits8: string,
  signal?: AbortSignal,
): Promise<ViaCepSuccess | null> {
  const d = cepDigits(digits8)
  if (d.length !== 8) return null
  const res = await fetch(`https://viacep.com.br/ws/${d}/json/`, { signal })
  if (!res.ok) return null
  const data = (await res.json()) as ViaCepJson
  if (data && 'erro' in data && data.erro) return null
  return data as ViaCepSuccess
}
