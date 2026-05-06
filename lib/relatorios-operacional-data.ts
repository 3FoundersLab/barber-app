import { addDays, startOfDay } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { parseHorarioToMinutes } from '@/lib/build-admin-dashboard-status-hoje'
import { toLocalDateKey } from '@/lib/relatorios-range'
import { taxaNoShowPct, type VisaoGeralAgendamentoDetalhe } from '@/lib/relatorios-visao-geral-data'
import type { Barbearia } from '@/types'

type Supabase = ReturnType<typeof createClient>

const OCUPA_CADEIRA = new Set(['agendado', 'em_atendimento', 'concluido', 'faltou'])

export type OperacionalAgendaRow = {
  data: string
  horario: string
  status: string
  barbeiro_id: string
  cliente_id: string | null
  duracaoMin: number
  valor: number
  status_pagamento: string | null
  servicoNome: string
  barbeiroNome: string
}

export type OperacionalComputed = {
  taxaOcupacaoPct: number | null
  tempoMedioAtendMin: number | null
  tempoOciosoPct: number | null
  produtividadeHora: number | null
  taxaCancelamentoPct: number
  taxaNoShowPct: number
  servicosRealizados: number
  faturamentoConcluido: number
  minutosOcupados: number
  minutosDisponiveis: number
}

function ymdRangeKeys(inicio: Date, fim: Date): string[] {
  const keys: string[] = []
  let cur = startOfDay(inicio)
  const end = startOfDay(fim)
  while (cur.getTime() <= end.getTime()) {
    keys.push(toLocalDateKey(cur))
    cur = addDays(cur, 1)
  }
  return keys
}

function duracaoServico(raw: unknown): number {
  const s = raw as { duracao?: number } | null
  const d = s?.duracao != null ? Number(s.duracao) : 30
  return Math.max(5, Number.isFinite(d) ? d : 30)
}

function pauseOverlap(start: number, end: number, pStart: number, pEnd: number): number {
  const i = Math.max(start, pStart)
  const j = Math.min(end, pEnd)
  return Math.max(0, j - i)
}

function netMinutesHorarioRow(row: {
  hora_inicio: string
  hora_fim: string
  pausas?: { pausa_inicio?: string | null; pausa_fim?: string | null }[] | null
}): number {
  const start = parseHorarioToMinutes(row.hora_inicio)
  const end = parseHorarioToMinutes(row.hora_fim)
  if (start == null || end == null || end <= start) return 0
  let net = end - start
  const pausas = row.pausas ?? []
  for (const p of pausas) {
    const ps = parseHorarioToMinutes(p.pausa_inicio ?? null)
    const pe = parseHorarioToMinutes(p.pausa_fim ?? null)
    if (ps == null || pe == null || pe <= ps) continue
    net -= pauseOverlap(start, end, ps, pe)
  }
  return Math.max(0, net)
}

/** Soma minutos líquidos por `(barbeiro_id)-(dia_semana 0–6)`. */
export async function fetchHorariosNetPorBarbeiroDia(
  supabase: Supabase,
  barbeiroIds: string[],
): Promise<Map<string, number>> {
  const acc = new Map<string, number>()
  if (!barbeiroIds.length) return acc

  const { data, error } = await supabase
    .from('horarios_trabalho')
    .select(
      'barbeiro_id, dia_semana, hora_inicio, hora_fim, ativo, pausas:horarios_trabalho_pausas(pausa_inicio, pausa_fim)',
    )
    .in('barbeiro_id', barbeiroIds)
    .eq('ativo', true)

  if (error) throw error

  for (const row of data ?? []) {
    const bid = String((row as { barbeiro_id?: string }).barbeiro_id ?? '')
    const dow = Number((row as { dia_semana?: number }).dia_semana)
    if (!bid || !Number.isFinite(dow)) continue
    const key = `${bid}-${dow}`
    const net = netMinutesHorarioRow(
      row as { hora_inicio: string; hora_fim: string; pausas?: { pausa_inicio?: string; pausa_fim?: string }[] },
    )
    acc.set(key, (acc.get(key) ?? 0) + net)
  }
  return acc
}

