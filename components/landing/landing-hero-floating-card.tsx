'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type HeroFloatingCardTier = 'all' | 'md' | 'lg'

export type LandingHeroFloatingCardProps = {
  icon: LucideIcon
  title: string
  subtitle?: string
  className?: string
  delay?: number
  /** Duração do ciclo de flutuação vertical (segundos). */
  floatDuration?: number
  /** Amplitude da flutuação em px. */
  floatRange?: number
  tier?: HeroFloatingCardTier
}

const tierVisibility: Record<HeroFloatingCardTier, string> = {
  all: '',
  md: 'hidden md:block',
  lg: 'hidden lg:block',
}

export function LandingHeroFloatingCard({
  icon: Icon,
  title,
  subtitle,
  className,
  delay = 0,
  floatDuration = 5.5,
  floatRange = 5,
  tier = 'all',
}: LandingHeroFloatingCardProps) {
  const reduceMotion = useReducedMotion() === true

  return (
    <div className={cn('absolute z-20', tierVisibility[tier], className)}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.55,
          delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <motion.div
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [0, -floatRange, 0],
                }
          }
          transition={{
            duration: floatDuration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: delay + 0.45,
          }}
          className={cn(
            'pointer-events-none max-w-[10.75rem] rounded-xl border border-zinc-200/95 bg-white/90 px-3 py-2.5 shadow-[0_18px_40px_-14px_rgba(24,24,27,0.14)] backdrop-blur-[8px] sm:max-w-[11.5rem] sm:px-3.5 sm:py-3 md:backdrop-blur-[12px]',
            'ring-1 ring-zinc-950/[0.04]',
            'dark:border-white/[0.12] dark:bg-zinc-950/65 dark:shadow-[0_18px_40px_-14px_rgba(0,0,0,0.65)] dark:ring-cyan-400/[0.12]',
          )}
        >
          <div className="flex items-start gap-2.5">
            <span
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200/80',
                'dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-400/20',
              )}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-[11px] font-semibold leading-tight tracking-tight text-zinc-950 sm:text-xs dark:text-white">
                {title}
              </p>
              {subtitle ? (
                <p className="mt-0.5 text-[10px] leading-snug text-zinc-500 sm:text-[11px] dark:text-zinc-400">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
