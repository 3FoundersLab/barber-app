/** Ciclo de cobrança do plano (valor total = preço mensal × meses do período). */

export type PlanoPeriodicidade = 'mensal' | 'trimestral' | 'semestral' | 'anual'

export const PLANOS_PERIODICIDADE: ReadonlyArray<{
  id: PlanoPeriodicidade
  label: string
  labelCurto: string
  meses: number
}> = [
  { id: 'mensal', label: 'Mensal', labelCurto: 'Mês', meses: 1 },
  { id: 'trimestral', label: 'Trimestral', labelCurto: 'Trim.', meses: 3 },
  { id: 'semestral', label: 'Semestral', labelCurto: 'Sem.', meses: 6 },
  { id: 'anual', label: 'Anual', labelCurto: 'Ano', meses: 12 },
] as const

const VALID = new Set<string>(PLANOS_PERIODICIDADE.map((p) => p.id))

export function parsePlanoPeriodicidade(raw: string | null | undefined): PlanoPeriodicidade {
  const s = String(raw ?? 'mensal')
    .toLowerCase()
    .trim()
  return VALID.has(s) ? (s as PlanoPeriodicidade) : 'mensal'
}

export function mesesPorPeriodicidade(p: PlanoPeriodicidade): number {
  return PLANOS_PERIODICIDADE.find((x) => x.id === p)?.meses ?? 1
}

export function precoTotalNoPeriodo(precoMensal: number, p: PlanoPeriodicidade): number {
  return precoMensal * mesesPorPeriodicidade(p)
}

export function labelPeriodicidade(p: PlanoPeriodicidade): string {
  return PLANOS_PERIODICIDADE.find((x) => x.id === p)?.label ?? 'Mensal'
}

/** Texto curto para tabelas (ex.: badge). */
export function labelPeriodicidadeCurta(p: PlanoPeriodicidade): string {
  return PLANOS_PERIODICIDADE.find((x) => x.id === p)?.labelCurto ?? 'Mês'
}

/** Linha de preço para cards (usa formatCurrency do caller). */
export function sufixoPrecoPeriodicidade(p: PlanoPeriodicidade): string {
  switch (p) {
    case 'mensal':
      return '/ mês'
    case 'trimestral':
      return '/ trimestre'
    case 'semestral':
      return '/ semestre'
    case 'anual':
      return '/ ano'
    default:
      return '/ mês'
  }
}