function lojaAbertaNoDow(barbearia: Pick<Barbearia, 'dias_funcionamento'>, dow: number): boolean {
  const dias = barbearia.dias_funcionamento
  if (dias != null && dias.length > 0) return dias.includes(dow)
  return true
}

function minutosExpedienteBarbearia(
  barbearia: Pick<Barbearia, 'horario_abertura' | 'horario_fechamento'>,
): number {
  const openM = parseHorarioToMinutes(barbearia.horario_abertura ?? null)
  const closeM = parseHorarioToMinutes(barbearia.horario_fechamento ?? null)
  if (openM == null || closeM == null || closeM <= openM) return 8 * 60
  return closeM - openM
}

function minutosDisponiveisPeriodo(
  inicio: Date,
  fim: Date,
  barbeiroIds: string[],
  horariosNet: Map<string, number>,
  barbearia: Pick<Barbearia, 'dias_funcionamento' | 'horario_abertura' | 'horario_fechamento'>,
): number {
  let total = 0
  const fallback = minutosExpedienteBarbearia(barbearia)
  const days = ymdRangeKeys(inicio, fim)

  for (const ymd of days) {
    const [y, m, d] = ymd.split('-').map(Number)
    const dt = new Date(y!, m! - 1, d!)
    const dow = dt.getDay()
    if (!lojaAbertaNoDow(barbearia, dow)) continue

    for (const bid of barbeiroIds) {
      const key = `${bid}-${dow}`
      let net = horariosNet.get(key) ?? 0
      if (net <= 0) net = fallback
      total += net
    }
  }
  return total
}

function minutosOcupados(rows: OperacionalAgendaRow[]): number {
  let m = 0
  for (const r of rows) {
    if (OCUPA_CADEIRA.has(r.status)) m += r.duracaoMin
  }
  return m
}

export function mapOperacionalAgendamentoRow(raw: Record<string, unknown>): OperacionalAgendaRow {
  const servico = raw.servico as { duracao?: number; nome?: string } | null
  const barbeiro = raw.barbeiro as { nome?: string } | null
  return {
    data: String(raw.data ?? ''),
    horario: String(raw.horario ?? ''),
    status: String(raw.status ?? ''),
    barbeiro_id: String(raw.barbeiro_id ?? ''),
    cliente_id: raw.cliente_id != null ? String(raw.cliente_id) : null,
    duracaoMin: duracaoServico(servico),
    valor: raw.valor != null ? Number(raw.valor) : 0,
    status_pagamento: raw.status_pagamento != null ? String(raw.status_pagamento) : null,
    servicoNome:
      typeof servico?.nome === 'string' && servico.nome.trim() ? servico.nome.trim() : 'Serviço',
    barbeiroNome:
      typeof barbeiro?.nome === 'string' && barbeiro.nome.trim() ? barbeiro.nome.trim() : 'Profissional',
  }
}

export async function fetchOperacionalAgendamentos(
  supabase: Supabase,
  barbeariaId: string,
  inicioYmd: string,
  fimYmd: string,
  barbeiroId: string | null,
): Promise<OperacionalAgendaRow[]> {
  let q = supabase
    .from('agendamentos')
    .select(
      `
        data,
        horario,
        status,
        barbeiro_id,
        cliente_id,
        valor,
        status_pagamento,
        servico:servicos(duracao, nome),
        barbeiro:barbeiros(nome)
      `,
    )
    .eq('barbearia_id', barbeariaId)
    .gte('data', inicioYmd)
    .lte('data', fimYmd)
    .order('data', { ascending: true })

  if (barbeiroId) q = q.eq('barbeiro_id', barbeiroId)

  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map((r) => mapOperacionalAgendamentoRow(r as Record<string, unknown>))
}

