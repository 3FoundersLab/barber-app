import { endOfMonth, startOfMonth, subDays, subMonths } from 'date-fns'
import { toLocalDateKey } from '@/lib/relatorios-range'
import {
  fetchVisaoGeralAgendamentos,
  type VisaoGeralAgendamentoRow,
  pctChange,
} from '@/lib/relatorios-visao-geral-data'
import type { SupabaseClient } from '@supabase/supabase-js'

export type TendenciasMesSpark = { key: string; label: string; faturamento: number }

export type SerieFatTicketPonto = { label: string; faturamento: number; ticketMedio: number }

export type SerieBarraComparacaoPonto = { label: string; atual: number; anterior: number }

export type SerieProjecaoPonto = {
  label: string
  realizado?: number | null
  projecao?: number | null
}

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
  /** Linha dupla: faturamento + ticket médio por mês. */
  serieFatTicket: SerieFatTicketPonto[]
  /** Barras: faturamento do mês vs mesmo mês do ano anterior. */
  serieBarrasComparacao: SerieBarraComparacaoPonto[]
  /** Série para gráfico de projeção (realizado + segmento pontilhado). */
  serieProjecaoChart: SerieProjecaoPonto[]
  /** Heurística: variação % esperada ~30 dias vs último mês fechado. */
  projecao30Pct: number
  projecao30Valor: number
  /** Nomes dos meses (calendário) com maior faturamento acumulado no histórico carregado. */
  sazonalidadeMesesDestaque: string[]
  /** Mediana de dias entre atendimentos consecutivos (por cliente, ≥2 visitas). */
  medianaDiasEntreVisitas: number | null
  /** Clientes com última visita antes do corte (90 dias antes do fim do último mês fechado). */
  clientesInativosEstimados: number
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

export function buildSerieFatTicket(
  rows: VisaoGeralAgendamentoRow[],
  ultimoMesInicio: Date,
  meses: 6 | 12,
): SerieFatTicketPonto[] {
  const out: SerieFatTicketPonto[] = []
  for (let back = meses - 1; back >= 0; back--) {
    const inicio = startOfMonth(subMonths(ultimoMesInicio, back))
    const fim = endOfMonth(inicio)
    const i0 = toLocalDateKey(inicio)
    const i1 = toLocalDateKey(fim)
    const slice = rowsEntreInclusive(rows, i0, i1)
    const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })
      .format(inicio)
      .replace('.', '')
    out.push({
      label,
      faturamento: sumFaturamento(slice),
      ticketMedio: ticketMedio(slice),
    })
  }
  return out
}

export function buildSerieBarrasYoY(
  rows: VisaoGeralAgendamentoRow[],
  ultimoMesInicio: Date,
  meses: 6 | 12,
): SerieBarraComparacaoPonto[] {
  const out: SerieBarraComparacaoPonto[] = []
  for (let back = meses - 1; back >= 0; back--) {
    const inicio = startOfMonth(subMonths(ultimoMesInicio, back))
    const fim = endOfMonth(inicio)
    const i0 = toLocalDateKey(inicio)
    const i1 = toLocalDateKey(fim)
    const atual = sumFaturamento(rowsEntreInclusive(rows, i0, i1))
    const inicioY = startOfMonth(subMonths(inicio, 12))
    const fimY = endOfMonth(inicioY)
    const anterior = sumFaturamento(
      rowsEntreInclusive(rows, toLocalDateKey(inicioY), toLocalDateKey(fimY)),
    )
    const label = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })
      .format(inicio)
      .replace('.', '')
    out.push({ label, atual, anterior })
  }
  return out
}

export function buildSerieProjecaoChart(
  serieMensal: TendenciasMesSpark[],
  crescimentoMoM: number | null,
): SerieProjecaoPonto[] {
  if (!serieMensal.length) return []
  const out: SerieProjecaoPonto[] = serieMensal.map((p) => ({
    label: p.label,
    realizado: p.faturamento,
  }))
  const lastFat = serieMensal[serieMensal.length - 1]!.faturamento
  const penFat = serieMensal[serieMensal.length - 2]?.faturamento ?? lastFat
  const mom = crescimentoMoM != null && Number.isFinite(crescimentoMoM) ? crescimentoMoM / 100 : 0
  const step = lastFat - penFat
  const projected = Math.max(0, lastFat + step * 0.85 + lastFat * mom * 0.35)

  const lastIdx = out.length - 1
  out[lastIdx] = { ...out[lastIdx]!, realizado: lastFat, projecao: lastFat }
  out.push({ label: 'Próx. 30d', projecao: projected })
  return out
}

function mesNomeCurtoPt(month1to12: number): string {
  const d = new Date(2020, month1to12 - 1, 1)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(d)
}

