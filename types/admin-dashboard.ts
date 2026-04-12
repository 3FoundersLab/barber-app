import type { LucideIcon } from 'lucide-react'

export type AlertaDashboardTipo = 'urgente' | 'atencao' | 'oportunidade' | 'info'

export interface AlertaDashboard {
  id: string
  tipo: AlertaDashboardTipo
  titulo: string
  descricao: string
  acao: string
  link: string
  icone: LucideIcon
  autoDismiss?: boolean
}

export interface DashboardFatDiarioPonto {
  data: string
  /** rótulo curto para o eixo (ex.: 12/04) */
  label: string
  faturamento: number
}
