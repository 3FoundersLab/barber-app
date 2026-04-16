'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { AdminDashboardPremium } from '@/components/domain/admin-dashboard-premium'
import { AdminDashboardNotificationsTrigger } from '@/components/domain/admin-dashboard-notifications-trigger'
import { Alert, AlertDescription, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { formatDateShort } from '@/lib/constants'
import {
  buildAdminDashboardAlerts,
  buildDashboardResumoTendencia,
} from '@/lib/build-admin-dashboard-alerts'
import {
  normalizeDashboardNotificationState,
} from '@/lib/dashboard-notification-state'
import { buildAdminDashboardStatusHoje, type AdminDashboardStatusHoje } from '@/lib/build-admin-dashboard-status-hoje'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserSafe } from '@/lib/supabase/get-auth-user-safe'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import type { Agendamento, Barbearia } from '@/types'
import type { AlertaDashboard, DashboardFatDiarioPonto } from '@/types/admin-dashboard'

interface AdminDashboardStats {
  agendamentosHoje: number
  agendamentosMes: number
  faturamentoHoje: number
  faturamentoMes: number
  totalClientes: number
  totalBarbeiros: number
}

interface DashboardExtra {
  fatDiario: DashboardFatDiarioPonto[]
  recebimentosPendentesHoje: { horario: string }[]
  estoqueCritico: { nome: string; quantidade: number; minimo: number }[]
  clientesNovosUltimos7Dias: number
  aniversariantesHoje: { nome: string; telefone?: string | null }[]
  mediaAgendamentosRecente: number
  statusHoje: AdminDashboardStatusHoje
}

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

async function sumVendasProdutosNoDia(
  supabase: ReturnType<typeof createClient>,
  barbeariaId: string,
  ymd: string,
): Promise<number> {
  const { data: comandas } = await supabase
    .from('comandas')
    .select('id')
    .eq('barbearia_id', barbeariaId)
    .eq('referencia_data', ymd)
    .eq('status', 'fechada')
  const ids = comandas?.map((c) => c.id) ?? []
  if (!ids.length) return 0
  const { data: lines } = await supabase.from('comanda_produtos').select('quantidade').in('comanda_id', ids)
  return (lines ?? []).reduce((s, l) => s + (Number(l.quantidade) || 0), 0)
}

async function loadEquipeHoje(supabase: ReturnType<typeof createClient>, barbeariaId: string) {
  const { data: rows, count } = await supabase
    .from('barbeiros')
    .select('id', { count: 'exact' })
    .eq('barbearia_id', barbeariaId)
    .eq('ativo', true)
    .or('funcao_equipe.eq.barbeiro,funcao_equipe.eq.barbeiro_lider,funcao_equipe.is.null')
  const ids = rows?.map((r) => r.id) ?? []
  const n = count != null ? count : ids.length
  const dow = new Date().getDay()
  if (!ids.length) return { activeTotal: n, onDuty: 0 }
  const { count: horarioQualquer } = await supabase
    .from('horarios_trabalho')
    .select('*', { count: 'exact', head: true })
    .in('barbeiro_id', ids)
    .eq('ativo', true)
  if (!horarioQualquer) return { activeTotal: n, onDuty: n }
  const { data: ht } = await supabase
    .from('horarios_trabalho')
    .select('barbeiro_id')
    .in('barbeiro_id', ids)
    .eq('dia_semana', dow)
    .eq('ativo', true)
  const onDuty = new Set(ht?.map((h) => h.barbeiro_id)).size
  return { activeTotal: n, onDuty }
}

