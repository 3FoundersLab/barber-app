'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import {
  AdminDashboardHomeTop,
  type AdminDashboardHomeStats,
} from '@/components/domain/admin-dashboard-home-top'
import { Button } from '@/components/ui/button'
import type { AdminDashboardStatusHoje } from '@/lib/build-admin-dashboard-status-hoje'
import type { Barbearia } from '@/types'
import type { DashboardFatDiarioPonto } from '@/types/admin-dashboard'
import type { ReactNode } from 'react'
import { dashboardStaggerChild } from '@/components/dashboard/dashboard-motion'

export function DashboardHeader(props: {
  base: string
  barbearia: Barbearia | null
  userPrimeiroNome: string | null
  stats: AdminDashboardHomeStats | null
  statusHoje: AdminDashboardStatusHoje | null
  fatDiario: DashboardFatDiarioPonto[]
  mediaAgendamentosPorDia14d: number
  clientesNovosUltimos7Dias: number
  isLoading: boolean
  error: string | null
  notificationsSlot: ReactNode
  pagamentoPendentePlano: boolean
}) {
  const reduceMotion = useReducedMotion()
  const childVariants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : dashboardStaggerChild

  const {
    base,
    barbearia,
    userPrimeiroNome,
    stats,
    statusHoje,
    fatDiario,
    mediaAgendamentosPorDia14d,
    clientesNovosUltimos7Dias,
    isLoading,
    error,
    notificationsSlot,
    pagamentoPendentePlano,
  } = props

  return (
    <motion.section variants={childVariants} aria-labelledby="dash-home-heading" className="space-y-0">
      <h2 id="dash-home-heading" className="sr-only">
        Resumo do painel
      </h2>
      <AdminDashboardHomeTop
        userPrimeiroNome={userPrimeiroNome}
        barbeariaNome={barbearia?.nome ?? null}
        stats={stats}
        statusHoje={statusHoje}
        fatDiario={fatDiario}
        mediaAgendamentosPorDia14d={mediaAgendamentosPorDia14d}
        clientesNovosUltimos7Dias={clientesNovosUltimos7Dias}
        isLoading={isLoading}
        error={error}
        notificationsSlot={notificationsSlot}
      />
      {!error && barbearia && pagamentoPendentePlano ? (
        <div className="mt-4 flex justify-end">
          <Button size="sm" variant="outline" asChild>
            <Link href={`${base}/assinatura`}>Concluir ativação</Link>
          </Button>
        </div>
      ) : null}
      {!error && barbearia && !pagamentoPendentePlano ? (
        <div className="mt-4 hidden justify-end sm:flex">
          <Button size="sm" variant="outline" asChild>
            <Link href={`${base}/relatorios`}>Relatórios</Link>
          </Button>
        </div>
      ) : null}
    </motion.section>
  )
}
