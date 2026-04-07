import { cepDigits, formatCepMask } from '@/lib/viacep'

export type BarbeariaEnderecoParts = {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  uf: string
}

const MARKER = '\n__BARBER_ADDR_JSON__'

export function emptyBarbeariaEnderecoParts(): BarbeariaEnderecoParts {
  return {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  }
}

function trimPart(s: string): string {
  return s.trim()
}

export function normalizeBarbeariaEnderecoParts(p: BarbeariaEnderecoParts): BarbeariaEnderecoParts {
  const cep = formatCepMask(p.cep)
  return {
    cep,
    logradouro: trimPart(p.logradouro),
    numero: trimPart(p.numero),
    complemento: trimPart(p.complemento),
    bairro: trimPart(p.bairro),
    cidade: trimPart(p.cidade),
    uf: trimPart(p.uf).toUpperCase().slice(0, 2),
  }
}

export function hasBarbeariaEnderecoContent(p: BarbeariaEnderecoParts): boolean {
  const n = normalizeBarbeariaEnderecoParts(p)
  return Object.values(n).some((v) => v !== '')
}

function buildDisplayLine(p: BarbeariaEnderecoParts): string {
  const blocks: string[] = []
  const rua = [p.logradouro, p.numero].filter(Boolean).join(', ')
  if (rua) blocks.push(rua)
  if (p.complemento) blocks.push(p.complemento)
  if (p.bairro) blocks.push(p.bairro)
  const cidadeUf = [p.cidade, p.uf].filter(Boolean).join(' — ')
  if (cidadeUf) blocks.push(cidadeUf)
  const d = cepDigits(p.cep)
  if (d.length === 8) blocks.push(`CEP ${formatCepMask(d)}`)
  return blocks.join(' · ')
}

/** Persistência no campo TEXT `endereco`: linha legível + payload JSON para reabrir o formulário. */
export function serializeBarbeariaEndereco(parts: BarbeariaEnderecoParts): string | null {
  const p = normalizeBarbeariaEnderecoParts(parts)
  if (!hasBarbeariaEnderecoContent(p)) return null
  const line = buildDisplayLine(p)
  return line + MARKER + JSON.stringify(p)
}

export function deserializeBarbeariaEndereco(raw: string | null | undefined): BarbeariaEnderecoParts {
  if (raw == null || !String(raw).trim()) return emptyBarbeariaEnderecoParts()
  const s = String(raw)
  const idx = s.indexOf(MARKER)
  if (idx === -1) {
    return { ...emptyBarbeariaEnderecoParts(), logradouro: s.trim() }
  }
  const head = s.slice(0, idx).trim()
  try {
    const parsed = JSON.parse(s.slice(idx + MARKER.length)) as Partial<BarbeariaEnderecoParts>
    const merged = { ...emptyBarbeariaEnderecoParts(), ...parsed }
    const n = normalizeBarbeariaEnderecoParts(merged)
    if (!n.logradouro && head) {
      return { ...n, logradouro: head }
    }
    return n
  } catch {
    return { ...emptyBarbeariaEnderecoParts(), logradouro: head || s.trim() }
  }
}

/** Texto apenas para exibição (remove o payload interno). */
export function enderecoLinhaExibicao(raw: string | null | undefined): string {
  if (raw == null || !String(raw).trim()) return ''
  const s = String(raw)
  const idx = s.indexOf(MARKER)
  return (idx === -1 ? s : s.slice(0, idx)).trim()
}
