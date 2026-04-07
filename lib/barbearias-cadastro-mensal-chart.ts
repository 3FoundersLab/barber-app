import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type BarbeariasCadastroMensalChartRow = {
  monthKey: string
  /** Rótulo curto para o eixo X (ex.: Jan, Fev ou Jan/25 se cruzar anos) */
  month: string
  comPlano: number
  semPlano: number
  total: number
}

function formatMonthAxisLabel(monthStart: Date, showYear: boolean): string {
  const raw = format(monthStart, 'LLLL', { locale: ptBR })
  const short = raw.length >= 3 ? raw.slice(0, 3) : raw
  const cap = short.charAt(0).toUpperCase() + short.slice(1)
  if (!showYear) return cap
  return `${cap}/${String(monthStart.getFullYear()).slice(-2)}`
}

/** Barbearias com assinatura em status que contam como “com plano” para o gráfico. */
export function barbeariasIdsComPlano(
  assinaturas: readonly { barbearia_id: string; status: string }[],
): Set<string> {
  const ids = new Set<string>()
  for (const a of assinaturas) {
    if (a.status === 'ativa') {
      ids.add(a.barbearia_id)
    }
  }
  return ids
}

/**
 * Agrupa cadastros de barbearias por mês de `created_at`, no intervalo inclusivo [from, to].
 * “Com plano” = existe assinatura ativa para a barbearia (estado atual).
 */
export function buildBarbeariasCadastroMensalRows(
  barbearias: readonly { id: string; created_at: string }[],
  comPlanoIds: Set<string>,
  rangeFromIsoDate: string,
  rangeToIsoDate: string,
): BarbeariasCadastroMensalChartRow[] {
  const from = parseISO(rangeFromIsoDate)
  const toRaw = parseISO(rangeToIsoDate)
  if (!isValid(from) || !isValid(toRaw)) return []

  const start = startOfMonth(from)
  const end = endOfMonth(toRaw)
  if (start > end) return []

  const months = eachMonthOfInterval({ start, end })
  const showYear =
    start.getFullYear() !== end.getFullYear() ||
    (months.length > 0 &&
      months[0].getFullYear() !== months[months.length - 1].getFullYear())

  return months.map((monthStart) => {
    const key = format(monthStart, 'yyyy-MM')
    const month = formatMonthAxisLabel(monthStart, showYear)
    let comPlano = 0
    let semPlano = 0
    for (const b of barbearias) {
      const created = parseISO(b.created_at)
      if (!isValid(created)) continue
      if (format(created, 'yyyy-MM') !== key) continue
      if (comPlanoIds.has(b.id)) comPlano++
      else semPlano++
    }
    return {
      monthKey: key,
      month,
      comPlano,
      semPlano,
      total: comPlano + semPlano,
    }
  })
}
