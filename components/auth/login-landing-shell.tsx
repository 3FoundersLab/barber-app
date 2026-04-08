'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { LandingAmbientMotes } from '@/components/landing/landing-ambient-motes'

/**
 * Fundo e atmosfera alinhados ao hero da landing (zinc-950, radiais, grade, glow, motes).
 * Wrapper força tema escuro para inputs/buttons shadcn coerentes com a marca.
 */
export function LoginLandingShell({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion() === true

  return (
    <div className="dark relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-zinc-950" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(24,24,27,0.9),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_78%_32%,rgba(6,182,212,0.09),transparent_62%),radial-gradient(ellipse_40%_35%_at_12%_72%,rgba(59,130,246,0.06),transparent_58%),radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(20,184,166,0.05),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_45%,transparent_0%,rgba(9,9,11,0.55)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_72%_62%_at_50%_42%,black,transparent)]"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 z-[1]">
        <LandingAmbientMotes preset="login" />
      </div>

      <motion.div
        className="pointer-events-none absolute left-1/2 top-[18%] z-0 h-[min(55vw,420px)] w-[min(55vw,420px)] -translate-x-1/2 rounded-full bg-cyan-500/[0.1] blur-[72px] md:left-[38%] md:top-[22%] md:translate-x-0 lg:h-[460px] lg:w-[460px]"
        aria-hidden
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
        className="pointer-events-none absolute -left-[12%] bottom-[10%] z-0 h-[min(48vw,320px)] w-[min(48vw,320px)] rounded-full bg-teal-600/[0.07] blur-[64px] lg:left-[2%]"
        aria-hidden
        animate={reduceMotion ? undefined : { opacity: [0.26, 0.38, 0.26] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />
      <motion.div
        className="pointer-events-none absolute -right-[8%] top-[12%] z-0 h-[min(40vw,260px)] w-[min(40vw,260px)] rounded-full bg-orange-600/[0.06] blur-[56px] md:right-[4%]"
        aria-hidden
        animate={reduceMotion ? undefined : { opacity: [0.2, 0.34, 0.2] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  )
}
