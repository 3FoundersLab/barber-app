import type { Barbearia } from '@/types'
import type { DashboardFatDiarioPonto } from '@/types/admin-dashboard'

/** Leitura rápida do estado para cor do card e do anel de meta. */
export type DashboardStatusSemantico = 'bom' | 'atencao' | 'critico'

export interface AdminDashboardStatusHoje {
  lojaAberta: boolean
  lojaDetalhe: string
  lojaSemantico: DashboardStatusSemantico
  barbeirosEscalados: number
  barbeirosAtivos: number
  barbeirosSemantico: DashboardStatusSemantico
  barbeirosDeFolga: number
  tempoEsperaMedioMin: number | null
  tempoEsperaSemantico: DashboardStatusSemantico
  tempoEsperaLegenda: string
  faturamentoHoje: number
  metaFaturamento: number
  faturamentoSemantico: DashboardStatusSemantico
  atendimentosConcluidos: number
  metaAtendimentos: number
  atendimentosSemantico: DashboardStatusSemantico
  vendasProdutosUnidades: number
  vendasSemanaAnterior: number
  vendasVariacaoPct: number | null
  vendasSemantico: DashboardStatusSemantico
}

export function parseHorarioToMinutes(t: string | null | undefined): number | null {
  if (t == null || t === '') return null
  const s = String(t).slice(0, 5)
  const [h, m] = s.split(':').map((x) => Number(x))
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

/** Expediente agora, usando `dias_funcionamento` (0=dom … 6=sáb) e horários da barbearia. */
export function resolveLojaAbertaAgora(barbearia: Barbearia, now = new Date()): { aberta: boolean; detalhe: string } {
  const dow = now.getDay()
  const dias = barbearia.dias_funcionamento
  if (dias != null && dias.length > 0 && !dias.includes(dow)) {
    return { aberta: false, detalhe: 'Sem expediente hoje' }
  }

  const openM = parseHorarioToMinutes(barbearia.horario_abertura ?? null)
  const closeM = parseHorarioToMinutes(barbearia.horario_fechamento ?? null)
  if (openM == null || closeM == null) {
    return { aberta: true, detalhe: 'Horário não cadastrado — assumimos em operação' }
  }

  const cur = now.getHours() * 60 + now.getMinutes()
  if (cur >= openM && cur <= closeM) {
    const fech = String(barbearia.horario_fechamento).slice(0, 5)
    return { aberta: true, detalhe: `Até ${fech}` }
  }
  if (cur < openM) {
    const abre = String(barbearia.horario_abertura).slice(0, 5)
    return { aberta: false, detalhe: `Abre às ${abre}` }
  }
  return { aberta: false, detalhe: 'Expediente encerrado' }
}

/** Estimativa: atraso médio (min) de agendamentos ainda `agendado` cujo horário já passou. */
export function computeTempoEsperaMedioMinutos(
  agendamentosHoje: { horario: string; status: string }[],
  now = new Date(),
): number | null {
  const nowM = now.getHours() * 60 + now.getMinutes()
  const delays: number[] = []
  for (const a of agendamentosHoje) {
    if (a.status !== 'agendado') continue
    const hm = parseHorarioToMinutes(a.horario)
    if (hm == null) continue
    if (hm <= nowM) delays.push(nowM - hm)
  }
  if (!delays.length) return null
  return Math.round(delays.reduce((s, d) => s + d, 0) / delays.length)
}

export function semanticoTempoEspera(mediaMin: number | null): {
  nivel: DashboardStatusSemantico
  legenda: string
} {
  if (mediaMin == null) return { nivel: 'bom', legenda: 'Sem fila aparente' }
  if (mediaMin < 15) return { nivel: 'bom', legenda: 'Normal' }
  if (mediaMin < 45) return { nivel: 'atencao', legenda: 'Atenção' }
  return { nivel: 'critico', legenda: 'Crítico' }
}

export function semanticoPorMetaPct(pct: number): DashboardStatusSemantico {
  if (pct >= 85) return 'bom'
  if (pct >= 50) return 'atencao'
  return 'critico'
}

export function semanticoVendasVariacao(pct: number | null): DashboardStatusSemantico {
  if (pct == null) return 'atencao'
  if (pct >= 0) return 'bom'
  if (pct >= -15) return 'atencao'
  return 'critico'
}

function mediaConcluidosPorDia(concluidosPorDia: Record<string, number>, excluirData: string): number {
  let sum = 0
  let n = 0
  for (const [data, c] of Object.entries(concluidosPorDia)) {
    if (data === excluirData) continue
    sum += c
    n += 1
  }
  if (n === 0) return 1
  return Math.max(1, sum / n)
}

function mediaFaturamentoDiario(fatDiario: DashboardFatDiarioPonto[], excluirData: string): number {
  const past = fatDiario.filter((d) => d.data !== excluirData)
  if (!past.length) return 1
  const comValor = past.filter((d) => d.faturamento > 0)
  const base = comValor.length ? comValor.reduce((s, d) => s + d.faturamento, 0) / comValor.length : 0
  return Math.max(1, Math.round(base * 100) / 100)
}

export function buildAdminDashboardStatusHoje(input: {
  barbearia: Barbearia
  todayYmd: string
  fatDiario: DashboardFatDiarioPonto[]
  faturamentoHojeConcluido: number
  barbeirosEscalados: number
  barbeirosAtivos: number
  agendamentosHojeLinhas: { horario: string; status: string }[]
  concluidosHojeCount: number
  concluidosDatas14d: string[]
  vendasProdutosHoje: number
  vendasProdutosSemanaAnterior: number
}): AdminDashboardStatusHoje {
  const loja = resolveLojaAbertaAgora(input.barbearia)
  const lojaSemantico: DashboardStatusSemantico = loja.aberta ? 'bom' : 'critico'

  const tempoEsperaMedioMin = computeTempoEsperaMedioMinutos(input.agendamentosHojeLinhas)
  const tempo = semanticoTempoEspera(tempoEsperaMedioMin)

  const concluidosPorDia: Record<string, number> = {}
  for (const d of input.concluidosDatas14d) {
    concluidosPorDia[d] = (concluidosPorDia[d] ?? 0) + 1
  }
  const metaAt = Math.max(1, Math.ceil(mediaConcluidosPorDia(concluidosPorDia, input.todayYmd) * 1.05))
  const pctAt = Math.min(150, Math.round((input.concluidosHojeCount / metaAt) * 100))

  const metaFat = Math.max(1, Math.round(mediaFaturamentoDiario(input.fatDiario, input.todayYmd) * 100) / 100)
  const pctFat = Math.min(150, Math.round((input.faturamentoHojeConcluido / metaFat) * 100))

  let vendasVariacaoPct: number | null = null
  if (input.vendasProdutosSemanaAnterior > 0) {
    vendasVariacaoPct = Math.round(
      ((input.vendasProdutosHoje - input.vendasProdutosSemanaAnterior) / input.vendasProdutosSemanaAnterior) * 100,
    )
  } else if (input.vendasProdutosHoje > 0) {
    vendasVariacaoPct = 100
  }

  const folga = Math.max(0, input.barbeirosAtivos - input.barbeirosEscalados)
  const barbeirosSemantico: DashboardStatusSemantico =
    input.barbeirosAtivos === 0 ? 'atencao' : folga / input.barbeirosAtivos > 0.55 ? 'atencao' : 'bom'

  return {
    lojaAberta: loja.aberta,
    lojaDetalhe: loja.detalhe,
    lojaSemantico,
    barbeirosEscalados: input.barbeirosEscalados,
    barbeirosAtivos: input.barbeirosAtivos,
    barbeirosSemantico,
    barbeirosDeFolga: folga,
    tempoEsperaMedioMin,
    tempoEsperaSemantico: tempo.nivel,
    tempoEsperaLegenda: tempo.legenda,
    faturamentoHoje: input.faturamentoHojeConcluido,
    metaFaturamento: metaFat,
    faturamentoSemantico: semanticoPorMetaPct(pctFat),
    atendimentosConcluidos: input.concluidosHojeCount,
    metaAtendimentos: metaAt,
    atendimentosSemantico: semanticoPorMetaPct(pctAt),
    vendasProdutosUnidades: input.vendasProdutosHoje,
    vendasSemanaAnterior: input.vendasProdutosSemanaAnterior,
    vendasVariacaoPct,
    vendasSemantico: semanticoVendasVariacao(vendasVariacaoPct),
  }
}
