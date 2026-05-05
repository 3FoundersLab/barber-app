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
