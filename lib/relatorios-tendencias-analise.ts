import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
  subMonths,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { classificarServicoReceita } from '@/lib/relatorios-agregacao'
import type { AgHistoricoCliente } from '@/lib/relatorios-clientes-analise'

const DIAS_SEMANA_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function monthKeyFromYmd(ymd: string): string {
  return ymd.slice(0, 7)
}

/** Receita de serviços (concluídos) por mês `YYYY-MM`. */
export function receitaServicosPorMes(rows: AgHistoricoCliente[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of rows) {
    if (r.status !== 'concluido') continue
    const mk = monthKeyFromYmd(r.data)
    m.set(mk, (m.get(mk) ?? 0) + (Number(r.valor) || 0))
  }
  return m
}

export function receitaTotalPorMes(
  servicos: Map<string, number>,
  produtos: Record<string, number>,
): Map<string, number> {
  const out = new Map<string, number>()
  for (const [k, v] of servicos) out.set(k, v)
  for (const [k, v] of Object.entries(produtos)) {
    out.set(k, (out.get(k) ?? 0) + v)
  }
  return out
}

/** Receita serviços concluídos por dia. */
export function receitaServicosPorDia(rows: AgHistoricoCliente[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const r of rows) {
    if (r.status !== 'concluido') continue
    m.set(r.data, (m.get(r.data) ?? 0) + (Number(r.valor) || 0))
  }
  return m
}

export function receitaTotalPorDia(servDia: Map<string, number>, prodDia: Record<string, number>): Map<string, number> {
  const m = new Map(servDia)
  for (const [d, v] of Object.entries(prodDia)) {
    m.set(d, (m.get(d) ?? 0) + v)
  }
  return m
}

export type ComparativoMes = {
  mesAtualLabel: string
  mesAtualParcial: number
  mesAnteriorCompleto: number
  variacaoPct: number | null
}

/** Mês civil atual (até hoje) vs mês civil anterior completo — receita total. */
export function comparativoMesAtualVsAnterior(
  totalPorMes: Map<string, number>,
  ref: Date = new Date(),
): ComparativoMes {
  const ini = startOfMonth(ref)
  const mkAtual = format(ini, 'yyyy-MM')
  const iniAnt = subMonths(ini, 1)
  const mkAnt = format(iniAnt, 'yyyy-MM')
  const parcial = totalPorMes.get(mkAtual) ?? 0
  const anterior = totalPorMes.get(mkAnt) ?? 0
  const variacaoPct =
    anterior > 0 ? Math.round(((parcial - anterior) / anterior) * 1000) / 10 : parcial > 0 ? 100 : null
  return {
    mesAtualLabel: format(ini, "MMMM 'de' yyyy", { locale: ptBR }),
    mesAtualParcial: parcial,
    mesAnteriorCompleto: anterior,
    variacaoPct,
  }
}

export type ComparativoAno = {
  anoAtual: number
  ytdAtual: number
  ytdAnterior: number
  variacaoPct: number | null
}

/** YTD (jan até mês civil atual) vs mesmo recorte no ano anterior. */
export function comparativoAnoYtd(totalPorMes: Map<string, number>, ref: Date = new Date()): ComparativoAno {
  const y = ref.getFullYear()
  const yAnt = y - 1
  const mesAte = ref.getMonth() + 1
  let ytdAtual = 0
  let ytdAnt = 0
  for (let mm = 1; mm <= mesAte; mm++) {
    const mkA = `${y}-${String(mm).padStart(2, '0')}`
    const mkP = `${yAnt}-${String(mm).padStart(2, '0')}`
    ytdAtual += totalPorMes.get(mkA) ?? 0
    ytdAnt += totalPorMes.get(mkP) ?? 0
  }
  const variacaoPct =
    ytdAnt > 0 ? Math.round(((ytdAtual - ytdAnt) / ytdAnt) * 1000) / 10 : ytdAtual > 0 ? 100 : null
  return { anoAtual: y, ytdAtual, ytdAnterior: ytdAnt, variacaoPct }
}

