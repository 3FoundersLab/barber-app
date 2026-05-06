import { addDays, startOfDay } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { parseHorarioToMinutes } from '@/lib/build-admin-dashboard-status-hoje'
import { toLocalDateKey } from '@/lib/relatorios-range'
import { taxaNoShowPct } from '@/lib/relatorios-visao-geral-data'
import type { Barbearia } from '@/types'

type Supabase = ReturnType<typeof createClient>

const OCUPA_CADEIRA = new Set(['agendado', 'em_atendimento', 'concluido', 'faltou'])

export type OperacionalAgendaRow = {
  data: string
  horario: string
  status: string
  barbeiro_id: string
  duracaoMin: number
  valor: number
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
  const servico = raw.servico as { duracao?: number } | null
  return {
    data: String(raw.data ?? ''),
    horario: String(raw.horario ?? ''),
    status: String(raw.status ?? ''),
    barbeiro_id: String(raw.barbeiro_id ?? ''),
    duracaoMin: duracaoServico(servico),
    valor: raw.valor != null ? Number(raw.valor) : 0,
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
    .select('data, horario, status, barbeiro_id, valor, servico:servicos(duracao)')
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
