import { addDays, startOfDay } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { toLocalDateKey } from '@/lib/relatorios-range'

export type VisaoGeralAgendamentoRow = {
  data: string
  valor: number | null
  status_pagamento: string | null
  cliente_id: string | null
  barbeiro_id: string | null
}

/** Linha enriquecida para mix de serviços e ranking. */
export type VisaoGeralAgendamentoDetalhe = VisaoGeralAgendamentoRow & {
  servicoNome: string
  barbeiroNome: string
}

export type VisaoGeralMixSlice = {
  id: string
  nome: string
  valor: number
  pct: number
  fill: string
}

export type VisaoGeralBarbeiroRank = {
  barbeiroId: string
  nome: string
  faturamento: number
  pctVsAnterior: number | null
}

/** Azul, âmbar, verde, vermelho, violeta — alinhado à referência visual. */
const MIX_FILLS = ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444', '#8b5cf6'] as const

export type VisaoGeralDailyPoint = {
  data: string
  label: string
  faturamento: number
  atendimentos: number
}

export type VisaoGeralComputed = {
  faturamentoTotal: number
  lucroLiquidoRecebido: number
  ticketMedio: number
  atendimentos: number
  clientesUnicos: number
  serieDiaria: VisaoGeralDailyPoint[]
}

type Supabase = ReturnType<typeof createClient>

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

function formatLabelPt(d: Date): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(d).replace('.', '')
}

export function computeVisaoGeralMetrics(
  rows: VisaoGeralAgendamentoRow[],
  inicio: Date,
  fim: Date,
): VisaoGeralComputed {
  const faturamentoTotal = rows.reduce((s, r) => s + (Number(r.valor) || 0), 0)
  const lucroLiquidoRecebido = rows
    .filter((r) => r.status_pagamento === 'pago')
    .reduce((s, r) => s + (Number(r.valor) || 0), 0)
  const atendimentos = rows.length
  const ticketMedio = atendimentos > 0 ? faturamentoTotal / atendimentos : 0
  const clientesUnicos = new Set(rows.map((r) => r.cliente_id).filter(Boolean)).size

  const byDay: Record<string, { fat: number; n: number }> = {}
  for (const r of rows) {
    const k = r.data
    if (!byDay[k]) byDay[k] = { fat: 0, n: 0 }
    byDay[k].fat += Number(r.valor) || 0
    byDay[k].n += 1
  }

  const dayKeys = ymdRangeKeys(inicio, fim)
  const serieDiaria: VisaoGeralDailyPoint[] = dayKeys.map((data) => {
    const [y, m, d] = data.split('-').map(Number)
    const dt = new Date(y!, m! - 1, d!)
    const bucket = byDay[data] ?? { fat: 0, n: 0 }
    return {
      data,
      label: formatLabelPt(dt),
      faturamento: bucket.fat,
      atendimentos: bucket.n,
    }
  })

  return {
    faturamentoTotal,
    lucroLiquidoRecebido,
    ticketMedio,
    atendimentos,
    clientesUnicos,
    serieDiaria,
  }
}

export function pctChange(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual > 0 ? 100 : atual < 0 ? -100 : null
  return ((atual - anterior) / anterior) * 100
}

