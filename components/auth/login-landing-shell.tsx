'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { SuperPremiumBackdrop } from '@/components/super/super-premium-backdrop'

type LoginLandingShellProps = {
  children: ReactNode
  /**
   * `landingDark`: fundo fixo alinhado à hero da landing (#05070A, grid, glows) — uso na página de login.
   * Padrão: respeita tema global (cadastro e demais fluxos).
   */
  variant?: 'theme' | 'landingDark'
}

function LandingDarkBackdrop() {
  const reduceMotion = useReducedMotion() === true

  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[#05070A]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#05070A] via-zinc-950 to-zinc-950"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(24,24,27,0.92),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_78%_32%,rgba(6,182,212,0.1),transparent_62%),radial-gradient(ellipse_40%_35%_at_12%_72%,rgba(59,130,246,0.07),transparent_58%),radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(20,184,166,0.06),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_45%,transparent_0%,rgba(5,7,10,0.65)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_65%_at_50%_45%,black,transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#05070A] via-[#05070A]/40 to-transparent [mask-image:linear-gradient(to_top,black,transparent)]"
        aria-hidden
      />

      <motion.div
        className="pointer-events-none absolute left-1/2 top-[14%] z-0 h-[min(62vw,440px)] w-[min(62vw,440px)] -translate-x-1/2 rounded-full bg-cyan-600/[0.12] blur-[80px] md:left-[55%] md:top-[18%] md:translate-x-0 lg:h-[480px] lg:w-[480px]"
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.32, 0.48, 0.32],
                scale: [1, 1.03, 1],
              }
        }
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -left-[14%] bottom-[8%] z-0 h-[min(50vw,340px)] w-[min(50vw,340px)] rounded-full bg-sky-950/[0.35] blur-[72px] lg:left-0"
        aria-hidden
        animate={reduceMotion ? undefined : { opacity: [0.22, 0.36, 0.22] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />
      <motion.div
        className="pointer-events-none absolute -right-[10%] top-[10%] z-0 h-[min(44vw,280px)] w-[min(44vw,280px)] rounded-full bg-primary/[0.11] blur-[64px] md:right-[2%]"
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.18, 0.34, 0.18],
                scale: [1, 1.05, 1],
              }
        }
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
      <motion.div
        className="pointer-events-none absolute left-[8%] top-[48%] z-0 hidden h-[min(36vw,220px)] w-[min(36vw,220px)] rounded-full bg-primary/[0.07] blur-[56px] md:block"
        aria-hidden
        animate={reduceMotion ? undefined : { opacity: [0.15, 0.28, 0.15] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />
    </>
  )
}

/**
 * Fundo para fluxos de auth alinhados à landing / Super.
 * `variant="landingDark"` fixa o visual da hero (login BarberTool).
 */
export function LoginLandingShell({ children, variant = 'theme' }: LoginLandingShellProps) {
  const reduceMotion = useReducedMotion() === true
  const landingDark = variant === 'landingDark'

  return (
    <div
      className={cnShellRoot(landingDark)}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {landingDark ? <LandingDarkBackdrop /> : <SuperPremiumBackdrop />}
      </div>

      {!landingDark ? (
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
      ) : null}

      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  )
}

function cnShellRoot(landingDark: boolean) {
  return landingDark
    ? 'relative min-h-screen overflow-hidden bg-[#05070A] text-zinc-100 antialiased'
    : 'relative min-h-screen overflow-hidden bg-background text-foreground'
}
