'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { AcoesRapidas } from '@/components/dashboard/AcoesRapidas'
import { AgendaDoDia } from '@/components/dashboard/AgendaDoDia'
import { dashboardStaggerParent } from '@/components/dashboard/dashboard-motion'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { GraficoFaturamento } from '@/components/dashboard/GraficoFaturamento'
import { KPICards } from '@/components/dashboard/KPICards'
import { SecaoTresColunas } from '@/components/dashboard/SecaoTresColunas'
import type { AdminDashboardHomeStats } from '@/components/domain/admin-dashboard-home-top'
import type { AdminDashboardStatusHoje } from '@/lib/build-admin-dashboard-status-hoje'
import type { Agendamento, Barbearia } from '@/types'
import type {
  DashboardAgendaDiaStats,
  DashboardFatAtendDiarioPonto,
  DashboardFatDiarioPonto,
  DashboardInsightsDia,
  DashboardOperacaoDiaKpis,
  DashboardResumoDia,
} from '@/types/admin-dashboard'
import type { ReactNode } from 'react'

export function DashboardPage(props: {
  base: string
  barbearia: Barbearia | null
  userPrimeiroNome: string | null
  stats: AdminDashboardHomeStats | null
  mediaAgendamentosPorDia14d: number
  clientesNovosUltimos7Dias: number
  agendaHoje: Agendamento[]
  fatDiario: DashboardFatDiarioPonto[]
  fatAtend7d: DashboardFatAtendDiarioPonto[]
  operacaoKpisHoje: DashboardOperacaoDiaKpis | null
  operacaoKpisOntem: DashboardOperacaoDiaKpis | null
  estoqueCritico: { nome: string; quantidade: number; minimo: number }[]
  resumoDia: DashboardResumoDia | null
  insightsDia: DashboardInsightsDia | null
  agendaStats: DashboardAgendaDiaStats | null
  isLoading: boolean
  error: string | null
  pagamentoPendentePlano: boolean
  operacaoLiberada: boolean
  statusHoje: AdminDashboardStatusHoje | null
  notificationsSlot: ReactNode
}) {
  const reduceMotion = useReducedMotion()
  const parentVariants = reduceMotion
    ? { hidden: {}, show: { transition: { staggerChildren: 0, delayChildren: 0 } } }
    : dashboardStaggerParent

  const {
    base,
    barbearia,
    userPrimeiroNome,
    stats,
    mediaAgendamentosPorDia14d,
    clientesNovosUltimos7Dias,
    agendaHoje,
    fatDiario,
    fatAtend7d,
    operacaoKpisHoje,
    operacaoKpisOntem,
    estoqueCritico,
    resumoDia,
    insightsDia,
    agendaStats,
    isLoading,
    error,
    pagamentoPendentePlano,
    operacaoLiberada,
    statusHoje,
    notificationsSlot,
  } = props

  return (
    <motion.div
      className="min-w-0 space-y-6"
      variants={parentVariants}
      initial="hidden"
      animate="show"
    >
      <DashboardHeader
        base={base}
        barbearia={barbearia}
        userPrimeiroNome={userPrimeiroNome}
        stats={stats}
        statusHoje={statusHoje}
        fatDiario={fatDiario}
        mediaAgendamentosPorDia14d={mediaAgendamentosPorDia14d}
        clientesNovosUltimos7Dias={clientesNovosUltimos7Dias}
        isLoading={isLoading}
        error={error}
        notificationsSlot={notificationsSlot}
        pagamentoPendentePlano={pagamentoPendentePlano}
      />
      <KPICards hoje={operacaoKpisHoje} ontem={operacaoKpisOntem} isLoading={isLoading} error={error} />
      <GraficoFaturamento data={fatAtend7d} isLoading={isLoading} error={error} />
      <SecaoTresColunas
        base={base}
        estoqueCritico={estoqueCritico}
        resumoDia={resumoDia}
        insightsDia={insightsDia}
        isLoading={isLoading}
        error={error}
        operacaoLiberada={operacaoLiberada}
      />
      <AgendaDoDia base={base} stats={agendaStats} agendamentos={agendaHoje} isLoading={isLoading} error={error} />
      <AcoesRapidas base={base} operacaoLiberada={operacaoLiberada} />
    </motion.div>
  )
}
