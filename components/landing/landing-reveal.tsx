'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { LANDING_EASE, LANDING_VIEWPORT, fadeUpHidden, fadeUpVisible } from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

type LandingFadeInProps = {
  children: React.ReactNode
  className?: string
  delay?: number
}

/** Fade + translateY ao entrar no viewport (seções). */
export function LandingFadeIn({ children, className, delay = 0 }: LandingFadeInProps) {
  const reduceMotion = useReducedMotion() === true

  return (
    <motion.div
      className={cn(className)}
      initial={reduceMotion ? false : fadeUpHidden}
      whileInView={
        reduceMotion
          ? undefined
          : {
              ...fadeUpVisible,
              transition: { duration: 0.58, delay, ease: LANDING_EASE },
            }
      }
      viewport={LANDING_VIEWPORT}
    >
      {children}
    </motion.div>
  )
}

type LandingIconLiftProps = {
  children: React.ReactNode
  className?: string
}

/** Microinteração no ícone — hover só se não for reduced motion. */
export function LandingIconLift({ children, className }: LandingIconLiftProps) {
  const reduceMotion = useReducedMotion() === true

  return (
    <motion.span
      className={className}
      whileHover={reduceMotion ? undefined : { scale: 1.06, rotate: -1 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 460, damping: 26 }}
    >
      {children}
    </motion.span>
  )
}
