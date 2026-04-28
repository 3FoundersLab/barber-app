'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { AdminDashboardPremium } from '@/components/domain/admin-dashboard-premium'
import { NotificationPanel } from '@/components/notifications/NotificationPanel'
import { Alert, AlertDescription, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { DIAS_SEMANA, formatDateShort } from '@/lib/constants'
import { estimarSlotsVagosHoje } from '@/lib/dashboard-operacao-helpers'
import { notaEstimadaBarbeiro } from '@/lib/relatorios-barbeiros-analise'
import { buildAdminDashboardAlerts } from '@/lib/build-admin-dashboard-alerts'
import { listAniversariosEquipeNaJanela } from '@/lib/birthday-countdown'
import { buildAdminDashboardStatusHoje, type AdminDashboardStatusHoje } from '@/lib/build-admin-dashboard-status-hoje'
import { mapApiNotificationStateToRow, type NotificationApiState } from '@/lib/notification-api-state'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserSafe } from '@/lib/supabase/get-auth-user-safe'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { useNotifications } from '@/hooks/useNotifications'
import type { Agendamento, Barbearia } from '@/types'
import type {
  AlertaDashboard,
  DashboardAgendaDiaStats,
  DashboardFatAtendDiarioPonto,
  DashboardFatDiarioPonto,
  DashboardInsightsDia,
  DashboardOperacaoDiaKpis,
  DashboardResumoDia,
} from '@/types/admin-dashboard'

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
  fatAtend7d: DashboardFatAtendDiarioPonto[]
  operacaoKpisHoje: DashboardOperacaoDiaKpis
  operacaoKpisOntem: DashboardOperacaoDiaKpis
  recebimentosPendentesHoje: { horario: string }[]
  estoqueCritico: { nome: string; quantidade: number; minimo: number }[]
  clientesNovosUltimos7Dias: number
  aniversariantesHoje: { nome: string; telefone?: string | null }[]
  aniversariosEquipeProximos: { nome: string; telefone: string | null; diasRestantes: number }[]
  mediaAgendamentosRecente: number
  statusHoje: AdminDashboardStatusHoje
  resumoDia: DashboardResumoDia
  insightsDia: DashboardInsightsDia
  agendaStats: DashboardAgendaDiaStats
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

