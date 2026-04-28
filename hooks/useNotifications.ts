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
  const [chavesOcultas, setChavesOcultas] = useState<string[]>([])
  const [tiposOcultos, setTiposOcultos] = useState<AlertaDashboard['tipo'][]>([])
  const [persistContext, setPersistContext] = useState<NotificationPersistContext | null>(null)
  const [prefsHydrated, setPrefsHydrated] = useState(false)

  useEffect(() => {
    setAlertasDescartadosIds([])
    setAlertasLidosIds([])
    setAlertasLidosAt({})
    setChavesOcultas([])
    setTiposOcultos([])
    setPersistContext(null)
    setPrefsHydrated(false)
  }, [slug])

  const persistNotificationState = useCallback(
    async (overrides?: NotificationPersistOverrides) => {
      if (!persistContext || !prefsHydrated || !slug) return
      const read_ids = overrides?.lidosIds ?? alertasLidosIds
      const archived_ids = overrides?.arquivadosIds ?? alertasDescartadosIds
      const muted_types = overrides?.tipos ?? chavesOcultas
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
    [slug, persistContext, prefsHydrated, alertasLidosIds, alertasDescartadosIds, chavesOcultas, alertasLidosAt],
  )

  const hydratePreferences = useCallback(
    (row: DashboardNotificationStateRow | null | undefined, ctx: NotificationPersistContext) => {
      const notifState = normalizeDashboardNotificationState(row)
      setPersistContext(ctx)
      setAlertasLidosIds(notifState.lidosIds)
      setAlertasDescartadosIds(notifState.arquivadosIds)
      setChavesOcultas(notifState.chavesOcultas)
      setTiposOcultos(notifState.tiposOcultos)
      setAlertasLidosAt(notifState.lidosAt)
      setPrefsHydrated(true)
    },
    [],
  )

  const getChaveOcultaPorAlerta = useCallback((alerta: AlertaDashboard): string | null => {
    if (alerta.id === 'estoque-critico') return 'atencao:estoque'
    if (alerta.id === 'movimento-abaixo-media') return 'atencao:movimento'
    if (alerta.id.startsWith('agenda-confirmacao-24h-')) return 'atencao:confirmacao_agendamento'
    return null
  }, [])

  const alertasVisiveis = useMemo(() => {
    const descartados = new Set(alertasDescartadosIds)
    const ocultos = new Set(tiposOcultos)
    const chavesOcultasSet = new Set(chavesOcultas)
    return alertas.filter((a) => {
      if (descartados.has(a.id)) return false
      if (ocultos.has(a.tipo)) return false
      const chave = getChaveOcultaPorAlerta(a)
      if (chave && chavesOcultasSet.has(chave)) return false
      return true
    })
  }, [alertas, alertasDescartadosIds, tiposOcultos, chavesOcultas, getChaveOcultaPorAlerta])

  const alertasArquivados = useMemo(() => {
    const descartados = new Set(alertasDescartadosIds)
    const ocultos = new Set(tiposOcultos)
    const chavesOcultasSet = new Set(chavesOcultas)
    return alertas.filter((a) => {
      if (!descartados.has(a.id)) return false
      if (ocultos.has(a.tipo)) return false
      const chave = getChaveOcultaPorAlerta(a)
      if (chave && chavesOcultasSet.has(chave)) return false
      return true
    })
  }, [alertas, alertasDescartadosIds, tiposOcultos, chavesOcultas, getChaveOcultaPorAlerta])

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
    const idsVisiveis = alertasVisiveis.map((a) => a.id)
    const nextLidos = [...new Set([...alertasLidosIds, ...idsVisiveis])]
    const nextArquivados = [...new Set([...alertasDescartadosIds, ...idsVisiveis])]
    const nextLidosAt = { ...alertasLidosAt }
    for (const alerta of alertasVisiveis) nextLidosAt[alerta.id] ||= now
    setAlertasLidosIds(nextLidos)
    setAlertasDescartadosIds(nextArquivados)
    setAlertasLidosAt(nextLidosAt)
    void persistNotificationState({ lidosIds: nextLidos, arquivadosIds: nextArquivados, lidosAt: nextLidosAt })
  }, [alertasDescartadosIds, alertasLidosAt, alertasLidosIds, alertasVisiveis, persistNotificationState])

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
      const nextTipos = chavesOcultas.includes(tipo) ? chavesOcultas : [...chavesOcultas, tipo]
      const nextTiposValidos = nextTipos.filter((t): t is AlertaDashboard['tipo'] =>
        ['urgente', 'atencao', 'especial', 'info', 'sucesso'].includes(t),
      )
      setChavesOcultas(nextTipos)
      setTiposOcultos(nextTiposValidos)
      void persistNotificationState({ tipos: nextTipos })
    },
    [chavesOcultas, persistNotificationState],
  )

  const mostrarTipoAlerta = useCallback(
    (tipo: AlertaDashboard['tipo']) => {
      const nextTipos = chavesOcultas.filter((x) => x !== tipo)
      const nextTiposValidos = nextTipos.filter((t): t is AlertaDashboard['tipo'] =>
        ['urgente', 'atencao', 'especial', 'info', 'sucesso'].includes(t),
      )
      setChavesOcultas(nextTipos)
      setTiposOcultos(nextTiposValidos)
      void persistNotificationState({ tipos: nextTipos })
    },
    [chavesOcultas, persistNotificationState],
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
