'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { NotificationPanel } from '@/components/notifications/NotificationPanel'
import { buildAdminDashboardAlerts } from '@/lib/build-admin-dashboard-alerts'
import { listAniversariosEquipeNaJanela } from '@/lib/birthday-countdown'
import { mapApiNotificationStateToRow, type NotificationApiState } from '@/lib/notification-api-state'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserSafe } from '@/lib/supabase/get-auth-user-safe'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { tenantBarbeariaBasePath } from '@/lib/routes'
import type { AlertaDashboard } from '@/types/admin-dashboard'
import { useNotifications } from '@/hooks/useNotifications'

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

  const notif = useNotifications(slug, alertas)

  useEffect(() => {
    setAlertas([])
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

        try {
          const prefRes = await fetch(
            `/api/notifications?barbeariaId=${encodeURIComponent(barbearia.id)}&slug=${encodeURIComponent(slug)}`,
          )
          const pref = prefRes.ok
            ? ((await prefRes.json()) as NotificationApiState)
            : null
          if (!cancelled) {
            notif.hydratePreferences(
              mapApiNotificationStateToRow(pref),
              { userId: user.id, barbeariaId: barbearia.id },
            )
          }
        } catch {
          if (!cancelled) {
            notif.hydratePreferences(null, { userId: user.id, barbeariaId: barbearia.id })
          }
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
          { data: barbeirosComNascimentoRows },
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
          supabase
            .from('barbeiros')
            .select('nome, telefone, data_nascimento')
            .eq('barbearia_id', barbearia.id)
            .eq('ativo', true)
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

        const aniversariosEquipeProximos = listAniversariosEquipeNaJanela(barbeirosComNascimentoRows ?? [], 3, hoje)

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
          aniversariosEquipeProximos,
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
  }, [base, slug, notif.hydratePreferences])

  return (
    <NotificationPanel
      alertas={notif.alertasVisiveis}
      alertasArquivados={notif.alertasArquivados}
      tiposOcultos={notif.tiposOcultos}
      lidosIds={notif.alertasLidosIds}
      lidosAt={notif.alertasLidosAt}
      isLoading={isLoading}
      onMarkAsRead={notif.marcarAlertaLido}
      onMarkAsUnread={notif.desmarcarAlertaLido}
      onArchive={notif.arquivarAlerta}
      onUnarchive={notif.desarquivarAlerta}
      onMuteType={notif.ocultarTipoAlerta}
      onUnmuteType={notif.mostrarTipoAlerta}
      onMarkAllAsRead={notif.limparTodasNotificacoes}
    />
  )
}
