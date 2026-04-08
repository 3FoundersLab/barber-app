'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import { Button } from '@/components/ui/button'
import {
  landingButtonLift,
  landingContainer,
  landingEyebrow,
  landingPanelGlowHover,
  landingPrimaryCtaClass,
  landingSectionLead,
  landingSectionTitle,
  landingSectionY,
} from '@/components/landing/landing-classes'
import { LandingFadeIn } from '@/components/landing/landing-reveal'
import { LANDING_EASE, LANDING_VIEWPORT, staggerContainer, staggerItem } from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

const outcomes = [
  'Uma grade só: quem tá com cliente, quem tem buraco e onde dá encaixe.',
  'Ficha do cliente na mão: histórico, preferências e frequência.',
  'Pix, dinheiro e mensalista separados. Você sabe o que entrou no dia.',
]

export function LandingSolution() {
  const reduceMotion = useReducedMotion() === true

  return (
    <section
      id={LANDING_SECTIONS.solucao}
      className={cn(
        'scroll-mt-24 border-b border-zinc-200/80 bg-[#f7f7f8] dark:border-zinc-800 dark:bg-zinc-950',
        landingSectionY,
      )}
      aria-labelledby="landing-solucao-heading"
    >
      <div className={landingContainer}>
        <LandingFadeIn className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Interesse: a resposta</p>
          <h2 id="landing-solucao-heading" className={landingSectionTitle}>
            BarberApp: software para barbearia com agenda e caixa no mesmo lugar
          </h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Pare de remendar com planilha e print. Um painel pensado para{' '}
            <strong className="font-semibold text-zinc-800 dark:text-zinc-200">agendamento de barbearia</strong> e rotina
            real da bancada.
          </p>
        </LandingFadeIn>

        <motion.div
          className={cn(
            'mx-auto mt-16 max-w-2xl rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-500/[0.08] via-white to-orange-500/[0.06] p-8 shadow-sm ring-1 ring-amber-500/[0.08] dark:border-amber-500/20 dark:from-amber-500/[0.12] dark:via-zinc-950 dark:to-orange-500/[0.06] dark:ring-amber-500/10 sm:p-10 lg:p-11',
            landingPanelGlowHover,
          )}
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={LANDING_VIEWPORT}
          transition={{ duration: 0.62, ease: LANDING_EASE, delay: 0.06 }}
        >
          <p className={landingEyebrow}>Desejo: o que muda na prática</p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-[1.65rem] sm:leading-snug">
            Você volta a mandar na grade, com clareza e sem depender do grupo do Zap
          </h3>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Tudo que importa para dono e barbeiro (horário, cliente e fechamento do dia), sem jargão de escritório.
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
                <span
                  className="mt-1.5 flex size-2 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400"
                  aria-hidden
                />
                {line}
              </motion.li>
            ))}
          </motion.ul>
          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              variant="ghost"
              size="lg"
              className={cn('h-12 px-8 text-sm font-bold sm:text-base', landingPrimaryCtaClass, landingButtonLift)}
            >
              <Link href={LANDING_LINKS.cadastro}>Quero ver na minha barbearia</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className={cn('h-12 border-2 font-bold', landingButtonLift)}>
              <Link href={`#${LANDING_SECTIONS.funcionalidades}`}>Ver funcionalidades</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
