import type { LucideIcon } from 'lucide-react'

export type AlertaDashboardTipo = 'urgente' | 'atencao' | 'oportunidade' | 'info'

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
