'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type HeroFloatingCardTier = 'all' | 'sm' | 'md' | 'lg'

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
  /** Direção do slide na entrada (mais orgânico ao redor da foto). */
  slideFrom?: 'left' | 'right' | 'none'
  /** Hero escuro: vidro mais contrastado e sombra com profundidade. */
  onDarkSurface?: boolean
  /**
   * Hero da landing: glow laranja/ciano, micro-rotação e hover “painel ao vivo”.
   * Não usar em login/outros contextos.
   */
  premiumHero?: boolean
}

const tierVisibility: Record<HeroFloatingCardTier, string> = {
  all: '',
  sm: 'hidden sm:block',
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
  slideFrom = 'none',
  onDarkSurface = false,
  premiumHero = false,
}: LandingHeroFloatingCardProps) {
  const reduceMotion = useReducedMotion() === true

  const slideX = slideFrom === 'left' ? -18 : slideFrom === 'right' ? 18 : 0

  const floatAnimate = reduceMotion
    ? false
    : premiumHero
      ? {
          y: [0, -floatRange, 0],
          rotate: [0, 0.55, 0, -0.45, 0],
        }
      : { y: [0, -floatRange, 0] }

  const floatTransition = reduceMotion
    ? undefined
    : premiumHero
      ? {
          y: {
            duration: floatDuration,
            repeat: Infinity,
            ease: 'easeInOut' as const,
            delay: delay + 0.5,
          },
          rotate: {
            duration: floatDuration * 1.35,
            repeat: Infinity,
            ease: 'easeInOut' as const,
            delay: delay + 0.5,
          },
        }
      : {
          duration: floatDuration,
          repeat: Infinity,
          ease: 'easeInOut' as const,
          delay: delay + 0.5,
        }

  return (
    <div className={cn('absolute z-20', tierVisibility[tier], className)}>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: premiumHero ? 26 : 22, x: slideX }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{
          duration: reduceMotion ? 0 : premiumHero ? 0.64 : 0.58,
          delay: reduceMotion ? 0 : delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <motion.div
          animate={floatAnimate}
          transition={floatTransition}
          className="pointer-events-none md:pointer-events-auto"
        >
          <div
            className={cn(
              'group/card max-w-[9.65rem] rounded-xl border px-2.5 py-2 backdrop-blur-[12px] sm:max-w-[11.25rem] sm:px-3.5 sm:py-3',
              onDarkSurface
                ? 'border-zinc-200/90 bg-white/[0.94] shadow-[0_20px_48px_-16px_rgba(0,0,0,0.55)] ring-1 ring-zinc-950/[0.06]'
                : 'border-white/55 bg-white/72 shadow-[0_14px_36px_-12px_rgba(15,23,42,0.18)] ring-1 ring-zinc-950/[0.05]',
              !onDarkSurface &&
                'dark:border-white/[0.14] dark:bg-zinc-950/58 dark:shadow-[0_18px_44px_-14px_rgba(0,0,0,0.55)] dark:ring-white/[0.06]',
              premiumHero &&
                onDarkSurface &&
                'shadow-[0_22px_50px_-14px_rgba(0,0,0,0.5),0_0_40px_-10px_rgba(249,115,22,0.18),0_0_28px_-12px_rgba(34,211,238,0.1)] ring-white/10',
              'md:transition-[transform,box-shadow,border-color,ring-color] md:duration-300 md:ease-[cubic-bezier(0.22,1,0.36,1)]',
              onDarkSurface
                ? premiumHero
                  ? 'md:hover:scale-[1.035] md:hover:border-primary/35 md:hover:shadow-[0_28px_64px_-12px_rgba(0,0,0,0.48),0_0_52px_-8px_rgba(249,115,22,0.28),0_0_40px_-14px_rgba(34,211,238,0.14)] md:hover:ring-primary/25'
                  : 'md:hover:scale-[1.025] md:hover:border-cyan-200/25 md:hover:shadow-[0_28px_60px_-14px_rgba(0,0,0,0.52),0_0_48px_-12px_rgba(34,211,238,0.12)] md:hover:ring-cyan-400/15'
                : 'md:hover:scale-[1.025] md:hover:shadow-[0_22px_48px_-14px_rgba(15,23,42,0.22)] dark:md:hover:shadow-[0_22px_48px_-14px_rgba(0,0,0,0.65)]',
            )}
          >
            <div className="flex items-start gap-2.5">
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:group-hover/card:scale-110 md:group-hover/card:-rotate-6',
                  onDarkSurface
                    ? premiumHero
                      ? 'bg-gradient-to-br from-primary/20 to-cyan-500/15 text-orange-900 ring-primary/35'
                      : 'bg-cyan-500/15 text-cyan-800 ring-cyan-600/30'
                    : cn(
                        'bg-cyan-500/12 text-cyan-700 ring-cyan-500/20',
                        'dark:bg-cyan-400/12 dark:text-cyan-300 dark:ring-cyan-400/25',
                      ),
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <p
                  className={cn(
                    'text-[11px] font-semibold leading-tight tracking-tight sm:text-xs',
                    onDarkSurface ? 'text-zinc-900' : 'text-zinc-950 dark:text-white',
                  )}
                >
                  {title}
                </p>
                {subtitle ? (
                  <p
                    className={cn(
                      'mt-0.5 text-[10px] leading-snug sm:text-[11px]',
                      onDarkSurface ? 'text-zinc-600' : 'text-zinc-600 dark:text-zinc-400',
                    )}
                  >
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
