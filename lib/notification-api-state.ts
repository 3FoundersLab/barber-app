import type { DashboardNotificationStateRow } from '@/lib/dashboard-notification-state'
import type { AlertaDashboard } from '@/types/admin-dashboard'

export type NotificationApiState = {
  lidosIds: string[]
  arquivadosIds: string[]
  tiposOcultos: AlertaDashboard['tipo'][]
  lidosAt: Record<string, string>
}

export function mapApiNotificationStateToRow(pref: NotificationApiState | null): DashboardNotificationStateRow | null {
  if (!pref) return null
  return {
    read_ids: pref.lidosIds,
    archived_ids: pref.arquivadosIds,
    muted_types: pref.tiposOcultos,
    read_at: pref.lidosAt,
  }
}
