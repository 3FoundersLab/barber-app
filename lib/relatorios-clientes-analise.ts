import {
  addMonths,
  differenceInCalendarDays,
  differenceInYears,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AppointmentStatus } from '@/types'

export const DIAS_INATIVO = 60
export const DIAS_RISCO = 45
export const VIP_VISITAS_MES = 3

export type AgHistoricoCliente = {
  cliente_id: string
  data: string
  horario: string
  status: AppointmentStatus
  valor: number
  servico_id: string
  barbeiro_id: string
  servico?: { nome: string } | null
  barbeiro?: { nome: string } | null
}

export type ClienteCadastroAnalise = {
  id: string
  nome: string
  created_at: string
  origem_canal?: string | null
  data_nascimento?: string | null
}

export const ORIGEM_CANAL_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  indicacao: 'Indicação',
  walk_in: 'Walk-in',
  google: 'Google',
  site: 'Site',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
  outro: 'Outro',
}

export function labelOrigemCanal(v: string | null | undefined): string {
  if (!v || !String(v).trim()) return 'Não informado'
  const k = String(v).trim().toLowerCase()
  return ORIGEM_CANAL_LABEL[k] ?? v
}

function horaBucket(horario: string): number {
  const [h] = horario.split(':').map(Number)
  return Number.isFinite(h) ? h : 0
}

function parseLocalDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function monthKey(d: Date): string {
  return format(d, 'yyyy-MM')
}

function isYmdInMonth(ymd: string, monthStart: Date): boolean {
  const t = parseLocalDate(ymd).getTime()
  return t >= monthStart.getTime() && t <= endOfMonth(monthStart).getTime()
}

/** Primeira data de serviço concluído por cliente (YYYY-MM-DD). */
export function primeiraVisitaConcluidaPorCliente(rows: AgHistoricoCliente[]): Map<string, string> {
  const m = new Map<string, string>()
  for (const r of rows) {
    if (r.status !== 'concluido') continue
    const cur = m.get(r.cliente_id)
    if (!cur || r.data < cur) m.set(r.cliente_id, r.data)
  }
  return m
}

/** Última data concluída por cliente. */
export function ultimaVisitaConcluidaPorCliente(rows: AgHistoricoCliente[]): Map<string, string> {
  const m = new Map<string, string>()
  for (const r of rows) {
    if (r.status !== 'concluido') continue
    const cur = m.get(r.cliente_id)
    if (!cur || r.data > cur) m.set(r.cliente_id, r.data)
  }
  return m
}

export function contarVipMesAtual(
  rows: AgHistoricoCliente[],
  ref: Date,
): { count: number; ids: Set<string> } {
  const ini = startOfMonth(ref)
  const fim = endOfMonth(ref)
  const byCliente = new Map<string, number>()
  for (const r of rows) {
    if (r.status !== 'concluido') continue
    if (!isYmdInMonth(r.data, ini)) continue
    byCliente.set(r.cliente_id, (byCliente.get(r.cliente_id) ?? 0) + 1)
  }
  const ids = new Set<string>()
  for (const [cid, n] of byCliente) {
    if (n >= VIP_VISITAS_MES) ids.add(cid)
  }
  return { count: ids.size, ids }
}

export function contarNovosEsteMes(clientes: ClienteCadastroAnalise[], ref: Date): number {
  const ini = startOfMonth(ref)
  const fim = endOfMonth(ref)
  let n = 0
  for (const c of clientes) {
    const t = parseISO(c.created_at).getTime()
    if (t >= ini.getTime() && t <= fim.getTime()) n += 1
  }
  return n
}

/** Clientes com último concluído há mais de `dias` dias (entre os que têm histórico concluído). */
export function clientesInativos(
  ultima: Map<string, string>,
  nomePorId: Map<string, string>,
  ref: Date,
  dias: number,
): { count: number; amostra: { id: string; nome: string; diasDesdeUltima: number }[] } {
  const out: { id: string; nome: string; diasDesdeUltima: number }[] = []
  for (const [cid, dataUlt] of ultima) {
    const d = differenceInCalendarDays(ref, parseLocalDate(dataUlt))
    if (d > dias) {
      out.push({ id: cid, nome: nomePorId.get(cid) ?? '—', diasDesdeUltima: d })
    }
  }
  out.sort((a, b) => b.diasDesdeUltima - a.diasDesdeUltima)
  return { count: out.length, amostra: out.slice(0, 30) }
}

