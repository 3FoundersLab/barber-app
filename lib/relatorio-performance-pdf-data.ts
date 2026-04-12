import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  segmentarRfvComNomes,
  type AgHistoricoCliente,
  type ClienteCadastroAnalise,
  type SegmentoRfv,
} from '@/lib/relatorios-clientes-analise'
import { rankingBarbeirosCompleto } from '@/lib/relatorios-barbeiros-analise'
import { toLocalDateKey } from '@/lib/relatorios-range'
import type { Agendamento, AppointmentStatus } from '@/types'

const RFV_LABELS: Record<SegmentoRfv, string> = {
  campeoes: 'Campeões',
  fieis: 'Fiéis',
  em_risco: 'Em risco',
  novos: 'Novos',
  ocasionais: 'Ocasionais',
  sem_atividade: 'Sem atividade',
}

export type ResumoOperacionalPdf = {
  total: number
  concluidos: number
  cancelados: number
  faltas: number
  agendadosOuEm: number
  fatConcluido: number
  ticketMedio: number
  realizacao: number
}

export type RelatorioPerformancePdfData = {
  barbeariaNome: string
  barbeariaLogoUrl: string | null
  periodoLabel: string
  periodoInicioFmt: string
  periodoFimFmt: string
  geradoEmFmt: string
  geradoPorLinha: string
  compararComAnterior: boolean
  textoRodapeKpi: string
  resAtual: ResumoOperacionalPdf
  resAnt: ResumoOperacionalPdf
  variacaoPct: (atual: number, ant: number) => number | null
  clientesNovos: number
  clientesNovosAnt: number
  totalClientes: number
  estoqueAlerta: { baixo: number; esgotado: number; total: number }
  statusDistribuicao: { k: AppointmentStatus; label: string; n: number; pct: number }[]
  picos: { hora: number; v: number; pct: number }[]
  rankingBarbeiros: { nome: string; faturamentoTotal: number; concluidos: number; ticketMedio: number }[]
  faturamentoDiario: { label: string; total: number; fatServicos: number; fatProdutos: number }[]
  mixServicos: { nome: string; fat: number; pctDoTotalServicos: number }[]
  rfvResumo: { segmento: string; quantidade: number }[]
  aquisicaoLinha: string
  retencaoLinha: string
  topProdutos: { nome: string; qtd: number }[]
  melhorDia: { label: string; total: number } | null
  melhorBarbeiro: string | null
  alertas: string[]
  picoHorarioLabel: string
}

function pctVar(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual > 0 ? 100 : atual < 0 ? -100 : null
  return ((atual - anterior) / anterior) * 100
}

function faturamentoPorDia(
  ag: Agendamento[],
  receitaProdutosPorDia: Record<string, number>,
  startKey: string,
  endKey: string,
): { label: string; total: number; fatServicos: number; fatProdutos: number }[] {
  const map = new Map<string, { serv: number; prod: number }>()
  for (const a of ag) {
    if (a.data < startKey || a.data > endKey) continue
    if (a.status !== 'concluido') continue
    const cur = map.get(a.data) ?? { serv: 0, prod: 0 }
    cur.serv += Number(a.valor) || 0
    map.set(a.data, cur)
  }
  for (const [dk, prod] of Object.entries(receitaProdutosPorDia)) {
    if (dk < startKey || dk > endKey) continue
    const cur = map.get(dk) ?? { serv: 0, prod: 0 }
    cur.prod += prod
    map.set(dk, cur)
  }
  const rows = [...map.entries()]
    .map(([dataKey, v]) => ({
      dataKey,
      label: format(parseISO(`${dataKey}T12:00:00`), 'dd/MM/yyyy', { locale: ptBR }),
      fatServicos: v.serv,
      fatProdutos: v.prod,
      total: v.serv + v.prod,
    }))
    .sort((a, b) => a.dataKey.localeCompare(b.dataKey))
  return rows
}

function mixServicosTop(
  servicosRank: { nome: string; q: number; fat: number }[],
  maxRows = 8,
): { nome: string; fat: number; pctDoTotalServicos: number }[] {
  const totalFat = servicosRank.reduce((s, x) => s + x.fat, 0) || 1
  return servicosRank.slice(0, maxRows).map((s) => ({
    nome: s.nome,
    fat: s.fat,
    pctDoTotalServicos: (s.fat / totalFat) * 100,
  }))
}

function picosLabel(picos: { hora: number; v: number }[]): string {
  let bestH = 0
  let bestV = -1
  for (const p of picos) {
    if (p.v > bestV) {
      bestV = p.v
      bestH = p.hora
    }
  }
  if (bestV <= 0) return '—'
  return `${bestH}h (${bestV} agend.)`
}

