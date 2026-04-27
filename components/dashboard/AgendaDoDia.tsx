'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { AdminDashboardAgendaDia } from '@/components/domain/admin-dashboard-agenda-dia'
import type { Agendamento } from '@/types'
import type { DashboardAgendaDiaStats } from '@/types/admin-dashboard'
import { dashboardStaggerChild } from '@/components/dashboard/dashboard-motion'

export function AgendaDoDia(props: {
  base: string
  stats: DashboardAgendaDiaStats | null
  agendamentos: Agendamento[]
  isLoading: boolean
  error: string | null
}) {
  const reduceMotion = useReducedMotion()
  const childVariants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : dashboardStaggerChild

  return (
    <motion.section variants={childVariants} aria-labelledby="dash-agenda-dia-heading">
      <h2 id="dash-agenda-dia-heading" className="sr-only">
        Agenda do dia
      </h2>
      <AdminDashboardAgendaDia
        base={props.base}
        stats={props.stats}
        agendamentos={props.agendamentos}
        isLoading={props.isLoading}
        error={props.error}
      />
    </motion.section>
  )
}