export function clientesEmRisco(
  ultima: Map<string, string>,
  nomePorId: Map<string, string>,
  ref: Date,
  diasMin: number,
): { id: string; nome: string; dias: number }[] {
  const out: { id: string; nome: string; dias: number }[] = []
  for (const [cid, dataUlt] of ultima) {
    const d = differenceInCalendarDays(ref, parseLocalDate(dataUlt))
    if (d >= diasMin) {
      out.push({ id: cid, nome: nomePorId.get(cid) ?? '—', dias: d })
    }
  }
  out.sort((a, b) => b.dias - a.dias)
  return out.slice(0, 40)
}

export type SegmentoRfv = 'campeoes' | 'fieis' | 'em_risco' | 'novos' | 'ocasionais' | 'sem_atividade'

/** RFV simplificado (recência, frequência 365d, valor 365d) com nomes do cadastro. */
export function segmentarRfvComNomes(
  rows: AgHistoricoCliente[],
  clientes: ClienteCadastroAnalise[],
  ref: Date,
): Record<SegmentoRfv, { id: string; nome: string }[]> {
  const ultima = ultimaVisitaConcluidaPorCliente(rows)
  const primeira = primeiraVisitaConcluidaPorCliente(rows)
  const refMs = ref.getTime()
  const ms365 = 365 * 86400000
  const ms90 = 90 * 86400000

  const freqValor = new Map<string, { f: number; m: number }>()
  const totalConcluidoVida = new Map<string, number>()
  for (const r of rows) {
    if (r.status !== 'concluido') continue
    totalConcluidoVida.set(r.cliente_id, (totalConcluidoVida.get(r.cliente_id) ?? 0) + 1)
    const t = parseLocalDate(r.data).getTime()
    if (refMs - t > ms365) continue
    const cur = freqValor.get(r.cliente_id) ?? { f: 0, m: 0 }
    cur.f += 1
    cur.m += Number(r.valor) || 0
    freqValor.set(r.cliente_id, cur)
  }

  const valores = [...freqValor.values()].map((v) => v.m).sort((a, b) => a - b)
  const q75 = valores.length ? valores[Math.floor(valores.length * 0.75)] : 0

  const seg: Record<SegmentoRfv, { id: string; nome: string }[]> = {
    campeoes: [],
    fieis: [],
    em_risco: [],
    novos: [],
    ocasionais: [],
    sem_atividade: [],
  }

  for (const c of clientes) {
    const id = c.id
    const nome = c.nome
    const u = ultima.get(id)
    const totVida = totalConcluidoVida.get(id) ?? 0

    if (!u || totVida === 0) {
      seg.sem_atividade.push({ id, nome })
      continue
    }

    const diasUlt = differenceInCalendarDays(ref, parseLocalDate(u))
    const fv = freqValor.get(id)
    const f = fv?.f ?? 0
    const m = fv?.m ?? 0
    const p = primeira.get(id)
    const primeiraMs = p ? parseLocalDate(p).getTime() : refMs
    const primeiraVisitaRecente = refMs - primeiraMs <= ms90
    const visitasVida = totVida

    if (f >= 4 && m >= q75 && diasUlt < 45) {
      seg.campeoes.push({ id, nome })
    } else if (diasUlt >= DIAS_RISCO && visitasVida >= 2) {
      seg.em_risco.push({ id, nome })
    } else if (f >= 2 && diasUlt < 90) {
      seg.fieis.push({ id, nome })
    } else if (f === 1 || (primeiraVisitaRecente && f <= 2)) {
      seg.novos.push({ id, nome })
    } else {
      seg.ocasionais.push({ id, nome })
    }
  }

  return seg
}

