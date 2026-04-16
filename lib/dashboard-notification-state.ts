import type { AlertaDashboard } from '@/types/admin-dashboard'

type DashboardNotificationStateRow = {
  read_ids: string[] | null
  archived_ids: string[] | null
  muted_types: string[] | null
  read_at: Record<string, string> | null
}

export type DashboardNotificationState = {
  lidosIds: string[]
  arquivadosIds: string[]
  tiposOcultos: AlertaDashboard['tipo'][]
  lidosAt: Record<string, string>
}

export const EMPTY_DASHBOARD_NOTIFICATION_STATE: DashboardNotificationState = {
  lidosIds: [],
  arquivadosIds: [],
  tiposOcultos: [],
  lidosAt: {},
}

const TIPOS_VALIDOS: AlertaDashboard['tipo'][] = ['urgente', 'atencao', 'especial', 'info', 'sucesso']

function toUniqueStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0))]
}

function normalizeReadAt(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v !== 'string' || !v.trim()) continue
    out[k] = v
  }
  return out
}

export function normalizeDashboardNotificationState(raw: DashboardNotificationStateRow | null | undefined): DashboardNotificationState {
  if (!raw) return EMPTY_DASHBOARD_NOTIFICATION_STATE
  const tiposOcultos = toUniqueStringArray(raw.muted_types).filter((t): t is AlertaDashboard['tipo'] =>
    TIPOS_VALIDOS.includes(t as AlertaDashboard['tipo']),
  )
  return {
    lidosIds: toUniqueStringArray(raw.read_ids),
    arquivadosIds: toUniqueStringArray(raw.archived_ids),
    tiposOcultos,
    lidosAt: normalizeReadAt(raw.read_at),
  }
}
