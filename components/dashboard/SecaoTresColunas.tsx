'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { DashboardInsightsDia, DashboardResumoDia } from '@/types/admin-dashboard'
import { EstoqueCritico } from '@/components/dashboard/EstoqueCritico'
import { InsightsDia } from '@/components/dashboard/InsightsDia'
import { ResumoDia } from '@/components/dashboard/ResumoDia'
import { dashboardStaggerChild } from '@/components/dashboard/dashboard-motion'

export function SecaoTresColunas(props: {
  base: string
  estoqueCritico: { nome: string; quantidade: number; minimo: number }[]
  resumoDia: DashboardResumoDia | null
  insightsDia: DashboardInsightsDia | null
  isLoading: boolean
  error: string | null
  operacaoLiberada: boolean
}) {
  const { base, estoqueCritico, resumoDia, insightsDia, isLoading, error, operacaoLiberada } = props
  const reduceMotion = useReducedMotion()
  const childVariants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : dashboardStaggerChild

  return (
    <motion.section variants={childVariants} aria-labelledby="dash-triple-heading">
      <h2 id="dash-triple-heading" className="sr-only">
        Estoque, resumo e insights
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <EstoqueCritico
          base={base}
          estoqueCritico={estoqueCritico}
          isLoading={isLoading}
          error={error}
          operacaoLiberada={operacaoLiberada}
        />
        <ResumoDia resumoDia={resumoDia} isLoading={isLoading} error={error} />
        <InsightsDia base={base} insightsDia={insightsDia} isLoading={isLoading} error={error} />
      </div>
    </motion.section>
  )
}
