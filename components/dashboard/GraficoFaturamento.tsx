'use client'

import dynamic from 'next/dynamic'
import { motion, useReducedMotion } from 'framer-motion'
import type { DashboardFatAtendDiarioPonto } from '@/types/admin-dashboard'
import { dashboardStaggerChild } from '@/components/dashboard/dashboard-motion'
import { GraficoFaturamentoSkeleton } from '@/components/dashboard/GraficoFaturamentoSkeleton'

const AdminDashboardFatAtendimentosChart = dynamic(
  () =>
    import('@/components/domain/admin-dashboard-fat-atendimentos-chart').then((m) => ({
      default: m.AdminDashboardFatAtendimentosChart,
    })),
  {
    ssr: false,
    loading: () => <GraficoFaturamentoSkeleton />,
  },
)

export function GraficoFaturamento(props: {
  data: DashboardFatAtendDiarioPonto[]
  isLoading: boolean
  error: string | null
}) {
  const reduceMotion = useReducedMotion()
  const childVariants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : dashboardStaggerChild

  return (
    <motion.div variants={childVariants} className="min-w-0">
      <AdminDashboardFatAtendimentosChart data={props.data} isLoading={props.isLoading} error={props.error} />
    </motion.div>
  )
}