/** Projeção receita próximo mês civil (média diária dos últimos `lookback` dias × dias do próximo mês). */
export function projecaoProximoMes(
  totalPorDia: Map<string, number>,
  ref: Date = new Date(),
  lookback = 60,
): { valor: number; proxMesLabel: string; mediaDiaria: number; diasProxMes: number } {
  const fim = startOfDay(ref)
  const ini = subDays(fim, lookback)
  const dias = eachDayOfInterval({ start: ini, end: fim })
  let sum = 0
  let n = 0
  for (const d of dias) {
    const k = format(d, 'yyyy-MM-dd')
    sum += totalPorDia.get(k) ?? 0
    n += 1
  }
  const mediaDiaria = n > 0 ? sum / n : 0
  const prox = addDays(endOfMonth(ref), 1)
  const diasProxMes = differenceInCalendarDays(endOfMonth(prox), startOfMonth(prox)) + 1
  return {
    valor: Math.round(mediaDiaria * diasProxMes * 100) / 100,
    proxMesLabel: format(prox, "MMMM 'de' yyyy", { locale: ptBR }),
    mediaDiaria: Math.round(mediaDiaria * 100) / 100,
    diasProxMes,
  }
}

export type InsightItem = { tipo: 'up' | 'down' | 'idea'; texto: string }

export function detectarTendencias(
  rows: AgHistoricoCliente[],
  produtoPorDia: Record<string, number>,
  ref: Date = new Date(),
): InsightItem[] {
  const out: InsightItem[] = []
  const fim = startOfDay(ref)
  const a30 = subDays(fim, 30)
  const a60 = subDays(fim, 60)
  let prod30 = 0
  let prodPrev30 = 0
  for (const d of eachDayOfInterval({ start: a30, end: fim })) {
    prod30 += produtoPorDia[format(d, 'yyyy-MM-dd')] ?? 0
  }
  for (const d of eachDayOfInterval({ start: a60, end: subDays(a30, 1) })) {
    prodPrev30 += produtoPorDia[format(d, 'yyyy-MM-dd')] ?? 0
  }
  if (prodPrev30 > 0) {
    const pct = ((prod30 - prodPrev30) / prodPrev30) * 100
    if (Math.abs(pct) >= 5) {
      out.push({
        tipo: pct >= 0 ? 'up' : 'down',
        texto: `Vendas de produtos ${pct >= 0 ? 'cresceram' : 'caíram'} ${Math.abs(Math.round(pct * 10) / 10)}% na comparação dos últimos 30 dias com os 30 dias anteriores (comandas fechadas).`,
      })
    }
  }

  const cancelPorDow = new Array(7).fill(0)
  const totPorDow = new Array(7).fill(0)
  for (const r of rows) {
    if (r.data < format(subDays(fim, 90), 'yyyy-MM-dd')) continue
    const dow = getDay(parseISO(`${r.data}T12:00:00`))
    totPorDow[dow] += 1
    if (r.status === 'cancelado') cancelPorDow[dow] += 1
  }
  let worst = -1
  let worstRate = -1
  for (let d = 0; d < 7; d++) {
    if (totPorDow[d] < 8) continue
    const rate = cancelPorDow[d] / totPorDow[d]
    if (rate > worstRate) {
      worstRate = rate
      worst = d
    }
  }
  if (worst >= 0 && worstRate >= 0.12) {
    out.push({
      tipo: 'down',
      texto: `Cancelamentos concentram-se mais às ${DIAS_SEMANA_PT[worst]}s (${(worstRate * 100).toFixed(0)}% dos agendamentos nos últimos 90 dias).`,
    })
  }

  let sumManha = 0
  let nManha = 0
  let sumTarde = 0
  let nTarde = 0
  for (const r of rows) {
    if (r.status !== 'concluido') continue
    if (r.data < format(subDays(fim, 90), 'yyyy-MM-dd')) continue
    const [hh] = r.horario.split(':').map(Number)
    const h = Number.isFinite(hh) ? hh : 12
    const v = Number(r.valor) || 0
    if (h < 12) {
      sumManha += v
      nManha += 1
    } else {
      sumTarde += v
      nTarde += 1
    }
  }
  if (nManha >= 5 && nTarde >= 5) {
    const tm = sumManha / nManha
    const tt = sumTarde / nTarde
    const diff = ((tm - tt) / Math.max(tt, 1)) * 100
    if (Math.abs(diff) >= 8) {
      const maior = diff > 0 ? 'pela manhã (<12h)' : 'à tarde (≥12h)'
      const menor = diff > 0 ? 'à tarde (≥12h)' : 'pela manhã (<12h)'
      out.push({
        tipo: 'idea',
        texto: `Ticket médio de serviços ${maior} ficou ~${Math.abs(Math.round(diff))}% acima do período ${menor} (últimos 90 dias).`,
      })
    }
  }

  return out.slice(0, 6)
}