async function sumComandaServicosFechadasNoDia(
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
  const { data: lines } = await supabase.from('comanda_servicos').select('quantidade').in('comanda_id', ids)
  return (lines ?? []).reduce((s, l) => s + (Number(l.quantidade) || 0), 0)
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

function agregadosOperacaoPorDia(
  linhas: { data: string; status: string }[],
  ymd: string,
): DashboardOperacaoDiaKpis {
  const rows = linhas.filter((r) => r.data === ymd)
  const ativo = (s: string) => s !== 'cancelado' && s !== 'faltou'
  const agendamentosDia = rows.filter((r) => ativo(r.status)).length
  const executadosDia = rows.filter((r) => r.status === 'concluido').length
  const pendentesDia = rows.filter((r) => r.status === 'agendado' || r.status === 'em_atendimento').length
  const atendimentosDia = rows.filter((r) => r.status === 'concluido' || r.status === 'em_atendimento').length
  return {
    atendimentosDia,
    servicosDia: 0,
    agendamentosDia,
    executadosDia,
    pendentesDia,
  }
}

export default function AdminDashboardPage() {
  const { slug, base } = useTenantAdminBase()

  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [userPrimeiroNome, setUserPrimeiroNome] = useState<string | null>(null)
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [proximosAgendamentos, setProximosAgendamentos] = useState<Agendamento[]>([])
  const [extra, setExtra] = useState<DashboardExtra | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        aniversariosEquipeProximos: extra?.aniversariosEquipeProximos ?? [],
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
      extra?.aniversariosEquipeProximos,
      extra?.mediaAgendamentosRecente,
      stats?.agendamentosHoje,
    ],
  )

  const notif = useNotifications(slug, alertas)

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

      const { data: profileRow } = await supabase.from('profiles').select('nome').eq('id', user.id).maybeSingle()
      const nomeBruto = typeof profileRow?.nome === 'string' ? profileRow.nome.trim() : ''
      setUserPrimeiroNome(nomeBruto ? nomeBruto.split(/\s+/)[0]! : null)

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

      setBarbearia(barbeariaData)
      try {
        const prefRes = await fetch(
          `/api/notifications?barbeariaId=${encodeURIComponent(barbeariaData.id)}&slug=${encodeURIComponent(slug)}`,
        )
        if (prefRes.ok) {
          const pref = (await prefRes.json()) as NotificationApiState
          notif.hydratePreferences(mapApiNotificationStateToRow(pref), { userId: user.id, barbeariaId: barbeariaData.id })
        } else {
          notif.hydratePreferences(null, { userId: user.id, barbeariaId: barbeariaData.id })
        }
      } catch {
        notif.hydratePreferences(null, { userId: user.id, barbeariaId: barbeariaData.id })
      }

      const today = new Date().toISOString().split('T')[0]
      const yesterdayYmd = addDaysYmd(today, -1)
      const start7Ymd = addDaysYmd(today, -6)
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
        { data: barbeirosComNascimentoRows },
        { data: estoqueRows },
        equipePack,
        { data: todayAgRows },
        { data: concl14Rows },
        { count: concHojeCount },
        vendasPack,
        { count: novosHojeCount },
        { data: ag30statusRows },
        { data: conc56Data },
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
          .order('horario', { ascending: true })
          .limit(25),
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
        supabase
          .from('barbeiros')
          .select('nome, telefone, data_nascimento')
          .eq('barbearia_id', barbeariaData.id)
          .eq('ativo', true)
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
        supabase
          .from('clientes')
          .select('id', { count: 'exact', head: true })
          .eq('barbearia_id', barbeariaData.id)
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${addDaysYmd(today, 1)}T00:00:00.000Z`),
        supabase
          .from('agendamentos')
          .select('status')
          .eq('barbearia_id', barbeariaData.id)
          .gte('data', addDaysYmd(today, -29))
          .lte('data', today),
        supabase
          .from('agendamentos')
          .select('data')
          .eq('barbearia_id', barbeariaData.id)
          .eq('status', 'concluido')
          .gte('data', addDaysYmd(today, -55))
          .lte('data', today),
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

      const [{ data: agTwoDays }, { data: conc7Rows }, servicosHojeCount, servicosOntemCount] = await Promise.all([
        supabase
          .from('agendamentos')
          .select('data, status')
          .eq('barbearia_id', barbeariaData.id)
          .in('data', [today, yesterdayYmd]),
        supabase
          .from('agendamentos')
          .select('data')
          .eq('barbearia_id', barbeariaData.id)
          .eq('status', 'concluido')
          .gte('data', start7Ymd)
          .lte('data', today),
        operacaoLiberada
          ? sumComandaServicosFechadasNoDia(supabase, barbeariaData.id, today)
          : Promise.resolve(0),
        operacaoLiberada
          ? sumComandaServicosFechadasNoDia(supabase, barbeariaData.id, yesterdayYmd)
          : Promise.resolve(0),
      ])

      const agKpiRows = (agTwoDays ?? []) as { data: string; status: string }[]
      const packHoje = agregadosOperacaoPorDia(agKpiRows, today)
      const packOntem = agregadosOperacaoPorDia(agKpiRows, yesterdayYmd)
      const operacaoKpisHoje: DashboardOperacaoDiaKpis = {
        ...packHoje,
        servicosDia: servicosHojeCount,
      }
      const operacaoKpisOntem: DashboardOperacaoDiaKpis = {
        ...packOntem,
        servicosDia: servicosOntemCount,
      }

      const concl7ByDay: Record<string, number> = {}
      for (const row of conc7Rows ?? []) {
        const key = row.data as string
        concl7ByDay[key] = (concl7ByDay[key] ?? 0) + 1
      }

      const [ty, tmo, tda] = today.split('-').map(Number)
      const endTodayLocal = new Date(ty, tmo - 1, tda)
      const fatAtend7d: DashboardFatAtendDiarioPonto[] = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(endTodayLocal)
        d.setDate(endTodayLocal.getDate() - 6 + i)
        const data = ymdFromDate(d)
        fatAtend7d.push({
          data,
          label: formatDateShort(data),
          faturamento: fatByDay[data] ?? 0,
          atendimentos: concl7ByDay[data] ?? 0,
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

      const aniversariosEquipeProximos = listAniversariosEquipeNaJanela(barbeirosComNascimentoRows ?? [], 3, hoje)

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

      let c30 = 0
      let t30 = 0
      for (const row of ag30statusRows ?? []) {
        const s = (row as { status: string }).status
        if (s === 'concluido') c30++
        if (s !== 'cancelado' && s !== 'faltou') t30++
      }
      const avaliacaoMedia = notaEstimadaBarbeiro(c30, t30)

      const byDow = [0, 0, 0, 0, 0, 0, 0]
      for (const row of conc56Data ?? []) {
        const raw = row as { data: string }
        const [Y, M, D] = raw.data.split('-').map(Number)
        const dt = new Date(Y, M - 1, D)
        byDow[dt.getDay()] = (byDow[dt.getDay()] ?? 0) + 1
      }
      let maxC = 0
      let maxI = 0
      for (let i = 0; i < 7; i++) {
        if (byDow[i] > maxC) {
          maxC = byDow[i]
          maxI = i
        }
      }
      const diaMaisMovimentado = maxC > 0 ? DIAS_SEMANA[maxI]! : null

      const todayKpiRows = agKpiRows.filter((r) => r.data === today)
      const canceladosHoje = todayKpiRows.filter((r) => r.status === 'cancelado').length
      const agendaStats: DashboardAgendaDiaStats = {
        agendados: packHoje.agendamentosDia,
        executados: packHoje.executadosDia,
        pendentes: packHoje.pendentesDia,
        cancelados: canceladosHoje,
      }

      const fatOntemVal = fatByDay[yesterdayYmd] ?? 0
      let fatPctVsOntem: number | null = null
      if (fHoje === fatOntemVal) fatPctVsOntem = 0
      else if (fatOntemVal > 0) fatPctVsOntem = ((fHoje - fatOntemVal) / fatOntemVal) * 100
      else if (fHoje > 0) fatPctVsOntem = 100

      const vagosEstimados = estimarSlotsVagosHoje(
        barbeariaData,
        equipePack.onDuty,
        packHoje.agendamentosDia,
      )

      const resumoDia: DashboardResumoDia = {
        faturamentoDia: fHoje,
        ticketMedio: fHoje / Math.max(1, concHojeCount ?? 0),
        novosClientesDia: novosHojeCount ?? 0,
        avaliacaoMedia,
        nAvaliacoesBase: c30,
        avaliacaoEhEstimativa: true,
      }

      const insightsDia: DashboardInsightsDia = {
        fatPctVsOntem,
        vagosEstimados,
        diaMaisMovimentado,
      }

      setExtra({
        fatDiario,
        fatAtend7d,
        operacaoKpisHoje,
        operacaoKpisOntem,
        recebimentosPendentesHoje: pendPagRows ?? [],
        estoqueCritico,
        clientesNovosUltimos7Dias: novos7 || 0,
        aniversariantesHoje,
        aniversariosEquipeProximos,
        mediaAgendamentosRecente: (count14 || 0) / 14,
        statusHoje,
        resumoDia,
        insightsDia,
        agendaStats,
      })

      setIsLoading(false)
    }

    void loadData()
  }, [slug, notif.hydratePreferences])

  const alertasNaFaixa = useMemo(() => {
    const lidos = new Set(notif.alertasLidosIds)
    return notif.alertasVisiveis.filter((a) => !lidos.has(a.id))
  }, [notif.alertasVisiveis, notif.alertasLidosIds])

  const [notificacoesAbrirChave, setNotificacoesAbrirChave] = useState(0)
  const solicitarAbrirNotificacoes = useCallback(() => {
    setNotificacoesAbrirChave((k) => k + 1)
  }, [])

  const headerNotificacoes = useMemo(
    () => (
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
        openRequestKey={notificacoesAbrirChave}
        unreadBadgeClassName="bg-destructive text-destructive-foreground shadow-sm"
      />
    ),
    [
      notif.alertasVisiveis,
      notif.alertasArquivados,
      notif.alertasLidosIds,
      notif.alertasLidosAt,
      notif.tiposOcultos,
      isLoading,
      notif.limparTodasNotificacoes,
      notif.marcarAlertaLido,
      notificacoesAbrirChave,
      notif.desmarcarAlertaLido,
      notif.arquivarAlerta,
      notif.desarquivarAlerta,
      notif.ocultarTipoAlerta,
      notif.mostrarTipoAlerta,
    ],
  )

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader
        greetingOnly
        hideGreeting
        actions={headerNotificacoes}
        profileHref={`${base}/configuracoes`}
        avatarFallback="A"
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
          userPrimeiroNome={userPrimeiroNome}
          stats={stats}
          mediaAgendamentosPorDia14d={extra?.mediaAgendamentosRecente ?? 0}
          clientesNovosUltimos7Dias={extra?.clientesNovosUltimos7Dias ?? 0}
          agendaHoje={proximosAgendamentos}
          fatDiario={extra?.fatDiario ?? []}
          fatAtend7d={extra?.fatAtend7d ?? []}
          operacaoKpisHoje={extra?.operacaoKpisHoje ?? null}
          operacaoKpisOntem={extra?.operacaoKpisOntem ?? null}
          estoqueCritico={extra?.estoqueCritico ?? []}
          resumoDia={extra?.resumoDia ?? null}
          insightsDia={extra?.insightsDia ?? null}
          agendaStats={extra?.agendaStats ?? null}
          alertas={alertasNaFaixa}
          isLoading={isLoading}
          error={error}
          pagamentoPendentePlano={barbearia?.status_cadastro === 'pagamento_pendente'}
          operacaoLiberada={operacaoLiberada}
          statusHoje={extra?.statusHoje ?? null}
          notificationsSlot={null}
          onVerMaisNotificacoes={!error ? solicitarAbrirNotificacoes : undefined}
          onMarcarAlertaLido={!error ? notif.marcarAlertaLido : undefined}
          onArquivarAlerta={!error ? notif.arquivarAlerta : undefined}
          onOcultarTipoAlerta={!error ? notif.ocultarTipoAlerta : undefined}
          onDesmarcarAlertaLido={!error ? notif.desmarcarAlertaLido : undefined}
        />
      </PageContent>
    </TenantPanelPageContainer>
  )
}
