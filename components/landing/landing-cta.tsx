'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { LANDING_CTA, LANDING_LINKS } from '@/components/landing/constants'
import {
  landingButtonLift,
  landingContainer,
  landingPrimaryCtaClass,
  landingSectionYCompact,
  landingTrialCtaClass,
} from '@/components/landing/landing-classes'
import { LANDING_EASE, LANDING_VIEWPORT } from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

export function LandingCta() {
  const reduceMotion = useReducedMotion() === true

  return (
    <section
      className={cn('bg-[#f7f7f8] dark:bg-zinc-950', landingSectionYCompact)}
      aria-labelledby="landing-cta-heading"
    >
      <div className={landingContainer}>
        <motion.div
          className="relative overflow-hidden rounded-[1.75rem] border-2 border-orange-500/40 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 px-8 py-16 text-center shadow-[0_24px_48px_-12px_rgba(0,0,0,0.4)] transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-orange-400/55 hover:shadow-[0_32px_64px_-14px_rgba(0,0,0,0.5)] sm:px-12 md:py-20 lg:rounded-3xl"
          initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.99 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          viewport={LANDING_VIEWPORT}
          transition={{ duration: 0.65, ease: LANDING_EASE }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.55]"
            style={{
              backgroundImage: `radial-gradient(circle at 18% 35%, rgba(245, 158, 11, 0.5), transparent 50%),
                radial-gradient(circle at 88% 78%, rgba(234, 88, 12, 0.35), transparent 46%)`,
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300/95">{LANDING_CTA.urgencyBanner}</p>
            <h2
              id="landing-cta-heading"
              className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-[2.375rem] md:leading-[1.15]"
            >
              Bora encher a grade e fechar o dia sabendo quanto sobrou?
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-zinc-300 sm:text-lg">
              Cadastro rápido. Em minutos você já vê a barbearia como quem olha a fila da manhã com calma — horário, cliente
              e Pix no mesmo lugar.
            </p>
            <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button
                asChild
                variant="ghost"
                size="lg"
                className={cn('h-14 min-w-[220px] px-10 text-base', landingPrimaryCtaClass, landingButtonLift)}
              >
                <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.primary}</Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="lg"
                className={cn(
                  'h-14 border-white/90 bg-transparent px-8 text-base text-white hover:bg-white/15 hover:text-white dark:border-white/90',
                  landingTrialCtaClass,
                  landingButtonLift,
                )}
              >
                <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.trial}</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm font-medium text-zinc-400">{LANDING_CTA.urgency}</p>
            <Button
              asChild
              variant="link"
              className="mt-2 h-auto p-0 text-sm font-semibold text-zinc-400 underline-offset-4 transition duration-300 hover:text-white"
            >
              <Link href={LANDING_LINKS.login}>Já tenho conta — entrar</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