/** Intensidade relativa 0–1 por mês de calendário (jan = 0). */
export function intensidadeSazonalidade12(rows: VisaoGeralAgendamentoRow[]): number[] {
  const sumByCalMonth = new Array(12).fill(0) as number[]
  for (const r of rows) {
    const m = Number(r.data.split('-')[1])
    if (m >= 1 && m <= 12) sumByCalMonth[m - 1] += Number(r.valor) || 0
  }
  const mx = Math.max(...sumByCalMonth, 1)
  return sumByCalMonth.map((s) => s / mx)
}

export function sazonalidadeMesesFortes(
  rows: VisaoGeralAgendamentoRow[],
  topN = 2,
): string[] {
  const sumByCalMonth = new Array(12).fill(0) as number[]
  for (const r of rows) {
    const parts = r.data.split('-').map(Number)
    const m = parts[1]
    if (!m || m < 1 || m > 12) continue
    sumByCalMonth[m - 1] += Number(r.valor) || 0
  }
  const order = [...Array(12)].map((_, i) => i).sort((a, b) => sumByCalMonth[b]! - sumByCalMonth[a]!)
  const pick = order.slice(0, topN).filter((i) => sumByCalMonth[i]! > 0)
  return pick.map((i) => mesNomeCurtoPt(i + 1))
}

export function medianaDiasEntreVisitas(rows: VisaoGeralAgendamentoRow[]): number | null {
  const byCliente = new Map<string, string[]>()
  for (const r of rows) {
    if (!r.cliente_id) continue
    const arr = byCliente.get(r.cliente_id) ?? []
    arr.push(r.data)
    byCliente.set(r.cliente_id, arr)
  }
  const gaps: number[] = []
  for (const dates of byCliente.values()) {
    if (dates.length < 2) continue
    const sorted = [...new Set(dates)].sort()
    for (let i = 1; i < sorted.length; i++) {
      const a = sorted[i - 1]!
      const b = sorted[i]!
      const [y1, m1, d1] = a.split('-').map(Number)
      const [y2, m2, d2] = b.split('-').map(Number)
      const t1 = new Date(y1!, m1! - 1, d1!).getTime()
      const t2 = new Date(y2!, m2! - 1, d2!).getTime()
      const days = Math.round((t2 - t1) / 86400000)
      if (days > 0) gaps.push(days)
    }
  }
  if (!gaps.length) return null
  gaps.sort((a, b) => a - b)
  const mid = Math.floor(gaps.length / 2)
  return gaps.length % 2 ? gaps[mid]! : (gaps[mid - 1]! + gaps[mid]!) / 2
}

export function countClientesInativos(
  rows: VisaoGeralAgendamentoRow[],
  ultimoMesFechadoFim: Date,
  diasSemVisita = 90,
): number {
  const corte = subDays(ultimoMesFechadoFim, diasSemVisita)
  const corteYmd = toLocalDateKey(corte)
  const lastByCliente = new Map<string, string>()
  for (const r of rows) {
    if (!r.cliente_id) continue
    const cur = lastByCliente.get(r.cliente_id)
    if (!cur || r.data > cur) lastByCliente.set(r.cliente_id, r.data)
  }
  let n = 0
  for (const last of lastByCliente.values()) {
    if (last < corteYmd) n += 1
  }
  return n
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

  const crescimentoMoM = pctChange(fatUltimo, fatPen)
  const serieMensal = buildSerieMensal(rows, ultimoMesInicio, mesesSparkline)
  const projecao30Valor = Math.max(
    0,
    fatUltimo * (1 + (crescimentoMoM != null && Number.isFinite(crescimentoMoM) ? (crescimentoMoM / 100) * 0.75 : 0)),
  )
  const projecao30Pct = fatUltimo > 0 ? ((projecao30Valor - fatUltimo) / fatUltimo) * 100 : 0

  return {
    ultimoMesFechadoLabel,
    penultimoMesLabel,
    fatUltimoMes: fatUltimo,
    fatPenultimoMes: fatPen,
    fatMesmoMesAnoAnterior: fatYoy,
    crescimentoMoM,
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
    serieMensal,
    serieYoYPercent: buildSerieYoYPercentual(rows, ultimoMesInicio, mesesSparkline),
    serieFatTicket: buildSerieFatTicket(rows, ultimoMesInicio, mesesSparkline),
    serieBarrasComparacao: buildSerieBarrasYoY(rows, ultimoMesInicio, mesesSparkline),
    serieProjecaoChart: buildSerieProjecaoChart(serieMensal, crescimentoMoM),
    projecao30Pct,
    projecao30Valor,
    sazonalidadeMesesDestaque: sazonalidadeMesesFortes(rows, 2),
    medianaDiasEntreVisitas: medianaDiasEntreVisitas(rows),
    clientesInativosEstimados: countClientesInativos(rows, ultimoFechadoFim, 90),
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
