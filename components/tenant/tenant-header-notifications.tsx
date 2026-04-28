'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CalendarClock } from 'lucide-react'
import { NotificationPanel } from '@/components/notifications/NotificationPanel'
import { buildAdminDashboardAlerts } from '@/lib/build-admin-dashboard-alerts'
import { listAniversariosEquipeNaJanela } from '@/lib/birthday-countdown'
import { whatsappChatHref } from '@/lib/format-contato'
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

function toAppointmentDateTime(dataYmd: string, horario: string): Date {
  const [y, m, d] = dataYmd.split('-').map(Number)
  const [hh, mm] = horario.slice(0, 5).split(':').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0)
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
          { data: confirmacoes24hRows },
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
          operacaoLiberada
            ? supabase
                .from('agendamentos')
                .select('id, data, horario, status, confirmado_cliente_em, cliente:clientes(nome, telefone)')
                .eq('barbearia_id', barbearia.id)
                .gte('data', today)
                .lte('data', addDaysYmd(today, 1))
                .eq('status', 'agendado')
                .is('confirmado_cliente_em', null)
            : Promise.resolve({
                data: null as {
                  id: string
                  data: string
                  horario: string
                  status: string
                  confirmado_cliente_em: string | null
                  cliente: { nome: string | null; telefone: string | null } | null
                }[] | null,
              }),
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

        const now = new Date()
        const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        const confirmacoes24hPendentes = (confirmacoes24hRows ?? []).filter((row) => {
          const dateTime = toAppointmentDateTime(row.data, row.horario)
          return dateTime > now && dateTime <= next24h
        })
        const alertaConfirmacao24h: AlertaDashboard[] = operacaoLiberada
          ? confirmacoes24hPendentes
              .map((row) => {
                const clienteNome = row.cliente?.nome?.trim() || 'Cliente'
                const clienteTelefone = row.cliente?.telefone
                const message = `Olá, ${clienteNome}! Tudo bem? Passando para confirmar seu agendamento de amanhã às ${row.horario.slice(0, 5)}. Você confirma presença?`
                const whatsappLink = whatsappChatHref(clienteTelefone, message)
                if (!whatsappLink) return null
                return {
                  id: `agenda-confirmacao-24h-${row.id}`,
                  tipo: 'atencao',
                  titulo: `Confirmação pendente: ${clienteNome}`,
                  descricao: `Atendimento em ${row.data} às ${row.horario.slice(0, 5)}. Envie o WhatsApp para confirmar presença.`,
                  acao: 'Enviar WhatsApp',
                  link: whatsappLink,
                  linkTarget: '_blank' as const,
                  icone: CalendarClock,
                }
              })
              .filter((alerta): alerta is AlertaDashboard => Boolean(alerta))
              .slice(0, 8)
          : []

        if (!cancelled) {
          setAlertas([...alertasCalculados, ...alertaConfirmacao24h])
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
