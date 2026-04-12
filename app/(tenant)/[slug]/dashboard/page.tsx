'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { AdminDashboardPremium, type AdminDashboardStats } from '@/components/domain/admin-dashboard-premium'
import { Alert, AlertDescription, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { formatDateShort } from '@/lib/constants'
import {
  buildAdminDashboardAlerts,
  buildDashboardResumoTendencia,
} from '@/lib/build-admin-dashboard-alerts'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import type { Agendamento, Barbearia } from '@/types'
import type { DashboardFatDiarioPonto } from '@/types/admin-dashboard'

interface DashboardExtra {
  fatDiario: DashboardFatDiarioPonto[]
  recebimentosPendentesHoje: { horario: string }[]
  estoqueCritico: { nome: string; quantidade: number; minimo: number }[]
  clientesNovosUltimos7Dias: number
  mediaAgendamentosRecente: number
}

function ymdFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
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

      const {
        data: { user },
      } = await supabase.auth.getUser()
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

      setBarbearia(barbeariaData)

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

      const [
        { count: todayCount },
        { count: monthCount },
        { data: todayRevenue },
        { data: monthRevenue },
        { count: clientsCount },
        { count: barbersCount },
        { data: proximos },
        { data: fatRows },
        { data: pendPagRows },
        { count: count14 },
        { count: novos7 },
        { data: estoqueRows },
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
          .from('barbeiros')
          .select('*', { count: 'exact', head: true })
          .eq('barbearia_id', barbeariaData.id)
          .eq('ativo', true)
          .or('funcao_equipe.eq.barbeiro,funcao_equipe.eq.barbeiro_lider,funcao_equipe.is.null'),
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
        operacaoLiberada
          ? supabase.from('estoque_produtos').select('nome, quantidade, minimo').eq('barbearia_id', barbeariaData.id)
          : Promise.resolve({ data: null as { nome: string; quantidade: number; minimo: number }[] | null }),
      ])

      const fHoje = todayRevenue?.reduce((acc, a) => acc + Number(a.valor), 0) || 0
      const fMes = monthRevenue?.reduce((acc, a) => acc + Number(a.valor), 0) || 0

      setStats({
        agendamentosHoje: todayCount || 0,
        agendamentosMes: monthCount || 0,
        faturamentoHoje: fHoje,
        faturamentoMes: fMes,
        totalClientes: clientsCount || 0,
        totalBarbeiros: barbersCount || 0,
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

      setExtra({
        fatDiario,
        recebimentosPendentesHoje: pendPagRows ?? [],
        estoqueCritico,
        clientesNovosUltimos7Dias: novos7 || 0,
        mediaAgendamentosRecente: (count14 || 0) / 14,
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
        agendamentosHoje: stats?.agendamentosHoje ?? 0,
        mediaAgendamentosRecente: extra?.mediaAgendamentosRecente ?? 0,
      }),
    [
      base,
      operacaoLiberada,
      extra?.recebimentosPendentesHoje,
      extra?.estoqueCritico,
      extra?.clientesNovosUltimos7Dias,
      extra?.mediaAgendamentosRecente,
      stats?.agendamentosHoje,
    ],
  )

  const tendenciaInsight = useMemo(() => {
    if (!extra || !stats) return ''
    const { insightLinha } = buildDashboardResumoTendencia(
      extra.fatDiario,
      stats.faturamentoMes,
      new Date().getDate(),
    )
    return insightLinha
  }, [extra, stats])

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader
        greetingOnly
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
          stats={stats}
          proximosAgendamentos={proximosAgendamentos}
          fatDiario={extra?.fatDiario ?? []}
          tendenciaInsight={tendenciaInsight}
          alertas={alertas}
          isLoading={isLoading}
          error={error}
          pagamentoPendentePlano={barbearia?.status_cadastro === 'pagamento_pendente'}
          operacaoLiberada={operacaoLiberada}
        />
      </PageContent>
    </TenantPanelPageContainer>
  )
}