export function computeOperacionalMetrics(
  rows: OperacionalAgendaRow[],
  horariosNet: Map<string, number>,
  barbearia: Pick<Barbearia, 'dias_funcionamento' | 'horario_abertura' | 'horario_fechamento'>,
  barbeiroIds: string[],
  inicio: Date,
  fim: Date,
): OperacionalComputed {
  const disponiveis = minutosDisponiveisPeriodo(inicio, fim, barbeiroIds, horariosNet, barbearia)
  const ocupados = minutosOcupados(rows)

  const taxaOcupacaoPct =
    disponiveis > 0 ? Math.min(100, (ocupados / disponiveis) * 100) : ocupados > 0 ? 100 : null

  const tempoOciosoPct = taxaOcupacaoPct != null ? Math.max(0, 100 - taxaOcupacaoPct) : null

  const concluidos = rows.filter((r) => r.status === 'concluido')
  const servicosRealizados = concluidos.length
  const faturamentoConcluido = concluidos.reduce((s, r) => s + (Number(r.valor) || 0), 0)
  const minConcl = concluidos.reduce((s, r) => s + r.duracaoMin, 0)
  const tempoMedioAtendMin = servicosRealizados > 0 ? minConcl / servicosRealizados : null

  const horasServicoConcluido = minConcl / 60
  const produtividadeHora =
    horasServicoConcluido > 0.01 ? faturamentoConcluido / horasServicoConcluido : null

  const total = rows.length
  const cancelados = rows.filter((r) => r.status === 'cancelado').length
  const taxaCancelamentoPct = total > 0 ? (cancelados / total) * 100 : 0

  const taxaNoShow = taxaNoShowPct(rows.map((r) => r.status))

  return {
    taxaOcupacaoPct,
    tempoMedioAtendMin,
    tempoOciosoPct,
    produtividadeHora,
    taxaCancelamentoPct,
    taxaNoShowPct: taxaNoShow,
    servicosRealizados,
    faturamentoConcluido,
    minutosOcupados: ocupados,
    minutosDisponiveis: disponiveis,
  }
}

const HEATMAP_DOW_ORDER = [1, 2, 3, 4, 5, 6, 0] as const
const HEATMAP_DOW_LABELS: Record<number, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
}

/** Contagem de agendamentos que ocupam cadeira por dia da semana × hora de início (local). */
export function computeHeatmapDowHora(
  rows: OperacionalAgendaRow[],
  hourStart = 9,
  hourEnd = 20,
): {
  dowOrder: readonly number[]
  dowLabels: string[]
  hourLabels: string[]
  /** counts[dow][hourIndex] */
  matrix: number[][]
  globalMax: number
} {
  const nH = hourEnd - hourStart + 1
  const matrix: number[][] = Array.from({ length: 7 }, () => new Array(nH).fill(0))

  for (const r of rows) {
    if (!OCUPA_CADEIRA.has(r.status)) continue
    const [y, m, d] = r.data.split('-').map(Number)
    const dt = new Date(y!, m! - 1, d!)
    const dow = dt.getDay()
    const hm = parseHorarioToMinutes(r.horario)
    if (hm == null) continue
    const h = Math.floor(hm / 60)
    if (h < hourStart || h > hourEnd) continue
    matrix[dow]![h - hourStart] += 1
  }

  let globalMax = 0
  for (const row of matrix) {
    for (const c of row) globalMax = Math.max(globalMax, c)
  }

  const hourLabels = Array.from({ length: nH }, (_, i) => `${hourStart + i}h`)

  return {
    dowOrder: HEATMAP_DOW_ORDER,
    dowLabels: HEATMAP_DOW_ORDER.map((d) => HEATMAP_DOW_LABELS[d] ?? ''),
    hourLabels,
    matrix,
    globalMax: Math.max(1, globalMax),
  }
}

