import { eachDayOfInterval, format, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { classificarServicoReceita } from '@/lib/relatorios-agregacao'
import { toLocalDateKey } from '@/lib/relatorios-range'
import type { Agendamento } from '@/types'

export type BarbeiroRankingRow = {
  id: string
  nome: string
  atendimentos: number
  concluidos: number
  faturamentoServicos: number
  faturamentoProdutos: number
  faturamentoTotal: number
  ticketMedio: number
  notaEstimada: number | null
  taxaRetencaoPct: number
  horarioPico: string
  servicoSignature: string
}

function horaDoAgendamento(horario: string): number {
  const [h] = horario.split(':').map(Number)
  return Number.isFinite(h) ? h : 0
}

/** Nota 1–5 estimada (sem sistema de review): combina taxa de conclusão e volume mínimo. */
export function notaEstimadaBarbeiro(concluidos: number, totalAgenda: number): number | null {
  if (totalAgenda < 5) return null
  const r = concluidos / Math.max(1, totalAgenda)
  const n = 3.2 + r * 1.7
  return Math.round(Math.min(5, Math.max(1, n)) * 10) / 10
}

export function retencaoClientesBarbeiro(list: Agendamento[], barbeiroId: string): number {
  const porCliente = new Map<string, number>()
  for (const a of list) {
    if (a.barbeiro_id !== barbeiroId || a.status !== 'concluido') continue
    porCliente.set(a.cliente_id, (porCliente.get(a.cliente_id) ?? 0) + 1)
  }
  let comVarias = 0
  let comAlguma = 0
  for (const n of porCliente.values()) {
    comAlguma += 1
    if (n >= 2) comVarias += 1
  }
  return comAlguma > 0 ? Math.round((comVarias / comAlguma) * 1000) / 10 : 0
}

export function horarioMaisProdutivo(list: Agendamento[], barbeiroId: string): string {
  const h = new Array(24).fill(0)
  for (const a of list) {
    if (a.barbeiro_id !== barbeiroId || a.status !== 'concluido') continue
    h[horaDoAgendamento(a.horario)] += 1
  }
  let bestH = 0
  let maxV = -1
  for (let i = 0; i < 24; i++) {
    if (h[i] > maxV) {
      maxV = h[i]
      bestH = i
    }
  }
  if (maxV <= 0) return '—'
  return `${bestH}h`
}

export function servicoSignatureBarbeiro(list: Agendamento[], barbeiroId: string): string {
  const m = new Map<string, { nome: string; q: number }>()
  for (const a of list) {
    if (a.barbeiro_id !== barbeiroId || a.status !== 'concluido') continue
    const id = a.servico_id
    const nome = a.servico?.nome ?? 'Serviço'
    const cur = m.get(id) ?? { nome, q: 0 }
    cur.q += 1
    m.set(id, cur)
  }
  let best = ''
  let bestQ = 0
  for (const v of m.values()) {
    if (v.q > bestQ) {
      bestQ = v.q
      best = v.nome
    }
  }
  return best || '—'
}

export function rankingBarbeirosCompleto(
  list: Agendamento[],
  receitaProdutosPorBarbeiro: Record<string, number>,
): BarbeiroRankingRow[] {
  const base = new Map<
    string,
    {
      nome: string
      q: number
      concl: number
      fatServ: number
    }
  >()
  for (const a of list) {
    const id = a.barbeiro_id
    const nome = a.barbeiro?.nome ?? '—'
    const cur = base.get(id) ?? { nome, q: 0, concl: 0, fatServ: 0 }
    cur.q += 1
    if (a.status === 'concluido') {
      cur.concl += 1
      cur.fatServ += Number(a.valor) || 0
    }
    base.set(id, cur)
  }

  const rows: BarbeiroRankingRow[] = []
  for (const [id, v] of base) {
    const fatProd = receitaProdutosPorBarbeiro[id] ?? 0
    const fatTot = v.fatServ + fatProd
    const ticket = v.concl > 0 ? fatTot / v.concl : 0
    rows.push({
      id,
      nome: v.nome,
      atendimentos: v.q,
      concluidos: v.concl,
      faturamentoServicos: v.fatServ,
      faturamentoProdutos: fatProd,
      faturamentoTotal: fatTot,
      ticketMedio: ticket,
      notaEstimada: notaEstimadaBarbeiro(v.concl, v.q),
      taxaRetencaoPct: retencaoClientesBarbeiro(list, id),
      horarioPico: horarioMaisProdutivo(list, id),
      servicoSignature: servicoSignatureBarbeiro(list, id),
    })
  }
  return rows.sort((a, b) => b.faturamentoTotal - a.faturamentoTotal)
}

export type RadarBarbeiro = {
  corte: number
  barba: number
  vendas: number
  pontualidade: number
  satisfacao: number
}

/** Valores 0–100 para desenho do radar (satisfação = nota estimada × 20 ou proxy). */
export function radarHabilidadesBarbeiro(
  list: Agendamento[],
  barbeiroId: string,
  receitaProdutos: number,
  maxReceitaProdutosTime: number,
): RadarBarbeiro {
  let corte = 0
  let barba = 0
  let outros = 0
  let concl = 0
  let canc = 0
  let falt = 0
  let tot = 0
  for (const a of list) {
    if (a.barbeiro_id !== barbeiroId) continue
    tot += 1
    if (a.status === 'cancelado') canc += 1
    if (a.status === 'faltou') falt += 1
    if (a.status === 'concluido') {
      concl += 1
      const tipo = classificarServicoReceita(a.servico?.nome)
      if (tipo === 'cortes') corte += 1
      else if (tipo === 'barbas') barba += 1
      else outros += 1
    }
  }
  const sumTipo = Math.max(1, corte + barba + outros)
  const vendas =
    maxReceitaProdutosTime > 0 ? Math.min(100, Math.round((receitaProdutos / maxReceitaProdutosTime) * 100)) : 0
  const pontualidade =
    tot > 0 ? Math.round((1 - (canc + falt) / tot) * 100) : 50
  const nota = notaEstimadaBarbeiro(concl, tot)
  const satisfacao = nota != null ? Math.round(nota * 20) : Math.round((concl / Math.max(1, tot)) * 100)

  return {
    corte: Math.round((corte / sumTipo) * 100),
    barba: Math.round((barba / sumTipo) * 100),
    vendas,
    pontualidade: Math.max(0, Math.min(100, pontualidade)),
    satisfacao: Math.max(0, Math.min(100, satisfacao)),
  }
}

export type DiaFaturamentoBarbeiro = { dataKey: string; label: string; valor: number }

export function timelineFaturamentoBarbeiro(
  list: Agendamento[],
  barbeiroId: string | null,
  inicio: Date,
  fim: Date,
): DiaFaturamentoBarbeiro[] {
  const days = eachDayOfInterval({ start: startOfDay(inicio), end: startOfDay(fim) })
  const map = new Map<string, number>()
  for (const d of days) {
    map.set(toLocalDateKey(d), 0)
  }
  for (const a of list) {
    if (a.status !== 'concluido') continue
    if (barbeiroId && a.barbeiro_id !== barbeiroId) continue
    const k = a.data
    if (!map.has(k)) continue
    map.set(k, (map.get(k) ?? 0) + (Number(a.valor) || 0))
  }
  return days.map((d) => {
    const dataKey = toLocalDateKey(d)
    return {
      dataKey,
      label: format(d, 'dd/MM', { locale: ptBR }),
      valor: map.get(dataKey) ?? 0,
    }
  })
}
