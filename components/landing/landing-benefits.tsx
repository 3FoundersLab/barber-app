'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Clock, LayoutGrid, TrendingUp, Wallet, type LucideIcon } from 'lucide-react'
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

type Item = { icon: LucideIcon; title: string; description: string }

const items: Item[] = [
  {
    icon: TrendingUp,
    title: 'Mais cadeira cheia, menos buraco na agenda',
    description: 'Lembretes e visão da fila ajudam o cliente a voltar. Menos “sumiu”, mais corte e gorjeta no fechamento.',
  },
  {
    icon: LayoutGrid,
    title: 'Uma grade só para a equipe inteira',
    description:
      'Acabou o conflito de horário. Dono e barbeiro enxergam o mesmo agendamento, em tempo real.',
  },
  {
    icon: Wallet,
    title: 'Caixa do dia que você confia',
    description: 'Corte, barba, Pix e mensalista separados. Você sabe o que entrou e onde está o pico da semana.',
  },
  {
    icon: Clock,
    title: 'Menos tela, mais tesoura na mão',
    description: 'Menos interrupção no meio do corte. O sistema cuida da rotina; você cuida do cliente.',
  },
]

export function LandingBenefits() {
  const reduceMotion = useReducedMotion() === true

  return (
    <section
      id={LANDING_SECTIONS.beneficios}
      className={cn(
        'scroll-mt-24 border-b border-zinc-200/80 bg-[#f4f4f5] dark:border-zinc-800 dark:bg-zinc-900/50',
        landingSectionY,
      )}
      aria-labelledby="landing-beneficios-heading"
    >
      <div className={landingContainer}>
        <LandingFadeIn className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Desejo · benefícios reais</p>
          <h2 id="landing-beneficios-heading" className={landingSectionTitle}>
            Por que donos de barbearia trocam planilha por software
          </h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Benefícios que aparecem no sábado cheio: mais previsibilidade na{' '}
            <strong className="font-semibold text-zinc-800 dark:text-zinc-200">gestão de barbearia</strong>, menos atrito
            na equipe e caixa mais transparente.
          </p>
        </LandingFadeIn>
        <motion.ul
          className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={LANDING_VIEWPORT}
        >
          {items.map(({ icon: Icon, title, description }) => (
            <motion.li
              key={title}
              variants={staggerItem}
              className={cn(
                landingCardClass(true),
                'group flex flex-col p-7 sm:p-8',
                'hover:border-amber-200/80 dark:hover:border-amber-500/25',
              )}
            >
              <LandingIconLift className="mb-6 inline-flex w-fit">
                <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/12 to-orange-500/8 text-amber-700 transition-[box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:shadow-md dark:text-amber-400">
                  <Icon className="size-6" aria-hidden />
                </span>
              </LandingIconLift>
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
