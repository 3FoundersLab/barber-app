import { endOfMonth, startOfMonth, subMonths } from 'date-fns'
import { toLocalDateKey } from '@/lib/relatorios-range'
import {
  fetchVisaoGeralAgendamentos,
  type VisaoGeralAgendamentoRow,
  pctChange,
} from '@/lib/relatorios-visao-geral-data'
import type { SupabaseClient } from '@supabase/supabase-js'

export type TendenciasMesSpark = { key: string; label: string; faturamento: number }

export type TendenciasComputed = {
  ultimoMesFechadoLabel: string
  penultimoMesLabel: string
  fatUltimoMes: number
  fatPenultimoMes: number
  fatMesmoMesAnoAnterior: number
  crescimentoMoM: number | null
  crescimentoYoY: number | null
  ticketUltimo: number
  ticketPenultimo: number
  pctTicketVsAnt: number | null
  clientesUltimo: number
  clientesPenultimo: number
  pctClientesVsAnt: number | null
  /** % de clientes do penúltimo mês que não retornaram no último mês fechado. */
  churnUltimoPct: number
  /** Churn do par antepenúltimo → penúltimo (para comparar tendência). */
  churnParAnteriorPct: number
  deltaChurnPontos: number
  serieMensal: TendenciasMesSpark[]
  /** Variação % vs mesmo mês do ano anterior (um ponto por mês da série). */
  serieYoYPercent: TendenciasMesSpark[]
}

export function sumFaturamento(rows: VisaoGeralAgendamentoRow[]): number {
  return rows.reduce((s, r) => s + (Number(r.valor) || 0), 0)
}

export function rowsEntreInclusive(
  rows: VisaoGeralAgendamentoRow[],
  inicioYmd: string,
  fimYmd: string,
): VisaoGeralAgendamentoRow[] {
  return rows.filter((r) => r.data >= inicioYmd && r.data <= fimYmd)
}

export function uniqueClientes(rows: VisaoGeralAgendamentoRow[]): number {
  return new Set(rows.map((r) => r.cliente_id).filter(Boolean)).size
}

export function ticketMedio(rows: VisaoGeralAgendamentoRow[]): number {
  const n = rows.length
  if (n === 0) return 0
  return sumFaturamento(rows) / n
}

/**
 * Entre dois meses consecutivos: % de clientes que atenderam no primeiro mês
 * e não aparecem como atendidos no segundo.
 */
export function taxaChurnEntreMeses(
  rowsMesBase: VisaoGeralAgendamentoRow[],
  rowsMesSeguinte: VisaoGeralAgendamentoRow[],
): number {
  const baseIds = new Set(
    rowsMesBase.map((r) => r.cliente_id).filter((id): id is string => Boolean(id)),
  )
  if (baseIds.size === 0) return 0
  const seguinteIds = new Set(
    rowsMesSeguinte.map((r) => r.cliente_id).filter((id): id is string => Boolean(id)),
  )
  let lost = 0
  for (const id of baseIds) {
    if (!seguinteIds.has(id)) lost += 1
  }
  return (lost / baseIds.size) * 100
}

export function buildSerieMensal(
  rows: VisaoGeralAgendamentoRow[],
  ultimoMesInicio: Date,
  meses: 6 | 12,
): TendenciasMesSpark[] {
  const out: TendenciasMesSpark[] = []
  for (let back = meses - 1; back >= 0; back--) {
    const inicio = startOfMonth(subMonths(ultimoMesInicio, back))
    const fim = endOfMonth(inicio)
    const i0 = toLocalDateKey(inicio)
    const i1 = toLocalDateKey(fim)
    const slice = rowsEntreInclusive(rows, i0, i1)
    const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })
      .format(inicio)
      .replace('.', '')
    out.push({ key: i0.slice(0, 7), label, faturamento: sumFaturamento(slice) })
  }
  return out
}

/** Para cada mês da série: crescimento % vs o mesmo mês do ano anterior (requer dados retroativos). */
export function buildSerieYoYPercentual(
  rows: VisaoGeralAgendamentoRow[],
  ultimoMesInicio: Date,
  meses: 6 | 12,
): TendenciasMesSpark[] {
  const out: TendenciasMesSpark[] = []
  for (let back = meses - 1; back >= 0; back--) {
    const inicio = startOfMonth(subMonths(ultimoMesInicio, back))
    const fim = endOfMonth(inicio)
    const i0 = toLocalDateKey(inicio)
    const i1 = toLocalDateKey(fim)
    const fatCur = sumFaturamento(rowsEntreInclusive(rows, i0, i1))

    const inicioY = startOfMonth(subMonths(inicio, 12))
    const fimY = endOfMonth(inicioY)
    const fatY = sumFaturamento(rowsEntreInclusive(rows, toLocalDateKey(inicioY), toLocalDateKey(fimY)))

    const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })
      .format(inicio)
      .replace('.', '')
    const yoy = pctChange(fatCur, fatY)
    out.push({
      key: i0.slice(0, 7),
      label,
      faturamento: yoy != null && Number.isFinite(yoy) ? yoy : 0,
    })
  }
  return out
}

