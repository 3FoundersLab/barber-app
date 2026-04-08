'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Building2, Rocket, SlidersHorizontal } from 'lucide-react'
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

const steps = [
  {
    step: 1,
    icon: Building2,
    title: 'Coloca a barbearia no sistema',
    text: 'Nome da bancada, endereço, quem corta. Em poucos minutos você já entra como se fosse abrir a porta.',
  },
  {
    step: 2,
    icon: SlidersHorizontal,
    title: 'Ajusta serviço e horário',
    text: 'Corte, barba, tempo de cada um, folga do menino. Cada barbeiro vê a própria fila sem passar por cima do outro.',
  },
  {
    step: 3,
    icon: Rocket,
    title: 'Liga o dia e acompanha o caixa',
    text: 'Marcação, cliente e dinheiro no mesmo lugar. Do primeiro cliente da manhã ao último Pix da noite.',
  },
]

export function LandingHowItWorks() {
  const reduceMotion = useReducedMotion() === true

  return (
    <section
      id={LANDING_SECTIONS.comoFunciona}
      className={cn('scroll-mt-24 bg-white dark:bg-zinc-950', landingSectionY)}
      aria-labelledby="landing-como-heading"
    >
      <div className={landingContainer}>
        <LandingFadeIn className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Ação · como começar</p>
          <h2 id="landing-como-heading" className={landingSectionTitle}>
            Três passos para colocar a barbearia no ar
          </h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Sem curso longo. Você configura em minutos e volta para o que importa: cortar, atender e fechar o dia com
            números claros.
          </p>
        </LandingFadeIn>
        <motion.ol
          className="mt-20 grid gap-6 md:grid-cols-3 md:gap-8"
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
                landingCardClass(true),
                'flex flex-col items-center p-8 text-center sm:p-9',
                'h-full min-h-[280px]',
              )}
            >
              <span className="mb-6 flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white shadow-md shadow-amber-500/20">
                {step}
              </span>
              <LandingIconLift className="mb-5 flex">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                  <Icon className="size-7" aria-hidden />
                </span>
              </LandingIconLift>
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">{title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}
