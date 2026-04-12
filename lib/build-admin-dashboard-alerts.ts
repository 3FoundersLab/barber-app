import { Banknote, CalendarOff, Package, Sparkles, TrendingUp, UserPlus } from 'lucide-react'
import { formatCurrency, formatTime } from '@/lib/constants'
import type { AlertaDashboard } from '@/types/admin-dashboard'

export type BuildAdminDashboardAlertsInput = {
  base: string
  operacaoLiberada: boolean
  /** Agendamentos de hoje (agendado/em_atendimento) com pagamento ainda pendente e valor > 0 */
  recebimentosPendentesHoje: { horario: string }[]
  /** Produtos com quantidade ≤ mínimo (ou esgotado) */
  estoqueCritico: { nome: string; quantidade: number; minimo: number }[]
  clientesNovosUltimos7Dias: number
  agendamentosHoje: number
  /** média simples de agendamentos/dia nos últimos N dias (dias com operação) */
  mediaAgendamentosRecente: number
}

function joinHorarios(amostra: { horario: string }[], max = 3): string {
  const slice = amostra.slice(0, max).map((a) => formatTime(a.horario))
  if (amostra.length > max) return `${slice.join(', ')} e outros`
  return slice.join(', ')
}

export function buildAdminDashboardAlerts(input: BuildAdminDashboardAlertsInput): AlertaDashboard[] {
  const out: AlertaDashboard[] = []
  const { base, operacaoLiberada } = input

  if (!operacaoLiberada) {
    return [
      {
        id: 'info-plano',
        tipo: 'info',
        titulo: 'Modo de ativação',
        descricao:
          'Após a confirmação do pagamento, alertas operacionais (estoque, recebimentos, oportunidades) aparecem aqui automaticamente.',
        acao: 'Ver assinatura',
        link: `${base}/assinatura`,
        icone: Sparkles,
      },
    ]
  }

  const nPend = input.recebimentosPendentesHoje.length
  if (nPend > 0) {
    out.push({
      id: 'recebimento-hoje',
      tipo: 'urgente',
      titulo:
        nPend === 1
          ? '1 atendimento de hoje sem confirmação de pagamento'
          : `${nPend} atendimentos de hoje sem confirmação de pagamento`,
      descricao:
        nPend <= 3
          ? `Horários: ${joinHorarios(input.recebimentosPendentesHoje)}. Confirme na comanda ou no caixa.`
          : `Inclui horários como ${joinHorarios(input.recebimentosPendentesHoje)}. Revise na lista de agendamentos.`,
      acao: 'Ver agendamentos',
      link: `${base}/agendamentos`,
      icone: Banknote,
    })
  }

  const crit = input.estoqueCritico
  if (crit.length > 0) {
    const [p] = crit
    const rest = crit.length - 1
    out.push({
      id: 'estoque-critico',
      tipo: 'atencao',
      titulo:
        crit.length === 1
          ? `Estoque crítico: ${p.nome}`
          : `${crit.length} itens no estoque precisam de atenção`,
      descricao:
        crit.length === 1
          ? p.quantidade <= 0
            ? 'Produto esgotado — repor antes de vender.'
            : `Apenas ${p.quantidade} unidade(s); mínimo sugerido ${p.minimo}.`
          : `${p.nome} (${p.quantidade} un.) e mais ${rest} — evite ruptura na venda.`,
      acao: 'Ver estoque',
      link: `${base}/estoque`,
      icone: Package,
    })
  }

  const { agendamentosHoje, mediaAgendamentosRecente } = input
  if (
    mediaAgendamentosRecente >= 2 &&
    agendamentosHoje < Math.max(1, Math.floor(mediaAgendamentosRecente * 0.65))
  ) {
    out.push({
      id: 'movimento-abaixo-media',
      tipo: 'oportunidade',
      titulo: 'Movimento abaixo do seu ritmo recente',
      descricao: `Hoje há ${agendamentosHoje} agendamento(s); sua média recente gira em torno de ${mediaAgendamentosRecente.toFixed(1)} por dia. Divulgue horários ou ofertas.`,
      acao: 'Abrir agenda',
      link: `${base}/agendamentos`,
      icone: CalendarOff,
    })
  }

  if (input.clientesNovosUltimos7Dias > 0) {
    out.push({
      id: 'clientes-novos',
      tipo: 'oportunidade',
      titulo:
        input.clientesNovosUltimos7Dias === 1
          ? '1 novo cliente nos últimos 7 dias'
          : `${input.clientesNovosUltimos7Dias} novos clientes nos últimos 7 dias`,
      descricao: 'Ótimo momento para mensagem de boas-vindas ou indicação de plano.',
      acao: 'Ver clientes',
      link: `${base}/clientes`,
      icone: UserPlus,
    })
  }

  if (out.length === 0) {
    out.push({
      id: 'tudo-certo',
      tipo: 'info',
      titulo: 'Nenhum alerta crítico agora',
      descricao: 'Recebimentos e estoque estão sob controle no que monitoramos neste painel.',
      acao: 'Ver relatórios',
      link: `${base}/relatorios`,
      icone: TrendingUp,
    })
  }

  return out
}

export type DashboardResumoTendencia = {
  mediaFat7d: number
  /** texto curto para leitura rápida */
  insightLinha: string
}

export function buildDashboardResumoTendencia(
  pontos: { faturamento: number }[],
  faturamentoMesParcial: number,
  diaDoMes: number,
): DashboardResumoTendencia {
  const ultimos7 = pontos.slice(-7)
  const soma7 = ultimos7.reduce((s, p) => s + p.faturamento, 0)
  const mediaFat7d = ultimos7.length ? soma7 / ultimos7.length : 0

  let insightLinha = `Média de faturamento (últimos 7 dias): ${formatCurrency(Math.round(mediaFat7d * 100) / 100)} por dia.`
  if (diaDoMes >= 3 && faturamentoMesParcial > 0) {
    const ritmo = (faturamentoMesParcial / diaDoMes) * 30
    insightLinha += ` Ritmo linear do mês (estimativa): ~${formatCurrency(Math.round(ritmo * 100) / 100)}.`
  }

  return { mediaFat7d, insightLinha }
}