function montarAlertas(
  res: ResumoOperacionalPdf,
  estoque: { baixo: number; esgotado: number },
): string[] {
  const out: string[] = []
  if (estoque.esgotado > 0) {
    out.push(`${estoque.esgotado} produto(s) com estoque zerado — reabastecer com urgência.`)
  }
  if (estoque.baixo > 0) {
    out.push(`${estoque.baixo} produto(s) abaixo do mínimo configurado.`)
  }
  if (res.total >= 10 && res.realizacao < 55) {
    out.push(`Taxa de realização (${res.realizacao.toFixed(0)}%) abaixo do esperado para o volume de agenda.`)
  }
  if (res.total >= 15 && res.cancelados + res.faltas > res.concluidos * 0.2) {
    out.push(`Cancelamentos + faltas representam fatia elevada dos agendamentos — rever confirmação e política de falta.`)
  }
  if (out.length === 0) out.push('Nenhum alerta crítico automático neste recorte.')
  return out
}

export function buildRelatorioPerformancePdfData(params: {
  barbeariaNome: string
  barbeariaLogoUrl: string | null
  inicio: Date
  fim: Date
  geradoEm: Date
  geradoPorNome: string
  geradoPorPapel: string
  compararComAnterior: boolean
  textoRodapeKpi: string
  periodoLabel: string
  atualFiltrado: Agendamento[]
  resAtual: ResumoOperacionalPdf
  resAnt: ResumoOperacionalPdf
  clientesNovos: number
  clientesNovosAnt: number
  totalClientes: number
  estoqueAlerta: { baixo: number; esgotado: number; total: number }
  statusDistribuicao: { k: AppointmentStatus; n: number; pct: number }[]
  statusLabel: Record<AppointmentStatus, string>
  picos: { hora: number; v: number; pct: number }[]
  servicosRank: { nome: string; q: number; fat: number }[]
  receitaProdutosPorBarbeiro: Record<string, number>
  receitaProdutosPorDia: Record<string, number>
  produtosConsumidosRank: { nome: string; qtd: number }[]
  agHistClienteAnalise: AgHistoricoCliente[]
  clientesAnalise: ClienteCadastroAnalise[]
}): RelatorioPerformancePdfData {
  const startKey = toLocalDateKey(params.inicio)
  const endKey = toLocalDateKey(params.fim)
  const fatDia = faturamentoPorDia(params.atualFiltrado, params.receitaProdutosPorDia, startKey, endKey)
  const melhorDia =
    fatDia.length === 0
      ? null
      : fatDia.reduce((best, cur) => (cur.total > best.total ? cur : best), fatDia[0]!)

  const ranking = rankingBarbeirosCompleto(params.atualFiltrado, params.receitaProdutosPorBarbeiro)
  const melhorBarbeiro = ranking[0]?.nome ?? null

  const seg = segmentarRfvComNomes(params.agHistClienteAnalise, params.clientesAnalise, params.geradoEm)
  const rfvResumo = (Object.keys(RFV_LABELS) as SegmentoRfv[]).map((k) => ({
    segmento: RFV_LABELS[k],
    quantidade: seg[k].length,
  }))

  const taxaComparecimento = (params.resAtual.concluidos / Math.max(1, params.resAtual.total)) * 100

  return {
    barbeariaNome: params.barbeariaNome,
    barbeariaLogoUrl: params.barbeariaLogoUrl,
    periodoLabel: params.periodoLabel,
    periodoInicioFmt: format(params.inicio, "dd/MM/yyyy", { locale: ptBR }),
    periodoFimFmt: format(params.fim, "dd/MM/yyyy", { locale: ptBR }),
    geradoEmFmt: format(params.geradoEm, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
    geradoPorLinha: `${params.geradoPorNome} (${params.geradoPorPapel})`,
    compararComAnterior: params.compararComAnterior,
    textoRodapeKpi: params.textoRodapeKpi,
    resAtual: params.resAtual,
    resAnt: params.resAnt,
    variacaoPct: pctVar,
    clientesNovos: params.clientesNovos,
    clientesNovosAnt: params.clientesNovosAnt,
    totalClientes: params.totalClientes,
    estoqueAlerta: params.estoqueAlerta,
    statusDistribuicao: params.statusDistribuicao.map((s) => ({
      ...s,
      label: params.statusLabel[s.k],
    })),
    picos: params.picos,
    rankingBarbeiros: ranking.slice(0, 12).map((r) => ({
      nome: r.nome,
      faturamentoTotal: r.faturamentoTotal,
      concluidos: r.concluidos,
      ticketMedio: r.ticketMedio,
    })),
    faturamentoDiario: fatDia,
    mixServicos: mixServicosTop(params.servicosRank),
    rfvResumo,
    aquisicaoLinha: `Novos clientes no período: ${params.clientesNovos}${
      params.compararComAnterior ? ` (período anterior: ${params.clientesNovosAnt})` : ''
    }.`,
    retencaoLinha: `Comparecimento (concluídos / total agenda): ${taxaComparecimento.toFixed(1)}%. Ticket médio (concluídos): média de receita por atendimento concluído.`,
    topProdutos: params.produtosConsumidosRank.slice(0, 12),
    melhorDia: melhorDia ? { label: melhorDia.label, total: melhorDia.total } : null,
    melhorBarbeiro,
    alertas: montarAlertas(params.resAtual, {
      baixo: params.estoqueAlerta.baixo,
      esgotado: params.estoqueAlerta.esgotado,
    }),
    picoHorarioLabel: picosLabel(params.picos),
  }
}
