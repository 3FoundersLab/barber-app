'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Banknote, CalendarX, UsersRound } from 'lucide-react'
import { LANDING_SECTIONS } from '@/components/landing/constants'
import {
  landingCardClass,
  landingContainer,
  landingEyebrow,
  landingPanelGlowHover,
  landingSectionLead,
  landingSectionTitle,
  landingSectionY,
} from '@/components/landing/landing-classes'
import { LandingFadeIn, LandingIconLift } from '@/components/landing/landing-reveal'
import { LANDING_EASE, LANDING_VIEWPORT, staggerContainer, staggerItem } from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

const pains = [
  {
    icon: CalendarX,
    title: 'Agenda no papel e no Zap',
    text: 'Cliente marcou no direct, outro ligou, um terceiro mandou áudio. Quando vira sexta, a grade tá furada e você nem sabe quem falta.',
  },
  {
    icon: UsersRound,
    title: 'Cadeira fria no melhor horário',
    text: 'Deu bolo, faltou ou desmarcou em cima da hora. Cada buraco é corte que não entrou no caixa — e ninguém soma isso no fim do mês.',
  },
  {
    icon: Banknote,
    title: 'Caixa misturado com barba',
    text: 'Pix do corte, dinheiro do combo, mensalista e produto tudo no mesmo bolso mental. Fecha o dia e ainda fica na dúvida: deu lucro ou só movimento?',
  },
]

const outcomes = [
  'Grade da turma inteira na tela: quem tá com cliente, quem tem buraco, quem pode encaixe.',
  'Ficha do cliente na mão — último corte, o que ele gosta, quando costuma voltar.',
  'Abriu o celular: já sabe o que entrou hoje, o que é assinatura e o que ainda tá pra cobrar.',
]

export function LandingProblemSolution() {
  const reduceMotion = useReducedMotion() === true

  return (
    <section
      id={LANDING_SECTIONS.desafios}
      className={cn('scroll-mt-24 border-b border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950', landingSectionY)}
    >
      <div className={landingContainer}>
        <LandingFadeIn className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Já rolou contigo?</p>
          <h2 className={landingSectionTitle}>Cadeira vazia não paga aluguel</h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Quando a barbearia vive no improviso, o cliente some, a equipe briga por horário e você fecha o dia cansado —
            sem saber se o bolso agradeceu.
          </p>
        </LandingFadeIn>

        <div className="mt-20 grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-12 xl:gap-16">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Cena de segunda a sábado</p>
            <motion.ul
              className="flex flex-col gap-5"
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

          <motion.div
            className={cn(
              'flex flex-col justify-center rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-500/[0.08] via-white to-orange-500/[0.06] p-8 shadow-sm ring-1 ring-amber-500/[0.08] dark:border-amber-500/20 dark:from-amber-500/[0.12] dark:via-zinc-950 dark:to-orange-500/[0.06] dark:ring-amber-500/10 sm:p-10 lg:p-11',
              landingPanelGlowHover,
            )}
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={LANDING_VIEWPORT}
            transition={{ duration: 0.62, ease: LANDING_EASE, delay: 0.08 }}
          >
            <p className={landingEyebrow}>Com BarberApp na bancada</p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-[1.65rem] sm:leading-snug">
              Você volta a mandar na grade — sem virar refém de planilha nem de print no grupo
            </h3>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Um painel que fala a mesma língua da sua barbearia: quem sentou, quem vai sentar e quanto isso virou
              dinheiro no fim do dia.
            </p>
            <motion.ul
              className="mt-10 flex flex-col gap-4"
              variants={staggerContainer}
              initial={reduceMotion ? 'visible' : 'hidden'}
              whileInView={reduceMotion ? undefined : 'visible'}
              viewport={LANDING_VIEWPORT}
            >
              {outcomes.map((line) => (
                <motion.li
                  key={line}
                  variants={staggerItem}
                  className="flex gap-3.5 text-sm font-medium leading-snug text-zinc-800 dark:text-zinc-200"
                >
                  <span className="mt-1.5 flex size-2 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden />
                  {line}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
