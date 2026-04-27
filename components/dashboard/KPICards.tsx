'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { AdminDashboardOperacaoKpis } from '@/components/domain/admin-dashboard-operacao-kpis'
import type { DashboardOperacaoDiaKpis } from '@/types/admin-dashboard'
import { dashboardStaggerChild } from '@/components/dashboard/dashboard-motion'

export function KPICards(props: {
  hoje: DashboardOperacaoDiaKpis | null
  ontem: DashboardOperacaoDiaKpis | null
  isLoading: boolean
  error: string | null
}) {
  const reduceMotion = useReducedMotion()
  const childVariants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : dashboardStaggerChild

  return (
    <motion.section variants={childVariants} aria-labelledby="dash-operacao-kpis-heading" className="space-y-3">
      <h2 id="dash-operacao-kpis-heading" className="text-foreground text-sm font-semibold tracking-tight">
        Operação hoje
      </h2>
      <AdminDashboardOperacaoKpis hoje={props.hoje} ontem={props.ontem} isLoading={props.isLoading} error={props.error} />
    </motion.section>
  )
}
