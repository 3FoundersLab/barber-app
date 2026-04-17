'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AlertaDashboard } from '@/types/admin-dashboard'
import type { NotificationPersistContext, NotificationPersistOverrides } from '@/types/notification'
import {
  normalizeDashboardNotificationState,
  type DashboardNotificationStateRow,
} from '@/lib/dashboard-notification-state'

/**
 * Preferências de leitura/arquivamento das notificações do dashboard + listas filtradas.
 * Persistência via `/api/notifications` (evita duplicar lógica RLS no cliente).
 */
export function useNotifications(slug: string, alertas: AlertaDashboard[]) {
  const [alertasDescartadosIds, setAlertasDescartadosIds] = useState<string[]>([])
  const [alertasLidosIds, setAlertasLidosIds] = useState<string[]>([])
  const [alertasLidosAt, setAlertasLidosAt] = useState<Record<string, string>>({})
  const [tiposOcultos, setTiposOcultos] = useState<AlertaDashboard['tipo'][]>([])
  const [persistContext, setPersistContext] = useState<NotificationPersistContext | null>(null)
  const [prefsHydrated, setPrefsHydrated] = useState(false)

  useEffect(() => {
    setAlertasDescartadosIds([])
    setAlertasLidosIds([])
    setAlertasLidosAt({})
    setTiposOcultos([])
    setPersistContext(null)
    setPrefsHydrated(false)
  }, [slug])

  const persistNotificationState = useCallback(
    async (overrides?: NotificationPersistOverrides) => {
      if (!persistContext || !prefsHydrated || !slug) return
      const read_ids = overrides?.lidosIds ?? alertasLidosIds
      const archived_ids = overrides?.arquivadosIds ?? alertasDescartadosIds
      const muted_types = overrides?.tipos ?? tiposOcultos
      const read_at = overrides?.lidosAt ?? alertasLidosAt
      try {
        const res = await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barbearia_id: persistContext.barbeariaId,
            slug,
            read_ids,
            archived_ids,
            muted_types,
            read_at,
          }),
        })
        if (!res.ok) {
          const j = (await res.json().catch(() => null)) as { error?: string } | null
          console.error('[dashboard_notification_states] API error:', j?.error ?? res.statusText)
        }
      } catch (e) {
        console.error('[dashboard_notification_states] API error:', e)
      }
    },
    [slug, persistContext, prefsHydrated, alertasLidosIds, alertasDescartadosIds, tiposOcultos, alertasLidosAt],
  )

  const hydratePreferences = useCallback(
    (row: DashboardNotificationStateRow | null | undefined, ctx: NotificationPersistContext) => {
      const notifState = normalizeDashboardNotificationState(row)
      setPersistContext(ctx)
      setAlertasLidosIds(notifState.lidosIds)
      setAlertasDescartadosIds(notifState.arquivadosIds)
      setTiposOcultos(notifState.tiposOcultos)
      setAlertasLidosAt(notifState.lidosAt)
      setPrefsHydrated(true)
    },
    [],
  )

  const alertasVisiveis = useMemo(() => {
    const descartados = new Set(alertasDescartadosIds)
    const ocultos = new Set(tiposOcultos)
    return alertas.filter((a) => !descartados.has(a.id) && !ocultos.has(a.tipo))
  }, [alertas, alertasDescartadosIds, tiposOcultos])

  const alertasArquivados = useMemo(() => {
    const descartados = new Set(alertasDescartadosIds)
    const ocultos = new Set(tiposOcultos)
    return alertas.filter((a) => descartados.has(a.id) && !ocultos.has(a.tipo))
  }, [alertas, alertasDescartadosIds, tiposOcultos])

  const marcarAlertaLido = useCallback(
    (id: string) => {
      const nextLidos = alertasLidosIds.includes(id) ? alertasLidosIds : [...alertasLidosIds, id]
      const nextLidosAt = alertasLidosAt[id] ? alertasLidosAt : { ...alertasLidosAt, [id]: new Date().toISOString() }
      setAlertasLidosIds(nextLidos)
      setAlertasLidosAt(nextLidosAt)
      void persistNotificationState({ lidosIds: nextLidos, lidosAt: nextLidosAt })
    },
    [alertasLidosAt, alertasLidosIds, persistNotificationState],
  )

  const limparTodasNotificacoes = useCallback(() => {
    const now = new Date().toISOString()
    const nextLidos = [...new Set([...alertasLidosIds, ...alertasVisiveis.map((a) => a.id)])]
    const nextLidosAt = { ...alertasLidosAt }
    for (const alerta of alertasVisiveis) nextLidosAt[alerta.id] ||= now
    setAlertasLidosIds(nextLidos)
    setAlertasLidosAt(nextLidosAt)
    void persistNotificationState({ lidosIds: nextLidos, lidosAt: nextLidosAt })
  }, [alertasLidosAt, alertasLidosIds, alertasVisiveis, persistNotificationState])

  const desmarcarAlertaLido = useCallback(
    (id: string) => {
      const nextLidos = alertasLidosIds.filter((x) => x !== id)
      const nextLidosAt = { ...alertasLidosAt }
      delete nextLidosAt[id]
      setAlertasLidosIds(nextLidos)
      setAlertasLidosAt(nextLidosAt)
      void persistNotificationState({ lidosIds: nextLidos, lidosAt: nextLidosAt })
    },
    [alertasLidosAt, alertasLidosIds, persistNotificationState],
  )

  const arquivarAlerta = useCallback(
    (id: string) => {
      const nextArquivados = alertasDescartadosIds.includes(id) ? alertasDescartadosIds : [...alertasDescartadosIds, id]
      setAlertasDescartadosIds(nextArquivados)
      void persistNotificationState({ arquivadosIds: nextArquivados })
    },
    [alertasDescartadosIds, persistNotificationState],
  )

  const desarquivarAlerta = useCallback(
    (id: string) => {
      const nextArquivados = alertasDescartadosIds.filter((x) => x !== id)
      setAlertasDescartadosIds(nextArquivados)
      void persistNotificationState({ arquivadosIds: nextArquivados })
    },
    [alertasDescartadosIds, persistNotificationState],
  )

  const ocultarTipoAlerta = useCallback(
    (tipo: AlertaDashboard['tipo']) => {
      const nextTipos = tiposOcultos.includes(tipo) ? tiposOcultos : [...tiposOcultos, tipo]
      setTiposOcultos(nextTipos)
      void persistNotificationState({ tipos: nextTipos })
    },
    [tiposOcultos, persistNotificationState],
  )

  const mostrarTipoAlerta = useCallback(
    (tipo: AlertaDashboard['tipo']) => {
      const nextTipos = tiposOcultos.filter((x) => x !== tipo)
      setTiposOcultos(nextTipos)
      void persistNotificationState({ tipos: nextTipos })
    },
    [tiposOcultos, persistNotificationState],
  )

  return useMemo(
    () => ({
      hydratePreferences,
      alertasVisiveis,
      alertasArquivados,
      alertasLidosIds,
      alertasLidosAt,
      tiposOcultos,
      marcarAlertaLido,
      limparTodasNotificacoes,
      desmarcarAlertaLido,
      arquivarAlerta,
      desarquivarAlerta,
      ocultarTipoAlerta,
      mostrarTipoAlerta,
    }),
    [
      hydratePreferences,
      alertasVisiveis,
      alertasArquivados,
      alertasLidosIds,
      alertasLidosAt,
      tiposOcultos,
      marcarAlertaLido,
      limparTodasNotificacoes,
      desmarcarAlertaLido,
      arquivarAlerta,
      desarquivarAlerta,
      ocultarTipoAlerta,
      mostrarTipoAlerta,
    ],
  )
}
