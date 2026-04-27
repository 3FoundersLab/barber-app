import type { LucideIcon } from 'lucide-react'

export type AlertaDashboardTipo = 'urgente' | 'atencao' | 'especial' | 'info' | 'sucesso'

export interface AlertaDashboard {
  id: string
  tipo: AlertaDashboardTipo
  titulo: string
  descricao: string
  acao: string
  link: string
  linkTarget?: '_self' | '_blank'
  className?: string
  /** Sobrescreve a cor do botão de ação (ex.: alerta com card customizado). */
  acaoButtonClassName?: string
  icone: LucideIcon
  autoDismiss?: boolean
}

export interface DashboardFatDiarioPonto {
  data: string
  /** rótulo curto para o eixo (ex.: 12/04) */
  label: string
  faturamento: number
}

/** KPIs operacionais do dia (painel admin). */
export interface DashboardOperacaoDiaKpis {
  atendimentosDia: number
  servicosDia: number
  agendamentosDia: number
  executadosDia: number
  pendentesDia: number
}

/** Série diária: faturamento concluído + atendimentos concluídos (ex.: últimos 7 dias). */
export interface DashboardFatAtendDiarioPonto {
  data: string
  label: string
  faturamento: number
  atendimentos: number
}

/** Resumo estruturado da coluna “Resumo do dia”. */
export interface DashboardResumoDia {
  faturamentoDia: number
  ticketMedio: number
  novosClientesDia: number
  avaliacaoMedia: number | null
  /** Base numérica para o subtítulo (atendimentos concluídos em 30d ou avaliações reais no futuro). */
  nAvaliacoesBase: number
  /** Quando true, a nota é estimada (sem módulo de reviews). */
  avaliacaoEhEstimativa: boolean
}

export interface DashboardAgendaDiaStats {
  agendados: number
  executados: number
  pendentes: number
  cancelados: number
}

export interface DashboardInsightsDia {
  fatPctVsOntem: number | null
  vagosEstimados: number | null
  diaMaisMovimentado: string | null
}
