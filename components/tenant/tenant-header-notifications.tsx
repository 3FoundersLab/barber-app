'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { AdminDashboardNotificationsTrigger } from '@/components/domain/admin-dashboard-notifications-trigger'
import { buildAdminDashboardAlerts } from '@/lib/build-admin-dashboard-alerts'
import { normalizeDashboardNotificationState } from '@/lib/dashboard-notification-state'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserSafe } from '@/lib/supabase/get-auth-user-safe'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { tenantBarbeariaBasePath } from '@/lib/routes'
import type { AlertaDashboard } from '@/types/admin-dashboard'

function ymdFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const t = new Date(y, m - 1, d + deltaDays)
  return ymdFromDate(t)
}

export function TenantHeaderNotifications() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const base = slug ? tenantBarbeariaBasePath(slug) : '/painel'

  const [isLoading, setIsLoading] = useState(true)
  const [alertas, setAlertas] = useState<AlertaDashboard[]>([])
  const [alertasDescartadosIds, setAlertasDescartadosIds] = useState<string[]>([])
  const [alertasLidosIds, setAlertasLidosIds] = useState<string[]>([])
  const [alertasLidosAt, setAlertasLidosAt] = useState<Record<string, string>>({})
  const [tiposOcultos, setTiposOcultos] = useState<AlertaDashboard['tipo'][]>([])
  const [persistContext, setPersistContext] = useState<{ userId: string; barbeariaId: string } | null>(null)
  const [prefsHydrated, setPrefsHydrated] = useState(false)

  useEffect(() => {
    setAlertasDescartadosIds([])
    setAlertasLidosIds([])
    setAlertasLidosAt({})
    setTiposOcultos([])
    setPersistContext(null)
    setPrefsHydrated(false)
  }, [slug])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setIsLoading(true)
        const supabase = createClient()
        const user = await getAuthUserSafe(supabase)
        if (!user || !slug) {
          if (!cancelled) {
            setAlertas([])
            setIsLoading(false)
          }
          return
        }

      const barbeariaId = await resolveAdminBarbeariaId(supabase, user.id, { slug })
      if (!barbeariaId) {
        if (!cancelled) {
          setAlertas([])
          setIsLoading(false)
        }
        return
      }

      const { data: barbearia } = await supabase
        .from('barbearias')
        .select('id, status_cadastro')
        .eq('id', barbeariaId)
        .maybeSingle()

      if (!barbearia) {
        if (!cancelled) {
          setAlertas([])
          setIsLoading(false)
        }
        return
      }

      const { data: notifStateRow } = await supabase
        .from('dashboard_notification_states')
        .select('read_ids, archived_ids, muted_types, read_at')
        .eq('barbearia_id', barbearia.id)
        .eq('user_id', user.id)
        .maybeSingle()

      const notifState = normalizeDashboardNotificationState(notifStateRow)

      /* Aplicar preferências logo após o fetch: o restante do load é lento (Promise.all).
         Se só aplicarmos no final, o usuário pode mutar/arquivar durante o carregamento e
         este bloco sobrescreveria com snapshot antigo (perdendo persistência). */
      if (!cancelled) {
        setAlertasLidosIds(notifState.lidosIds)
        setAlertasDescartadosIds(notifState.arquivadosIds)
        setTiposOcultos(notifState.tiposOcultos)
        setAlertasLidosAt(notifState.lidosAt)
        setPersistContext({ userId: user.id, barbeariaId: barbearia.id })
        setPrefsHydrated(true)
      }

      const today = new Date().toISOString().split('T')[0]
      const start14s = addDaysYmd(today, -13)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekAgoIso = weekAgo.toISOString()
      const operacaoLiberada = barbearia.status_cadastro !== 'pagamento_pendente'

      const [
        { data: pendPagRows },
        { data: estoqueRows },
        { count: novos7 },
        { count: todayCount },
        { count: count14 },
        { data: clientesComNascimentoRows },
      ] = await Promise.all([
        operacaoLiberada
          ? supabase
              .from('agendamentos')
              .select('horario')
              .eq('barbearia_id', barbearia.id)
              .eq('data', today)
              .in('status', ['agendado', 'em_atendimento'])
              .eq('status_pagamento', 'pendente')
              .gt('valor', 0)
          : Promise.resolve({ data: null as { horario: string }[] | null }),
        operacaoLiberada
          ? supabase.from('estoque_produtos').select('nome, quantidade, minimo').eq('barbearia_id', barbearia.id)
          : Promise.resolve({ data: null as { nome: string; quantidade: number; minimo: number }[] | null }),
        supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('barbearia_id', barbearia.id)
          .gte('created_at', weekAgoIso),
        supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('barbearia_id', barbearia.id)
          .eq('data', today),
        supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('barbearia_id', barbearia.id)
          .gte('data', start14s)
          .lte('data', today)
          .in('status', ['agendado', 'em_atendimento', 'concluido']),
        supabase
          .from('clientes')
          .select('nome, telefone, data_nascimento')
          .eq('barbearia_id', barbearia.id)
          .not('data_nascimento', 'is', null),
      ])

      const hoje = new Date()
      const hojeMesDia = `${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`
      const aniversariantesHoje = (clientesComNascimentoRows ?? [])
        .filter((c) => {
          const raw = typeof c.data_nascimento === 'string' ? c.data_nascimento : ''
          const trimmed = raw.trim()
          if (!trimmed) return false
          const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed)
          if (!m) return false
          return `${m[2]}-${m[3]}` === hojeMesDia
        })
        .map((c) => ({
          nome: c.nome as string,
          telefone: (c.telefone as string | null | undefined) ?? null,
        }))

      const alertasCalculados = buildAdminDashboardAlerts({
        base,
        operacaoLiberada,
        recebimentosPendentesHoje: pendPagRows ?? [],
        estoqueCritico: operacaoLiberada
          ? (estoqueRows ?? [])
              .filter((r) => r.quantidade <= r.minimo || r.quantidade <= 0)
              .sort((a, b) => a.quantidade - b.quantidade)
              .slice(0, 5)
          : [],
        clientesNovosUltimos7Dias: novos7 || 0,
        aniversariantesHoje,
        agendamentosHoje: todayCount || 0,
        mediaAgendamentosRecente: (count14 || 0) / 14,
      })

        if (!cancelled) {
          setAlertas(alertasCalculados)
          setIsLoading(false)
        }
      } catch {
        if (!cancelled) {
          setAlertas([])
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [base, slug])

  useEffect(() => {
    if (!persistContext || !prefsHydrated) return
    const supabase = createClient()
    void supabase.from('dashboard_notification_states').upsert(
      {
        barbearia_id: persistContext.barbeariaId,
        user_id: persistContext.userId,
        read_ids: alertasLidosIds,
        archived_ids: alertasDescartadosIds,
        muted_types: tiposOcultos,
        read_at: alertasLidosAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'barbearia_id,user_id' },
    )
  }, [alertasDescartadosIds, alertasLidosAt, alertasLidosIds, persistContext, prefsHydrated, tiposOcultos])

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

  function persistNotificationState(overrides?: {
    lidosIds?: string[]
    arquivadosIds?: string[]
    tipos?: AlertaDashboard['tipo'][]
    lidosAt?: Record<string, string>
  }) {
    if (!persistContext || !prefsHydrated) return
    const supabase = createClient()
    void supabase
      .from('dashboard_notification_states')
      .upsert(
        {
          barbearia_id: persistContext.barbeariaId,
          user_id: persistContext.userId,
          read_ids: overrides?.lidosIds ?? alertasLidosIds,
          archived_ids: overrides?.arquivadosIds ?? alertasDescartadosIds,
          muted_types: overrides?.tipos ?? tiposOcultos,
          read_at: overrides?.lidosAt ?? alertasLidosAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'barbearia_id,user_id' },
      )
      .then(({ error }) => {
        if (error) console.error('[dashboard_notification_states] persist error:', error.message)
      })
  }

  return (
    <AdminDashboardNotificationsTrigger
      alertas={alertasVisiveis}
      alertasArquivados={alertasArquivados}
      tiposOcultos={tiposOcultos}
      lidosIds={alertasLidosIds}
      lidosAt={alertasLidosAt}
      isLoading={isLoading}
      onMarkAsRead={(id) => {
        const nextLidos = alertasLidosIds.includes(id) ? alertasLidosIds : [...alertasLidosIds, id]
        const nextLidosAt = alertasLidosAt[id] ? alertasLidosAt : { ...alertasLidosAt, [id]: new Date().toISOString() }
        setAlertasLidosIds(nextLidos)
        setAlertasLidosAt(nextLidosAt)
        persistNotificationState({ lidosIds: nextLidos, lidosAt: nextLidosAt })
      }}
      onMarkAsUnread={(id) => {
        const nextLidos = alertasLidosIds.filter((x) => x !== id)
        const nextLidosAt = { ...alertasLidosAt }
        delete nextLidosAt[id]
        setAlertasLidosIds(nextLidos)
        setAlertasLidosAt(nextLidosAt)
        persistNotificationState({ lidosIds: nextLidos, lidosAt: nextLidosAt })
      }}
      onArchive={(id) => {
        const nextArquivados = alertasDescartadosIds.includes(id) ? alertasDescartadosIds : [...alertasDescartadosIds, id]
        setAlertasDescartadosIds(nextArquivados)
        persistNotificationState({ arquivadosIds: nextArquivados })
      }}
      onUnarchive={(id) => {
        const nextArquivados = alertasDescartadosIds.filter((x) => x !== id)
        setAlertasDescartadosIds(nextArquivados)
        persistNotificationState({ arquivadosIds: nextArquivados })
      }}
      onMuteType={(tipo) => {
        const nextTipos = tiposOcultos.includes(tipo) ? tiposOcultos : [...tiposOcultos, tipo]
        setTiposOcultos(nextTipos)
        persistNotificationState({ tipos: nextTipos })
      }}
      onUnmuteType={(tipo) => {
        const nextTipos = tiposOcultos.filter((x) => x !== tipo)
        setTiposOcultos(nextTipos)
        persistNotificationState({ tipos: nextTipos })
      }}
      onMarkAllAsRead={() => {
        const now = new Date().toISOString()
        const nextLidos = [...new Set([...alertasLidosIds, ...alertasVisiveis.map((a) => a.id)])]
        const nextLidosAt = { ...alertasLidosAt }
        for (const alerta of alertasVisiveis) nextLidosAt[alerta.id] ||= now
        setAlertasLidosIds(nextLidos)
        setAlertasLidosAt(nextLidosAt)
        persistNotificationState({ lidosIds: nextLidos, lidosAt: nextLidosAt })
      }}
    />
  )
}