export default function AdminDashboardPage() {
  const { slug, base } = useTenantAdminBase()

  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [proximosAgendamentos, setProximosAgendamentos] = useState<Agendamento[]>([])
  const [extra, setExtra] = useState<DashboardExtra | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      setError(null)

      const user = await getAuthUserSafe(supabase)
      if (!user) {
        setError('Usuário não autenticado')
        setIsLoading(false)
        return
      }

      const barbeariaIdResolved = await resolveAdminBarbeariaId(supabase, user.id, { slug })

      if (!barbeariaIdResolved) {
        setError('Barbearia não encontrada para este usuário')
        setIsLoading(false)
        return
      }

      const { data: barbeariaData } = await supabase
        .from('barbearias')
        .select('*')
        .eq('id', barbeariaIdResolved)
        .single()

      if (!barbeariaData) {
        setError('Barbearia não encontrada')
        setIsLoading(false)
        return
      }

      const { data: notifStateRow } = await supabase
        .from('dashboard_notification_states')
        .select('read_ids, archived_ids, muted_types, read_at')
        .eq('barbearia_id', barbeariaData.id)
        .eq('user_id', user.id)
        .maybeSingle()
      const notifState = normalizeDashboardNotificationState(notifStateRow)

      setBarbearia(barbeariaData)
      setAlertasLidosIds(notifState.lidosIds)
      setAlertasDescartadosIds(notifState.arquivadosIds)
      setTiposOcultos(notifState.tiposOcultos)
      setAlertasLidosAt(notifState.lidosAt)
      setPersistContext({ userId: user.id, barbeariaId: barbeariaData.id })
      setPrefsHydrated(true)

      const today = new Date().toISOString().split('T')[0]
      const firstDayMonth = new Date()
      firstDayMonth.setDate(1)
      const monthStart = firstDayMonth.toISOString().split('T')[0]

      const [y, mo, da] = today.split('-').map(Number)
      const endLocal = new Date(y, mo - 1, da)
      const startLocal = new Date(endLocal)
      startLocal.setDate(endLocal.getDate() - 13)
      const start14s = ymdFromDate(startLocal)

      const operacaoLiberada = barbeariaData.status_cadastro !== 'pagamento_pendente'

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekAgoIso = weekAgo.toISOString()
      const ymdSemanaAnterior = addDaysYmd(today, -7)

      const [
        { count: todayCount },
        { count: monthCount },
        { data: todayRevenue },
        { data: monthRevenue },
        { count: clientsCount },
        { data: proximos },
        { data: fatRows },
        { data: pendPagRows },
        { count: count14 },
        { count: novos7 },
        { data: clientesComNascimentoRows },
        { data: estoqueRows },
        equipePack,
        { data: todayAgRows },
        { data: concl14Rows },
        { count: concHojeCount },
        vendasPack,
      ] = await Promise.all([
        supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('barbearia_id', barbeariaData.id)
          .eq('data', today),
        supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('barbearia_id', barbeariaData.id)
          .gte('data', monthStart),
        supabase
          .from('agendamentos')
          .select('valor')
          .eq('barbearia_id', barbeariaData.id)
          .eq('data', today)
          .eq('status', 'concluido'),
        supabase
          .from('agendamentos')
          .select('valor')
          .eq('barbearia_id', barbeariaData.id)
          .gte('data', monthStart)
          .eq('status', 'concluido'),
        supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('barbearia_id', barbeariaData.id),
        supabase
          .from('agendamentos')
          .select(
            `
                *,
                cliente:clientes(*),
                barbeiro:barbeiros(*),
                servico:servicos(*)
              `,
          )
          .eq('barbearia_id', barbeariaData.id)
          .eq('data', today)
          .in('status', ['agendado', 'em_atendimento'])
          .order('horario', { ascending: true })
          .limit(5),
        supabase
          .from('agendamentos')
          .select('data, valor')
          .eq('barbearia_id', barbeariaData.id)
          .gte('data', start14s)
          .lte('data', today)
          .eq('status', 'concluido'),
        operacaoLiberada
          ? supabase
              .from('agendamentos')
              .select('horario')
              .eq('barbearia_id', barbeariaData.id)
              .eq('data', today)
              .in('status', ['agendado', 'em_atendimento'])
              .eq('status_pagamento', 'pendente')
              .gt('valor', 0)
          : Promise.resolve({ data: null as { horario: string }[] | null }),
        supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('barbearia_id', barbeariaData.id)
          .gte('data', start14s)
          .lte('data', today)
          .in('status', ['agendado', 'em_atendimento', 'concluido']),
        supabase
          .from('clientes')
          .select('*', { count: 'exact', head: true })
          .eq('barbearia_id', barbeariaData.id)
          .gte('created_at', weekAgoIso),
        supabase
          .from('clientes')
          .select('nome, telefone, data_nascimento')
          .eq('barbearia_id', barbeariaData.id)
          .not('data_nascimento', 'is', null),
        operacaoLiberada
          ? supabase.from('estoque_produtos').select('nome, quantidade, minimo').eq('barbearia_id', barbeariaData.id)
          : Promise.resolve({ data: null as { nome: string; quantidade: number; minimo: number }[] | null }),
        loadEquipeHoje(supabase, barbeariaData.id),
        supabase
          .from('agendamentos')
          .select('horario, status')
          .eq('barbearia_id', barbeariaData.id)
          .eq('data', today),
        supabase
          .from('agendamentos')
          .select('data')
          .eq('barbearia_id', barbeariaData.id)
          .eq('status', 'concluido')
          .gte('data', start14s)
          .lte('data', today),
        supabase
          .from('agendamentos')
          .select('*', { count: 'exact', head: true })
          .eq('barbearia_id', barbeariaData.id)
          .eq('data', today)
          .eq('status', 'concluido'),
        operacaoLiberada
          ? (async () => {
              const [hoje, semana] = await Promise.all([
                sumVendasProdutosNoDia(supabase, barbeariaData.id, today),
                sumVendasProdutosNoDia(supabase, barbeariaData.id, ymdSemanaAnterior),
              ])
              return { hoje, semana }
            })()
          : Promise.resolve({ hoje: 0, semana: 0 }),
      ])

      const fHoje = todayRevenue?.reduce((acc, a) => acc + Number(a.valor), 0) || 0
      const fMes = monthRevenue?.reduce((acc, a) => acc + Number(a.valor), 0) || 0

      setStats({
        agendamentosHoje: todayCount || 0,
        agendamentosMes: monthCount || 0,
        faturamentoHoje: fHoje,
        faturamentoMes: fMes,
        totalClientes: clientsCount || 0,
        totalBarbeiros: equipePack.activeTotal,
      })

      if (proximos) setProximosAgendamentos(proximos)

      const fatByDay: Record<string, number> = {}
      for (const row of fatRows ?? []) {
        const key = row.data as string
        fatByDay[key] = (fatByDay[key] ?? 0) + Number(row.valor)
      }

      const fatDiario: DashboardFatDiarioPonto[] = []
      for (let i = 0; i < 14; i++) {
        const d = new Date(startLocal)
        d.setDate(startLocal.getDate() + i)
        const data = ymdFromDate(d)
        fatDiario.push({
          data,
          label: formatDateShort(data),
          faturamento: fatByDay[data] ?? 0,
        })
      }

      const estoqueCritico = operacaoLiberada
        ? (estoqueRows ?? [])
            .filter((r) => r.quantidade <= r.minimo || r.quantidade <= 0)
            .sort((a, b) => a.quantidade - b.quantidade)
            .slice(0, 5)
        : []

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

      const statusHoje = buildAdminDashboardStatusHoje({
        barbearia: barbeariaData,
        todayYmd: today,
        fatDiario,
        faturamentoHojeConcluido: fHoje,
        barbeirosEscalados: equipePack.onDuty,
        barbeirosAtivos: equipePack.activeTotal,
        agendamentosHojeLinhas: (todayAgRows ?? []) as { horario: string; status: string }[],
        concluidosHojeCount: concHojeCount ?? 0,
        concluidosDatas14d: (concl14Rows ?? []).map((r) => r.data as string),
        vendasProdutosHoje: vendasPack.hoje,
        vendasProdutosSemanaAnterior: vendasPack.semana,
      })

      setExtra({
        fatDiario,
        recebimentosPendentesHoje: pendPagRows ?? [],
        estoqueCritico,
        clientesNovosUltimos7Dias: novos7 || 0,
        aniversariantesHoje,
        mediaAgendamentosRecente: (count14 || 0) / 14,
        statusHoje,
      })

      setIsLoading(false)
    }

    void loadData()
  }, [slug])

  const operacaoLiberada = barbearia ? barbearia.status_cadastro !== 'pagamento_pendente' : false

  const alertas = useMemo(
    () =>
      buildAdminDashboardAlerts({
        base,
        operacaoLiberada,
        recebimentosPendentesHoje: extra?.recebimentosPendentesHoje ?? [],
        estoqueCritico: extra?.estoqueCritico ?? [],
        clientesNovosUltimos7Dias: extra?.clientesNovosUltimos7Dias ?? 0,
        aniversariantesHoje: extra?.aniversariantesHoje ?? [],
        agendamentosHoje: stats?.agendamentosHoje ?? 0,
        mediaAgendamentosRecente: extra?.mediaAgendamentosRecente ?? 0,
      }),
    [
      base,
      operacaoLiberada,
      extra?.recebimentosPendentesHoje,
      extra?.estoqueCritico,
      extra?.clientesNovosUltimos7Dias,
      extra?.aniversariantesHoje,
      extra?.mediaAgendamentosRecente,
      stats?.agendamentosHoje,
    ],
  )

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

  const alertasNaFaixa = useMemo(() => {
    const lidos = new Set(alertasLidosIds)
    return alertasVisiveis.filter((a) => !lidos.has(a.id))
  }, [alertasVisiveis, alertasLidosIds])

  const persistNotificationState = useCallback(
    (overrides?: {
      lidosIds?: string[]
      arquivadosIds?: string[]
      tipos?: AlertaDashboard['tipo'][]
      lidosAt?: Record<string, string>
    }) => {
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
    },
    [alertasDescartadosIds, alertasLidosAt, alertasLidosIds, persistContext, prefsHydrated, tiposOcultos],
  )

  const marcarAlertaLido = useCallback((id: string) => {
    const nextLidos = alertasLidosIds.includes(id) ? alertasLidosIds : [...alertasLidosIds, id]
    const nextLidosAt = alertasLidosAt[id] ? alertasLidosAt : { ...alertasLidosAt, [id]: new Date().toISOString() }
    setAlertasLidosIds(nextLidos)
    setAlertasLidosAt(nextLidosAt)
    persistNotificationState({ lidosIds: nextLidos, lidosAt: nextLidosAt })
  }, [alertasLidosAt, alertasLidosIds, persistNotificationState])

  const limparTodasNotificacoes = useCallback(() => {
    const now = new Date().toISOString()
    const nextLidos = [...new Set([...alertasLidosIds, ...alertasVisiveis.map((a) => a.id)])]
    const nextLidosAt = { ...alertasLidosAt }
    for (const alerta of alertasVisiveis) nextLidosAt[alerta.id] ||= now
    setAlertasLidosIds(nextLidos)
    setAlertasLidosAt(nextLidosAt)
    persistNotificationState({ lidosIds: nextLidos, lidosAt: nextLidosAt })
  }, [alertasLidosAt, alertasLidosIds, alertasVisiveis, persistNotificationState])

  const desmarcarAlertaLidoHandler = useCallback(
    (id: string) => {
      const nextLidos = alertasLidosIds.filter((x) => x !== id)
      const nextLidosAt = { ...alertasLidosAt }
      delete nextLidosAt[id]
      setAlertasLidosIds(nextLidos)
      setAlertasLidosAt(nextLidosAt)
      persistNotificationState({ lidosIds: nextLidos, lidosAt: nextLidosAt })
    },
    [alertasLidosAt, alertasLidosIds, persistNotificationState],
  )

  const arquivarAlertaHandler = useCallback(
    (id: string) => {
      const nextArquivados = alertasDescartadosIds.includes(id) ? alertasDescartadosIds : [...alertasDescartadosIds, id]
      setAlertasDescartadosIds(nextArquivados)
      persistNotificationState({ arquivadosIds: nextArquivados })
    },
    [alertasDescartadosIds, persistNotificationState],
  )

  const desarquivarAlertaHandler = useCallback(
    (id: string) => {
      const nextArquivados = alertasDescartadosIds.filter((x) => x !== id)
      setAlertasDescartadosIds(nextArquivados)
      persistNotificationState({ arquivadosIds: nextArquivados })
    },
    [alertasDescartadosIds, persistNotificationState],
  )

  const ocultarTipoAlertaHandler = useCallback(
    (tipo: AlertaDashboard['tipo']) => {
      const nextTipos = tiposOcultos.includes(tipo) ? tiposOcultos : [...tiposOcultos, tipo]
      setTiposOcultos(nextTipos)
      persistNotificationState({ tipos: nextTipos })
    },
    [tiposOcultos, persistNotificationState],
  )

  const mostrarTipoAlertaHandler = useCallback(
    (tipo: AlertaDashboard['tipo']) => {
      const nextTipos = tiposOcultos.filter((x) => x !== tipo)
      setTiposOcultos(nextTipos)
      persistNotificationState({ tipos: nextTipos })
    },
    [tiposOcultos, persistNotificationState],
  )

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

  const [notificacoesAbrirChave, setNotificacoesAbrirChave] = useState(0)
  const solicitarAbrirNotificacoes = useCallback(() => {
    setNotificacoesAbrirChave((k) => k + 1)
  }, [])

  const tendenciaInsight = useMemo(() => {
    if (!extra || !stats) return ''
    const { insightLinha } = buildDashboardResumoTendencia(
      extra.fatDiario,
      stats.faturamentoMes,
      new Date().getDate(),
    )
    return insightLinha
  }, [extra, stats])

  const headerNotificacoes = useMemo(
    () =>
      !error ? (
        <AdminDashboardNotificationsTrigger
          alertas={alertasVisiveis}
          alertasArquivados={alertasArquivados}
          tiposOcultos={tiposOcultos}
          lidosIds={alertasLidosIds}
          lidosAt={alertasLidosAt}
          isLoading={isLoading}
          onMarkAsRead={marcarAlertaLido}
          onMarkAsUnread={desmarcarAlertaLidoHandler}
          onArchive={arquivarAlertaHandler}
          onUnarchive={desarquivarAlertaHandler}
          onMuteType={ocultarTipoAlertaHandler}
          onUnmuteType={mostrarTipoAlertaHandler}
          onMarkAllAsRead={limparTodasNotificacoes}
          openRequestKey={notificacoesAbrirChave}
        />
      ) : null,
    [
      error,
      alertasVisiveis,
      alertasArquivados,
      alertasLidosIds,
      alertasLidosAt,
      isLoading,
      limparTodasNotificacoes,
      persistNotificationState,
      marcarAlertaLido,
      notificacoesAbrirChave,
      desmarcarAlertaLidoHandler,
      arquivarAlertaHandler,
      desarquivarAlertaHandler,
      ocultarTipoAlertaHandler,
      mostrarTipoAlertaHandler,
    ],
  )

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader
        greetingOnly
        profileHref={`${base}/configuracoes`}
        avatarFallback="A"
        actions={headerNotificacoes}
      />

      <PageContent className="space-y-6 md:space-y-8">
        {barbearia?.status_cadastro === 'pagamento_pendente' && (
          <Alert variant="warning" className="text-left">
            <AlertTitle>Pagamento pendente</AlertTitle>
            <AlertDescription>
              Seu acesso ao painel está limitado ao dashboard, à página de assinatura e às configurações até o
              administrador da plataforma confirmar o pagamento. Depois da aprovação, demais áreas (clientes, comandas,
              financeiro, equipe, estoque etc.) ficam liberadas.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <AdminDashboardPremium
          base={base}
          barbearia={barbearia}
          proximosAgendamentos={proximosAgendamentos}
          fatDiario={extra?.fatDiario ?? []}
          tendenciaInsight={tendenciaInsight}
          alertas={alertasNaFaixa}
          isLoading={isLoading}
          error={error}
          pagamentoPendentePlano={barbearia?.status_cadastro === 'pagamento_pendente'}
          operacaoLiberada={operacaoLiberada}
          statusHoje={extra?.statusHoje ?? null}
          onVerMaisNotificacoes={!error ? solicitarAbrirNotificacoes : undefined}
          onMarcarAlertaLido={!error ? marcarAlertaLido : undefined}
          onArquivarAlerta={!error ? arquivarAlertaHandler : undefined}
          onOcultarTipoAlerta={!error ? ocultarTipoAlertaHandler : undefined}
          onDesmarcarAlertaLido={!error ? desmarcarAlertaLidoHandler : undefined}
        />
      </PageContent>
    </TenantPanelPageContainer>
  )
}