export function topPercentilValor(
  rows: AgHistoricoCliente[],
  clientes: ClienteCadastroAnalise[],
  pct: number,
): { id: string; nome: string; valor: number }[] {
  const sum = new Map<string, number>()
  for (const r of rows) {
    if (r.status !== 'concluido') continue
    sum.set(r.cliente_id, (sum.get(r.cliente_id) ?? 0) + (Number(r.valor) || 0))
  }
  const arr = [...sum.entries()]
    .map(([id, valor]) => ({
      id,
      nome: clientes.find((c) => c.id === id)?.nome ?? '—',
      valor,
    }))
    .sort((a, b) => b.valor - a.valor)
  const cut = Math.max(1, Math.ceil((arr.length * pct) / 100))
  return arr.slice(0, cut)
}

export function clientesPrimeiraVez(
  rows: AgHistoricoCliente[],
  clientes: ClienteCadastroAnalise[],
): { id: string; nome: string }[] {
  const count = new Map<string, number>()
  for (const r of rows) {
    if (r.status !== 'concluido') continue
    count.set(r.cliente_id, (count.get(r.cliente_id) ?? 0) + 1)
  }
  const out: { id: string; nome: string }[] = []
  for (const c of clientes) {
    if ((count.get(c.id) ?? 0) === 1) out.push({ id: c.id, nome: c.nome })
  }
  return out.slice(0, 50)
}

export type CohortLinha = {
  cohortMes: string
  cohortLabel: string
  tamanho: number
  retencao: (number | null)[]
}

/** Retenção por mês civil após o mês de primeira conclusão (0 = mês da 1ª visita). Até `horizonte` meses. */
export function cohortRetencao(
  rows: AgHistoricoCliente[],
  horizonte = 6,
  mesesAtras = 12,
  ref: Date = new Date(),
): CohortLinha[] {
  const primeira = primeiraVisitaConcluidaPorCliente(rows)
  const porCohort = new Map<string, Set<string>>()
  for (const [cid, data] of primeira) {
    const d = parseLocalDate(data)
    const mk = monthKey(d)
    const s = porCohort.get(mk) ?? new Set()
    s.add(cid)
    porCohort.set(mk, s)
  }

  const limInf = addMonths(startOfMonth(ref), -(mesesAtras + horizonte))
  const cohortKeys = [...porCohort.keys()].filter((k) => {
    const t = parseLocalDate(`${k}-01`).getTime()
    return t >= limInf.getTime() && t <= ref.getTime()
  })
  cohortKeys.sort()

  function clienteConcluidoNoMes(cid: string, mesRef: Date): boolean {
    const mk = monthKey(mesRef)
    for (const r of rows) {
      if (r.cliente_id !== cid || r.status !== 'concluido') continue
      if (monthKey(parseLocalDate(r.data)) === mk) return true
    }
    return false
  }

  const linhas: CohortLinha[] = []
  for (const ck of cohortKeys.slice(-mesesAtras)) {
    const cohortDate = parseLocalDate(`${ck}-01`)
    const base = porCohort.get(ck) ?? new Set()
    const tamanho = base.size
    if (tamanho === 0) continue
    const retencao: (number | null)[] = []
    for (let k = 0; k <= horizonte; k++) {
      const mesK = addMonths(cohortDate, k)
      if (mesK.getTime() > endOfMonth(ref).getTime()) {
        retencao.push(null)
        continue
      }
      let ativos = 0
      for (const cid of base) {
        if (clienteConcluidoNoMes(cid, mesK)) ativos += 1
      }
      retencao.push(Math.round((ativos / tamanho) * 1000) / 10)
    }
    linhas.push({
      cohortMes: ck,
      cohortLabel: format(cohortDate, "MMM ''yy", { locale: ptBR }),
      tamanho,
      retencao,
    })
  }
  return linhas.slice(-mesesAtras)
}

export function ltvMedioProjetado(rows: AgHistoricoCliente[]): {
  ticketHistorico: number
  projAnual: number
  detalhe: string
} {
  let sum = 0
  const ids = new Set<string>()
  for (const r of rows) {
    if (r.status !== 'concluido') continue
    sum += Number(r.valor) || 0
    ids.add(r.cliente_id)
  }
  const n = Math.max(1, ids.size)
  const ticketHistorico = sum / n
  const projAnual = Math.round(ticketHistorico * 12 * 10) / 10
  const detalhe =
    'LTV anual projetado = ticket médio histórico (concluídos no período analisado) × 12. Ajuste fino exige histórico completo e taxa de churn.'
  return { ticketHistorico, projAnual, detalhe }
}