/** Janela de fetch: 24 meses antes do último mês fechado até o fim desse mês. */
export function tendenciasFetchWindow(ref: Date = new Date()): { inicioYmd: string; fimYmd: string } {
  const ultimoMesInicio = startOfMonth(subMonths(startOfMonth(ref), 1))
  const ultimoFechadoFim = endOfMonth(ultimoMesInicio)
  const inicio = startOfMonth(subMonths(ultimoMesInicio, 24))
  return { inicioYmd: toLocalDateKey(inicio), fimYmd: toLocalDateKey(ultimoFechadoFim) }
}

export function computeTendenciasFromRows(
  rows: VisaoGeralAgendamentoRow[],
  ref: Date = new Date(),
  mesesSparkline: 6 | 12 = 12,
): TendenciasComputed {
  const ultimoMesInicio = startOfMonth(subMonths(startOfMonth(ref), 1))
  const ultimoFechadoFim = endOfMonth(ultimoMesInicio)
  const penultimoInicio = startOfMonth(subMonths(ultimoMesInicio, 1))
  const penultimoFim = endOfMonth(penultimoInicio)
  const yoyInicio = startOfMonth(subMonths(ultimoMesInicio, 12))
  const yoyFim = endOfMonth(yoyInicio)

  const rUlt = rowsEntreInclusive(rows, toLocalDateKey(ultimoMesInicio), toLocalDateKey(ultimoFechadoFim))
  const rPen = rowsEntreInclusive(rows, toLocalDateKey(penultimoInicio), toLocalDateKey(penultimoFim))
  const rYoy = rowsEntreInclusive(rows, toLocalDateKey(yoyInicio), toLocalDateKey(yoyFim))

  const antepInicio = startOfMonth(subMonths(penultimoInicio, 1))
  const antepFim = endOfMonth(antepInicio)
  const rAnt = rowsEntreInclusive(rows, toLocalDateKey(antepInicio), toLocalDateKey(antepFim))

  const fatUltimo = sumFaturamento(rUlt)
  const fatPen = sumFaturamento(rPen)
  const fatYoy = sumFaturamento(rYoy)

  const churnUltimoPct = taxaChurnEntreMeses(rPen, rUlt)
  const churnParAnteriorPct = taxaChurnEntreMeses(rAnt, rPen)
  const deltaChurnPontos = churnUltimoPct - churnParAnteriorPct

  const ticketU = ticketMedio(rUlt)
  const ticketP = ticketMedio(rPen)

  const ultimoMesFechadoLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(ultimoMesInicio)
  const penultimoMesLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(penultimoInicio)

  return {
    ultimoMesFechadoLabel,
    penultimoMesLabel,
    fatUltimoMes: fatUltimo,
    fatPenultimoMes: fatPen,
    fatMesmoMesAnoAnterior: fatYoy,
    crescimentoMoM: pctChange(fatUltimo, fatPen),
    crescimentoYoY: pctChange(fatUltimo, fatYoy),
    ticketUltimo: ticketU,
    ticketPenultimo: ticketP,
    pctTicketVsAnt: pctChange(ticketU, ticketP),
    clientesUltimo: uniqueClientes(rUlt),
    clientesPenultimo: uniqueClientes(rPen),
    pctClientesVsAnt: pctChange(uniqueClientes(rUlt), uniqueClientes(rPen)),
    churnUltimoPct,
    churnParAnteriorPct,
    deltaChurnPontos,
    serieMensal: buildSerieMensal(rows, ultimoMesInicio, mesesSparkline),
    serieYoYPercent: buildSerieYoYPercentual(rows, ultimoMesInicio, mesesSparkline),
  }
}

export async function fetchTendenciasAgendamentos(
  supabase: SupabaseClient,
  barbeariaId: string,
  barbeiroId: string | null,
): Promise<VisaoGeralAgendamentoRow[]> {
  const { inicioYmd, fimYmd } = tendenciasFetchWindow()
  return fetchVisaoGeralAgendamentos(supabase, barbeariaId, inicioYmd, fimYmd, barbeiroId)
}