export type MesReceitaYoY = { mes: number; label: string; anoAtual: number | null; anoAnterior: number }

export function serieReceitaMensalDoisAnos(
  totalPorMes: Map<string, number>,
  ref: Date = new Date(),
): MesReceitaYoY[] {
  const y = ref.getFullYear()
  const yAnt = y - 1
  const mesAte = ref.getMonth() + 1
  const out: MesReceitaYoY[] = []
  for (let mes = 1; mes <= 12; mes++) {
    const mkA = `${y}-${String(mes).padStart(2, '0')}`
    const mkP = `${yAnt}-${String(mes).padStart(2, '0')}`
    const dMes = parseISO(`${mkA}-01`)
    out.push({
      mes,
      label: format(dMes, 'MMM', { locale: ptBR }),
      anoAtual: mes <= mesAte ? (totalPorMes.get(mkA) ?? 0) : null,
      anoAnterior: totalPorMes.get(mkP) ?? 0,
    })
  }
  return out
}

export type MesCategoriaStack = {
  mesKey: string
  label: string
  cortes: number
  barbas: number
  outros: number
  produtos: number
}

export function serieBarrasCategoriasUltimosMeses(
  rows: AgHistoricoCliente[],
  produtoPorMes: Record<string, number>,
  nMeses = 12,
  ref: Date = new Date(),
): MesCategoriaStack[] {
  const out: MesCategoriaStack[] = []
  for (let i = nMeses - 1; i >= 0; i--) {
    const d = subMonths(startOfMonth(ref), i)
    const mk = format(d, 'yyyy-MM')
    const label = format(d, 'MMM yy', { locale: ptBR })
    let cortes = 0
    let barbas = 0
    let outros = 0
    for (const r of rows) {
      if (r.status !== 'concluido' || monthKeyFromYmd(r.data) !== mk) continue
      const t = classificarServicoReceita(r.servico?.nome)
      const v = Number(r.valor) || 0
      if (t === 'cortes') cortes += v
      else if (t === 'barbas') barbas += v
      else outros += v
    }
    const produtos = produtoPorMes[mk] ?? 0
    out.push({ mesKey: mk, label, cortes, barbas, outros, produtos })
  }
  return out
}

export type DiaPrevisao = { dataKey: string; label: string; historico: number | null; previsto: number | null }

/** Últimos `historicoDias` reais + `horizonte` dias projetados (média móvel simples). */
export function seriePrevisaoDiaria(
  totalPorDia: Map<string, number>,
  ref: Date = new Date(),
  historicoDias = 45,
  horizonte = 30,
): DiaPrevisao[] {
  const fim = startOfDay(ref)
  const ini = subDays(fim, historicoDias - 1)
  const vals: number[] = []
  for (const d of eachDayOfInterval({ start: ini, end: fim })) {
    vals.push(totalPorDia.get(format(d, 'yyyy-MM-dd')) ?? 0)
  }
  const media = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  const out: DiaPrevisao[] = []
  for (const d of eachDayOfInterval({ start: ini, end: fim })) {
    const dataKey = format(d, 'yyyy-MM-dd')
    out.push({
      dataKey,
      label: format(d, 'dd/MM', { locale: ptBR }),
      historico: totalPorDia.get(dataKey) ?? 0,
      previsto: null,
    })
  }
  for (let j = 1; j <= horizonte; j++) {
    const d = addDays(fim, j)
    const dataKey = format(d, 'yyyy-MM-dd')
    out.push({
      dataKey,
      label: format(d, 'dd/MM', { locale: ptBR }),
      historico: null,
      previsto: Math.round(media * 100) / 100,
    })
  }
  return out
}