export function preferenciasAgregadas(rows: AgHistoricoCliente[], diasLookback = 90, ref: Date = new Date()) {
  const lim = ref.getTime() - diasLookback * 86400000
  const serv = new Map<string, number>()
  const hora = new Map<number, number>()
  const barb = new Map<string, number>()
  for (const r of rows) {
    if (r.status !== 'concluido') continue
    if (parseLocalDate(r.data).getTime() < lim) continue
    const sn = r.servico?.nome ?? 'Serviço'
    serv.set(sn, (serv.get(sn) ?? 0) + 1)
    const h = horaBucket(r.horario)
    hora.set(h, (hora.get(h) ?? 0) + 1)
    const bn = r.barbeiro?.nome ?? 'Profissional'
    barb.set(bn, (barb.get(bn) ?? 0) + 1)
  }
  const top = (m: Map<string, number>, n: number) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
  const topH = [...hora.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  return {
    servicos: top(serv, 5),
    horarios: topH.map(([h, v]) => ({ label: `${h}h`, v })),
    barbeiros: top(barb, 5),
  }
}

export function timelineNovosPorMes(clientes: ClienteCadastroAnalise[], meses = 12, ref: Date = new Date()) {
  const labels: { key: string; label: string; n: number }[] = []
  for (let i = meses - 1; i >= 0; i--) {
    const d = addMonths(startOfMonth(ref), -i)
    const key = monthKey(d)
    labels.push({
      key,
      label: format(d, 'MMM yy', { locale: ptBR }),
      n: 0,
    })
  }
  const idx = new Map(labels.map((l, i) => [l.key, i]))
  for (const c of clientes) {
    const mk = monthKey(parseISO(c.created_at))
    const j = idx.get(mk)
    if (j !== undefined) labels[j].n += 1
  }
  return labels
}

export function distribuicaoOrigem(clientes: ClienteCadastroAnalise[]) {
  const m = new Map<string, number>()
  for (const c of clientes) {
    const k = c.origem_canal && String(c.origem_canal).trim() ? String(c.origem_canal).trim().toLowerCase() : '_nao'
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  const total = clientes.length || 1
  return [...m.entries()]
    .map(([k, n]) => ({
      key: k,
      label: k === '_nao' ? 'Não informado' : labelOrigemCanal(k),
      n,
      pct: (n / total) * 100,
    }))
    .sort((a, b) => b.n - a.n)
}

const FAIXAS: { id: string; min: number; max: number }[] = [
  { id: '18-25', min: 18, max: 25 },
  { id: '26-35', min: 26, max: 35 },
  { id: '36-45', min: 36, max: 45 },
  { id: '46-55', min: 46, max: 55 },
  { id: '56+', min: 56, max: 130 },
]

export function distribuicaoFaixaEtaria(clientes: ClienteCadastroAnalise[], ref: Date = new Date()) {
  const counts = new Map<string, number>()
  for (const f of FAIXAS) counts.set(f.id, 0)
  counts.set('sem_info', 0)
  for (const c of clientes) {
    if (!c.data_nascimento) {
      counts.set('sem_info', (counts.get('sem_info') ?? 0) + 1)
      continue
    }
    const age = differenceInYears(ref, parseISO(c.data_nascimento))
    if (!Number.isFinite(age) || age < 12) {
      counts.set('sem_info', (counts.get('sem_info') ?? 0) + 1)
      continue
    }
    let placed = false
    for (const f of FAIXAS) {
      if (age >= f.min && age <= f.max) {
        counts.set(f.id, (counts.get(f.id) ?? 0) + 1)
        placed = true
        break
      }
    }
    if (!placed && age >= 56) counts.set('56+', (counts.get('56+') ?? 0) + 1)
    else if (!placed) counts.set('sem_info', (counts.get('sem_info') ?? 0) + 1)
  }
  const order = [...FAIXAS.map((f) => f.id), 'sem_info']
  return order.map((id) => ({
    id,
    label: id === 'sem_info' ? 'Não informado' : `${id} anos`,
    n: counts.get(id) ?? 0,
  }))
}
