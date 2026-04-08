'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { CalendarRange, CreditCard, Users, Wallet } from 'lucide-react'
import { LANDING_SECTIONS } from '@/components/landing/constants'
import {
  landingCardClass,
  landingContainer,
  landingEyebrow,
  landingSectionLead,
  landingSectionTitle,
  landingSectionY,
} from '@/components/landing/landing-classes'
import { LandingFadeIn, LandingIconLift } from '@/components/landing/landing-reveal'
import { LANDING_VIEWPORT, staggerContainer, staggerItem } from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

const cards = [
  {
    icon: CalendarRange,
    title: 'Grade firme, buraco à mostra',
    description: 'Marca, remarca, encaixe e vê quem tá livre. Menos buraco no meio do dia cheio.',
  },
  {
    icon: Wallet,
    title: 'Dinheiro do dia separado direitinho',
    description: 'Corte, barba, combo, Pix e mensalista cada um no seu canto. Fecha o dia sabendo o que ficou.',
  },
  {
    icon: Users,
    title: 'Cliente com nome e história',
    description: 'Quem gosta de pezinho baixo, quem só vem de mês em mês. Atende melhor sem perguntar de novo.',
  },
  {
    icon: CreditCard,
    title: 'Mensalista no eixo',
    description: 'Quem paga fixo mês a mês fica sob controle. Você projeta o caixa antes do pagamento dos meninos.',
  },
]

export function LandingFeatures() {
  const reduceMotion = useReducedMotion() === true

  return (
    <section
      id={LANDING_SECTIONS.funcionalidades}
      className={cn('scroll-mt-24 bg-white dark:bg-zinc-950', landingSectionY)}
      aria-labelledby="landing-funcionalidades-heading"
    >
      <div className={landingContainer}>
        <LandingFadeIn className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Funcionalidades · o que o sistema faz</p>
          <h2 id="landing-funcionalidades-heading" className={landingSectionTitle}>
            Agendamento, clientes, caixa e mensalista, tudo integrado
          </h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            O essencial do <strong className="font-semibold text-zinc-800 dark:text-zinc-200">agendamento online para
            barbearia</strong> e da operação diária, sem telas inúteis. Quatro pilares que você usa todo dia.
          </p>
        </LandingFadeIn>
        <motion.ul
          className="mt-20 grid gap-6 sm:grid-cols-2 lg:gap-8"
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={LANDING_VIEWPORT}
        >
          {cards.map(({ icon: Icon, title, description }) => (
            <motion.li
              key={title}
              variants={staggerItem}
              className={cn(
                landingCardClass(true),
                'group flex gap-6 p-7 sm:gap-7 sm:p-9',
                'hover:border-amber-200/70 dark:hover:border-amber-500/20',
              )}
            >
              <LandingIconLift className="flex shrink-0">
                <span className="flex size-12 items-center justify-center rounded-xl bg-amber-500/[0.12] text-amber-700 transition-[box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:shadow-md dark:bg-amber-500/15 dark:text-amber-400">
                  <Icon className="size-6" aria-hidden />
                </span>
              </LandingIconLift>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-[0.9375rem] dark:text-zinc-400">
                  {description}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
