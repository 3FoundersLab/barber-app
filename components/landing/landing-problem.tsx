'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Banknote, CalendarX, UsersRound } from 'lucide-react'
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

const pains = [
  {
    icon: CalendarX,
    title: 'Agenda espalhada: papel, Zap e direct',
    text: 'Cliente marcou no Instagram, outro no grupo, um terceiro ligou. Na sexta, a grade tá furada e ninguém sabe quem falta.',
  },
  {
    icon: UsersRound,
    title: 'Cadeira vazia no melhor horário',
    text: 'Desmarcação em cima da hora vira buraco no caixa. Sem visão única da fila, a equipe pisa nos mesmos horários.',
  },
  {
    icon: Banknote,
    title: 'Caixa “na cabeça” no fim do dia',
    text: 'Pix do corte, dinheiro do combo e mensalista misturados. Você fecha cansado e ainda duvida: deu lucro ou só movimento?',
  },
]

export function LandingProblem() {
  const reduceMotion = useReducedMotion() === true

  return (
    <section
      id={LANDING_SECTIONS.problema}
      className={cn(
        'scroll-mt-24 border-b border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950',
        landingSectionY,
      )}
      aria-labelledby="landing-problema-heading"
    >
      <div className={landingContainer}>
        <LandingFadeIn className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Atenção · o que dói hoje</p>
          <h2 id="landing-problema-heading" className={landingSectionTitle}>
            Sua barbearia merece mais do que agenda no improviso
          </h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Sem um <strong className="font-semibold text-zinc-800 dark:text-zinc-200">sistema de gestão para barbearia</strong>,
            o caos vira rotina: cliente some, horário duplica e o dinheiro do dia não fecha redondo.
          </p>
        </LandingFadeIn>

        <p className="mt-16 text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Três cenários que custam caro, de segunda a sábado
        </p>
        <motion.ul
          className="mx-auto mt-8 flex max-w-3xl flex-col gap-5"
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={LANDING_VIEWPORT}
        >
          {pains.map(({ icon: Icon, title, text }) => (
            <motion.li
              key={title}
              variants={staggerItem}
              className={cn(
                landingCardClass(true),
                'flex gap-5 p-6 sm:p-7',
                'hover:border-zinc-300/80 dark:hover:border-zinc-600',
              )}
            >
              <LandingIconLift className="flex shrink-0">
                <span className="flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  <Icon className="size-5" aria-hidden />
                </span>
              </LandingIconLift>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-base font-semibold text-zinc-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