/** Intensidade relativa por hora (0–100) para curva ao longo do dia. */
export function computeCurvaPorHora(
  rows: OperacionalAgendaRow[],
  hourStart = 8,
  hourEnd = 20,
): { hora: number; label: string; intensidadePct: number; raw: number }[] {
  const counts = new Array(24).fill(0)
  for (const r of rows) {
    if (!OCUPA_CADEIRA.has(r.status)) continue
    const hm = parseHorarioToMinutes(r.horario)
    if (hm == null) continue
    const idx = Math.floor(hm / 60)
    if (idx >= 0 && idx < 24) counts[idx] += 1
  }
  const slice = counts.slice(hourStart, hourEnd + 1)
  const maxC = Math.max(1, ...slice)
  return slice.map((raw, i) => ({
    hora: hourStart + i,
    label: `${String(hourStart + i).padStart(2, '0')}h`,
    intensidadePct: (raw / maxC) * 100,
    raw,
  }))
}

export function rowsConcluidosComoDetalhe(rows: OperacionalAgendaRow[]): VisaoGeralAgendamentoDetalhe[] {
  return rows
    .filter((r) => r.status === 'concluido')
    .map((r) => ({
      data: r.data,
      valor: r.valor,
      status_pagamento: r.status_pagamento,
      cliente_id: r.cliente_id,
      barbeiro_id: r.barbeiro_id,
      servicoNome: r.servicoNome,
      barbeiroNome: r.barbeiroNome,
    }))
}

/** Serviço com maior taxa de cancelamento (mínimo de volume para evitar ruído). */
export function computePiorServicoCancelamento(
  rows: OperacionalAgendaRow[],
  minTotal = 6,
): { nome: string; pct: number } | null {
  const by = new Map<string, { tot: number; canc: number }>()
  for (const r of rows) {
    const k = r.servicoNome || 'Serviço'
    const cur = by.get(k) ?? { tot: 0, canc: 0 }
    cur.tot += 1
    if (r.status === 'cancelado') cur.canc += 1
    by.set(k, cur)
  }
  let best: { nome: string; pct: number } | null = null
  for (const [nome, v] of by) {
    if (v.tot < minTotal) continue
    const pct = (v.canc / v.tot) * 100
    if (pct < 2) continue
    if (!best || pct > best.pct) best = { nome, pct }
  }
  return best
}

/** Média de contagens nas horas 14–16 vs média geral (para texto). */
export function analiseJanelaOciosa14h16(
  curva: { hora: number; raw: number }[],
  diasNoPeriodo: number,
): { ociosa: boolean; ratio: number } | null {
  if (diasNoPeriodo < 1) return null
  const alvo = curva.filter((p) => p.hora >= 14 && p.hora <= 16)
  if (!alvo.length) return null
  const mediaAlvo = alvo.reduce((s, p) => s + p.raw, 0) / alvo.length / diasNoPeriodo
  const mediaGeral = curva.reduce((s, p) => s + p.raw, 0) / curva.length / diasNoPeriodo
  if (mediaGeral <= 0) return null
  const ratio = mediaAlvo / mediaGeral
  return { ociosa: ratio < 0.65, ratio }
}

export function taxaOcupacaoEstimadaBarbeiro(
  rows: OperacionalAgendaRow[],
  barbeiroId: string,
  taxaGlobalPct: number | null,
): number | null {
  if (!taxaGlobalPct || taxaGlobalPct <= 0) return null
  const fat = rows
    .filter((r) => r.barbeiro_id === barbeiroId && r.status === 'concluido')
    .reduce((s, r) => s + (Number(r.valor) || 0), 0)
  const fatTotal = rows
    .filter((r) => r.status === 'concluido')
    .reduce((s, r) => s + (Number(r.valor) || 0), 0)
  if (fatTotal <= 0) return null
  const share = fat / fatTotal
  return Math.min(98, Math.round(taxaGlobalPct * (0.35 + share * 1.25)))
}
