'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Banknote, CalendarCheck, PieChart, Scissors } from 'lucide-react'
import { LANDING_SECTIONS } from '@/components/landing/constants'
import {
  landingContainer,
  landingEyebrow,
  landingSectionLead,
  landingSectionTitle,
  landingSectionYCompact,
} from '@/components/landing/landing-classes'
import { LandingFadeIn, LandingIconLift } from '@/components/landing/landing-reveal'
import { LANDING_VIEWPORT, staggerContainer, staggerItem } from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

const steps = [
  {
    step: 1,
    icon: CalendarCheck,
    title: 'Cliente agenda',
    text: 'Horário na grade, com confirmação. Menos improviso no WhatsApp.',
  },
  {
    step: 2,
    icon: Scissors,
    title: 'Atendimento acontece',
    text: 'Barbeiro vê a fila, você vê o movimento da bancada em tempo real.',
  },
  {
    step: 3,
    icon: Banknote,
    title: 'Pagamento registrado',
    text: 'Pix, dinheiro ou cartão anotados na hora. Caixa do dia sempre atualizado.',
  },
  {
    step: 4,
    icon: PieChart,
    title: 'Relatórios e comissão',
    text: 'Fechamento, metas e comissões refletidas sem planilha paralela.',
  },
] as const

function HowBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-white dark:hidden" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-zinc-50/50 to-zinc-100/35 dark:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-15%,rgba(249,115,22,0.06),transparent_55%)] dark:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(24,24,27,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.06)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_20%,black,transparent)] dark:hidden"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 hidden bg-zinc-950 dark:block" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(255,255,255,0.026)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.026)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_20%,black,transparent)] dark:block"
        aria-hidden
      />
    </>
  )
}

export function LandingHowItWorks() {
  const reduceMotion = useReducedMotion() === true

  return (
    <section
      id={LANDING_SECTIONS.comoFunciona}
      className={cn(
        'relative scroll-mt-24 overflow-hidden bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white',
        landingSectionYCompact,
      )}
      aria-labelledby="landing-como-heading"
    >
      <HowBackdrop />
      <div className={`${landingContainer} relative z-10`}>
        <LandingFadeIn className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Fluxo simples</p>
          <h2 id="landing-como-heading" className={landingSectionTitle}>
            Como funciona no dia a dia
          </h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Da marcação ao fechamento: quatro passos, sem complicar a rotina da barbearia.
          </p>
        </LandingFadeIn>
        <motion.ol
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-5"
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={LANDING_VIEWPORT}
        >
          {steps.map(({ step, icon: Icon, title, text }) => (
            <motion.li
              key={step}
              variants={staggerItem}
              className={cn(
                'flex flex-col rounded-2xl border p-5 shadow-sm backdrop-blur-sm sm:p-6',
                'border-zinc-200/90 bg-white shadow-zinc-200/40 ring-1 ring-zinc-950/[0.04]',
                'dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-black/20 dark:ring-0',
              )}
            >
              <span className="mb-4 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/25">
                {step}
              </span>
              <LandingIconLift className="mb-3 flex">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 dark:bg-white/10 dark:text-white dark:ring-0">
                  <Icon className="size-6" aria-hidden />
                </span>
              </LandingIconLift>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}
