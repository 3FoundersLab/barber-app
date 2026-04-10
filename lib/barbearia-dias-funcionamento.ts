import { DIAS_SEMANA } from '@/lib/constants'

/** Índices 0=Dom … 6=Sáb, iguais a `Date.getDay()`. */
export const BARBEARIA_DIAS_FUNCIONAMENTO_PADRAO: readonly number[] = [1, 2, 3, 4, 5, 6]

function isValidDia(d: unknown): d is number {
  return typeof d === 'number' && Number.isInteger(d) && d >= 0 && d <= 6
}

/** Lê o array do PostgREST/JSON e devolve dias únicos válidos, ou o padrão (seg–sáb). */
export function normalizeDiasFuncionamento(raw: unknown): number[] {
  if (!Array.isArray(raw) || raw.length === 0) return [...BARBEARIA_DIAS_FUNCIONAMENTO_PADRAO]
  const set = new Set<number>()
  for (const x of raw) {
    const n = typeof x === 'string' ? Number.parseInt(x, 10) : x
    if (isValidDia(n)) set.add(n)
  }
  if (set.size === 0) return [...BARBEARIA_DIAS_FUNCIONAMENTO_PADRAO]
  return [...set].sort((a, b) => a - b)
}

/** Para formulário: 7 booleans [dom, …, sáb]. */
export function diasFuncionamentoToFormFlags(dias: number[]): boolean[] {
  const s = new Set(dias)
  return Array.from({ length: 7 }, (_, i) => s.has(i))
}

export function formFlagsToDiasFuncionamento(flags: boolean[]): number[] {
  const out: number[] = []
  for (let i = 0; i < 7; i++) {
    if (flags[i]) out.push(i)
  }
  return out
}

/** Texto curto para exibir no painel / calendário (ex.: "Segunda a sábado"). */
export function formatDiasFuncionamentoLegenda(dias: number[]): string {
  const d = normalizeDiasFuncionamento(dias)
  if (d.length === 7) return 'Todos os dias'
  if (d.length === 0) return '—'
  const names = d.map((i) => DIAS_SEMANA[i]?.split('-')[0]?.trim() ?? String(i))
  if (d.length === 1) return names[0] ?? '—'
  const runs: { start: number; end: number }[] = []
  let start = d[0]!
  let prev = d[0]!
  for (let k = 1; k < d.length; k++) {
    const cur = d[k]!
    if (cur === prev + 1) {
      prev = cur
    } else {
      runs.push({ start, end: prev })
      start = cur
      prev = cur
    }
  }
  runs.push({ start, end: prev })
  const parts = runs.map((r) => {
    const a = DIAS_SEMANA[r.start]?.split('-')[0]?.trim() ?? ''
    if (r.start === r.end) return a
    const b = DIAS_SEMANA[r.end]?.split('-')[0]?.trim() ?? ''
    return `${a} a ${b}`
  })
  return parts.join(', ')
}

export function isBarbeariaAbertaNoDia(diaJs: number, dias: number[]): boolean {
  const set = new Set(normalizeDiasFuncionamento(dias))
  return set.has(diaJs)
}
