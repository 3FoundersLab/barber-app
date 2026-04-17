'use client'

import { memo, useCallback } from 'react'
import { DashboardAlertaRow } from '@/components/domain/admin-dashboard-alerta-row'
import type { AlertaDashboard } from '@/types/admin-dashboard'

export type NotificationCardProps = {
  alerta: AlertaDashboard
  lido: boolean
  lidoInfo: string
  isMarkingAsRead?: boolean
  arquivada?: boolean
  onMarkAsRead?: (id: string) => void
  onMarkAsUnread?: (id: string) => void
  onAction?: (id: string) => void
  onArchive?: (id: string) => void
  onUnarchive?: (id: string) => void
  onMuteType?: (tipo: AlertaDashboard['tipo']) => void
}

/**
 * Cartão de notificação memoizado: handlers estáveis por `id` reduzem re-renders da lista.
 */
export const NotificationCard = memo(function NotificationCard({
  alerta,
  lido,
  lidoInfo,
  isMarkingAsRead,
  arquivada,
  onMarkAsRead,
  onMarkAsUnread,
  onAction,
  onArchive,
  onUnarchive,
  onMuteType,
}: NotificationCardProps) {
  const id = alerta.id
  const tipo = alerta.tipo

  const handleMarkAsRead = useCallback(() => onMarkAsRead?.(id), [id, onMarkAsRead])
  const handleMarkAsUnread = useCallback(() => onMarkAsUnread?.(id), [id, onMarkAsUnread])
  const handleAction = useCallback(() => onAction?.(id), [id, onAction])
  const handleArchive = useCallback(() => onArchive?.(id), [id, onArchive])
  const handleUnarchive = useCallback(() => onUnarchive?.(id), [id, onUnarchive])
  const handleMuteType = useCallback(() => onMuteType?.(tipo), [tipo, onMuteType])

  return (
    <DashboardAlertaRow
      alerta={alerta}
      lido={lido}
      lidoInfo={lidoInfo}
      isMarkingAsRead={isMarkingAsRead}
      arquivada={arquivada}
      onMarkAsRead={handleMarkAsRead}
      onMarkAsUnread={onMarkAsUnread ? handleMarkAsUnread : undefined}
      onAction={handleAction}
      onArchive={onArchive ? handleArchive : undefined}
      onUnarchive={onUnarchive ? handleUnarchive : undefined}
      onMuteType={onMuteType ? handleMuteType : undefined}
    />
  )
})

NotificationCard.displayName = 'NotificationCard'
