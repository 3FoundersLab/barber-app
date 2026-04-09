'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SuperPremiumBackdrop } from '@/components/super/super-premium-backdrop'

/**
 * Fundo alinhado à landing / Super: respeita o tema global (claro ou escuro).
 * Não força `dark` local — o toggle em `html` controla a aparência.
 */
export function LoginLandingShell({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion() === true

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <SuperPremiumBackdrop />
      </div>

      {/* Glows extras só no tema escuro (profundidade) */}
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden dark:block" aria-hidden>
        <motion.div
          className="absolute left-1/2 top-[18%] z-0 h-[min(55vw,420px)] w-[min(55vw,420px)] -translate-x-1/2 rounded-full bg-cyan-500/[0.1] blur-[72px] md:left-[38%] md:top-[22%] md:translate-x-0 lg:h-[460px] lg:w-[460px]"
          animate={
            reduceMotion
              ? undefined
              : {
                  opacity: [0.32, 0.46, 0.32],
                  scale: [1, 1.04, 1],
                }
          }
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -left-[12%] bottom-[10%] z-0 h-[min(48vw,320px)] w-[min(48vw,320px)] rounded-full bg-teal-600/[0.07] blur-[64px] lg:left-[2%]"
          animate={reduceMotion ? undefined : { opacity: [0.26, 0.38, 0.26] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        />
        <motion.div
          className="absolute -right-[8%] top-[12%] z-0 h-[min(40vw,260px)] w-[min(40vw,260px)] rounded-full bg-orange-600/[0.06] blur-[56px] md:right-[4%]"
          animate={reduceMotion ? undefined : { opacity: [0.2, 0.34, 0.2] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  )
}