export async function fetchVisaoGeralAgendamentos(
  supabase: Supabase,
  barbeariaId: string,
  inicioYmd: string,
  fimYmd: string,
  barbeiroId: string | null,
): Promise<VisaoGeralAgendamentoRow[]> {
  let q = supabase
    .from('agendamentos')
    .select('data, valor, status_pagamento, cliente_id, barbeiro_id')
    .eq('barbearia_id', barbeariaId)
    .eq('status', 'concluido')
    .gte('data', inicioYmd)
    .lte('data', fimYmd)
    .order('data', { ascending: true })

  if (barbeiroId) {
    q = q.eq('barbeiro_id', barbeiroId)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as VisaoGeralAgendamentoRow[]
}

function mapAgendamentoDetalheRow(raw: Record<string, unknown>): VisaoGeralAgendamentoDetalhe {
  const servico = raw.servico as { nome?: string } | null
  const barbeiro = raw.barbeiro as { nome?: string } | null
  return {
    data: String(raw.data ?? ''),
    valor: raw.valor != null ? Number(raw.valor) : null,
    status_pagamento: raw.status_pagamento != null ? String(raw.status_pagamento) : null,
    cliente_id: raw.cliente_id != null ? String(raw.cliente_id) : null,
    barbeiro_id: raw.barbeiro_id != null ? String(raw.barbeiro_id) : null,
    servicoNome: typeof servico?.nome === 'string' && servico.nome.trim() ? servico.nome.trim() : 'Serviço',
    barbeiroNome: typeof barbeiro?.nome === 'string' && barbeiro.nome.trim() ? barbeiro.nome.trim() : 'Profissional',
  }
}

export async function fetchVisaoGeralAgendamentosDetalhe(
  supabase: Supabase,
  barbeariaId: string,
  inicioYmd: string,
  fimYmd: string,
  barbeiroId: string | null,
): Promise<VisaoGeralAgendamentoDetalhe[]> {
  let q = supabase
    .from('agendamentos')
    .select(
      `
        data,
        valor,
        status_pagamento,
        cliente_id,
        barbeiro_id,
        servico:servicos(nome),
        barbeiro:barbeiros(nome)
      `,
    )
    .eq('barbearia_id', barbeariaId)
    .eq('status', 'concluido')
    .gte('data', inicioYmd)
    .lte('data', fimYmd)
    .order('data', { ascending: true })

  if (barbeiroId) {
    q = q.eq('barbeiro_id', barbeiroId)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map((r) => mapAgendamentoDetalheRow(r as Record<string, unknown>))
}

/** Status de agenda (inclui faltou) para taxa de no-show. */
export async function fetchVisaoGeralAgendaStatuses(
  supabase: Supabase,
  barbeariaId: string,
  inicioYmd: string,
  fimYmd: string,
  barbeiroId: string | null,
): Promise<string[]> {
  let q = supabase
    .from('agendamentos')
    .select('status')
    .eq('barbearia_id', barbeariaId)
    .gte('data', inicioYmd)
    .lte('data', fimYmd)

  if (barbeiroId) {
    q = q.eq('barbeiro_id', barbeiroId)
  }

  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map((r) => String((r as { status?: string }).status ?? ''))
}

export function taxaNoShowPct(statuses: string[]): number {
  const relevant = statuses.filter((s) => s !== 'cancelado')
  if (!relevant.length) return 0
  const faltou = relevant.filter((s) => s === 'faltou').length
  return (faltou / relevant.length) * 100
}

/** % de clientes com 2+ atendimentos concluídos no recorte. */
export function taxaRetornoClientes(rows: VisaoGeralAgendamentoDetalhe[]): number {
  const porCliente = new Map<string, number>()
  for (const r of rows) {
    if (!r.cliente_id) continue
    porCliente.set(r.cliente_id, (porCliente.get(r.cliente_id) ?? 0) + 1)
  }
  let comVarias = 0
  let total = 0
  for (const n of porCliente.values()) {
    total += 1
    if (n >= 2) comVarias += 1
  }
  return total > 0 ? (comVarias / total) * 100 : 0
}

export function computeMixServicos(rows: VisaoGeralAgendamentoDetalhe[]): VisaoGeralMixSlice[] {
  const byName = new Map<string, number>()
  for (const r of rows) {
    const k = r.servicoNome || 'Serviço'
    byName.set(k, (byName.get(k) ?? 0) + (Number(r.valor) || 0))
  }
  const entries = [...byName.entries()].sort((a, b) => b[1] - a[1])
  const top = entries.slice(0, 4)
  const restSum = entries.slice(4).reduce((s, [, v]) => s + v, 0)
  const pairs: [string, number][] = restSum > 0 ? [...top, ['Outros', restSum]] : top
  const total = pairs.reduce((s, [, v]) => s + v, 0)
  if (total <= 0) return []

  return pairs.map(([nome, valor], i) => ({
    id: `${i}-${nome}`,
    nome,
    valor,
    pct: (valor / total) * 100,
    fill: MIX_FILLS[i % MIX_FILLS.length]!,
  }))
}

export function computeRankingBarbeiros(
  rowsAtual: VisaoGeralAgendamentoDetalhe[],
  rowsAnterior: VisaoGeralAgendamentoDetalhe[],
  limit = 5,
): VisaoGeralBarbeiroRank[] {
  const fatAtual = new Map<string, { nome: string; fat: number }>()
  for (const r of rowsAtual) {
    if (!r.barbeiro_id) continue
    const cur = fatAtual.get(r.barbeiro_id) ?? { nome: r.barbeiroNome, fat: 0 }
    cur.fat += Number(r.valor) || 0
    cur.nome = r.barbeiroNome
    fatAtual.set(r.barbeiro_id, cur)
  }

  const fatAnt = new Map<string, number>()
  for (const r of rowsAnterior) {
    if (!r.barbeiro_id) continue
    fatAnt.set(r.barbeiro_id, (fatAnt.get(r.barbeiro_id) ?? 0) + (Number(r.valor) || 0))
  }

  const list = [...fatAtual.entries()]
    .map(([id, v]) => ({
      barbeiroId: id,
      nome: v.nome,
      faturamento: v.fat,
      pctVsAnterior: pctChange(v.fat, fatAnt.get(id) ?? 0),
    }))
    .sort((a, b) => b.faturamento - a.faturamento)
    .slice(0, limit)

  return list
}

export type VisaoGeralDiaSemanaStat = { dow: number; label: string; mediaDiaria: number; total: number }

export function mediaFaturamentoPorDiaSemana(
  rows: VisaoGeralAgendamentoDetalhe[],
  inicio: Date,
  fim: Date,
): VisaoGeralDiaSemanaStat[] {
  const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const sum = new Array(7).fill(0)
  const count = new Array(7).fill(0)
  let cur = startOfDay(inicio)
  const end = startOfDay(fim)
  while (cur.getTime() <= end.getTime()) {
    const dow = cur.getDay()
    count[dow] += 1
    cur = addDays(cur, 1)
  }

  for (const r of rows) {
    const [y, m, d] = r.data.split('-').map(Number)
    const dt = new Date(y!, m! - 1, d!)
    const dow = dt.getDay()
    sum[dow] += Number(r.valor) || 0
  }

  return labels.map((label, dow) => ({
    dow,
    label,
    mediaDiaria: count[dow] > 0 ? sum[dow] / count[dow] : 0,
    total: sum[dow],
  }))
}

export async function fetchNovosClientesNoPeriodo(
  supabase: Supabase,
  barbeariaId: string,
  inicioIso: string,
  fimIsoExclusive: string,
): Promise<number> {
  const { count, error } = await supabase
    .from('clientes')
    .select('*', { count: 'exact', head: true })
    .eq('barbearia_id', barbeariaId)
    .gte('created_at', inicioIso)
    .lt('created_at', fimIsoExclusive)

  if (error) throw error
  return count ?? 0
}
