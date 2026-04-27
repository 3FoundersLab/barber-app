'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { AdminDashboardAcoesRapidas } from '@/components/domain/admin-dashboard-acoes-rapidas'
import { dashboardStaggerChild } from '@/components/dashboard/dashboard-motion'

export function AcoesRapidas(props: { base: string; operacaoLiberada: boolean }) {
  const reduceMotion = useReducedMotion()
  const childVariants = reduceMotion
    ? { hidden: { opacity: 1, y: 0 }, show: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : dashboardStaggerChild

  return (
    <motion.section variants={childVariants} aria-label="Ações rápidas">
      <AdminDashboardAcoesRapidas base={props.base} operacaoLiberada={props.operacaoLiberada} />
    </motion.section>
  )
}
