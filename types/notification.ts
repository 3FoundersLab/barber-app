import type { ComponentPropsWithoutRef } from 'react'
import type { AlertaDashboard, AlertaDashboardTipo } from '@/types/admin-dashboard'

/** Props do painel lateral de notificações (composição Bell + Sheet). */
export type NotificationPanelProps = {
  alertas: AlertaDashboard[]
  alertasArquivados?: AlertaDashboard[]
  tiposOcultos?: AlertaDashboard['tipo'][]
  isLoading: boolean
  onMarkAllAsRead?: () => void
  /** Incrementa para abrir o sheet a partir de outros controles (ex.: “Ver mais” na lista). */
  openRequestKey?: number
  lidosIds?: string[]
  lidosAt?: Record<string, string>
  onMarkAsRead?: (id: string) => void
  onMarkAsUnread?: (id: string) => void
  onArchive?: (id: string) => void
  onUnarchive?: (id: string) => void
  onMuteType?: (tipo: AlertaDashboardTipo) => void
  onUnmuteType?: (tipo: AlertaDashboardTipo) => void
}

export type NotificationBellProps = {
  isLoading: boolean
  unreadCount: number
  totalCount: number
} & Omit<ComponentPropsWithoutRef<'button'>, 'children'>

/** Estado persistido de leitura/arquivamento do painel de notificações. */
export type NotificationPreferencesState = {
  lidosIds: string[]
  arquivadosIds: string[]
  tiposOcultos: AlertaDashboardTipo[]
  lidosAt: Record<string, string>
}

export type NotificationPersistOverrides = {
  lidosIds?: string[]
  arquivadosIds?: string[]
  tipos?: AlertaDashboardTipo[]
  lidosAt?: Record<string, string>
}

export type NotificationPersistContext = {
  userId: string
  barbeariaId: string
}

export const NOTIFICATION_TIPO_PRIORITY: Record<AlertaDashboardTipo, number> = {
  urgente: 0,
  atencao: 1,
  especial: 2,
  info: 3,
  sucesso: 4,
}

export const NOTIFICATION_TIPO_LABELS: Record<AlertaDashboardTipo, string> = {
  urgente: 'Urgentes',
  atencao: 'Atenção',
  especial: 'Aniversários',
  info: 'Informativas',
  sucesso: 'Sucesso',
}
