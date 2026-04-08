'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { Lock, MessageCircle, Quote, RefreshCw } from 'lucide-react'
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

const stats = [
  { value: '+120', label: 'bancadas no BarberApp' },
  { value: '4,8/5', label: 'nota dos donos' },
  { value: '35%', label: 'menos horário morto' },
]

const quotes = [
  {
    name: 'Rafael M.',
    role: 'Dono, Barbearia Centro',
    text: 'Sei quanto entrou na semana só de corte e barba. Antes eu chutava no final do domingo.',
  },
  {
    name: 'Diego A.',
    role: 'Sócio, Studio Corte',
    text: 'A rapaziada da equipe adotou num dia. Meta de corte fecha mais de boa, sem Excel na madrugada.',
  },
]

const trust = [
  { icon: Lock, label: 'Teus dados fechados', sub: 'Trancado direito, sem novela' },
  { icon: MessageCircle, label: 'Suporte em português', sub: 'Fala com gente, não com robô' },
  { icon: RefreshCw, label: 'Sempre melhorando', sub: 'Atualização que você sente no sábado cheio' },
]

export function LandingSocialProof() {
  const reduceMotion = useReducedMotion() === true

  return (
    <section
      id={LANDING_SECTIONS.provaSocial}
      className={cn(
        'scroll-mt-24 border-b border-zinc-200/80 bg-[#f4f4f5] dark:border-zinc-800 dark:bg-zinc-900/50',
        landingSectionY,
      )}
      aria-labelledby="landing-prova-heading"
    >
      <div className={landingContainer}>
        <LandingFadeIn className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Prova social · autoridade</p>
          <h2 id="landing-prova-heading" className={landingSectionTitle}>
            Quem já usa BarberApp no dia a dia da bancada
          </h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Números e relatos de donos que queriam o mesmo que você:{' '}
            <strong className="font-semibold text-zinc-800 dark:text-zinc-200">controle financeiro da barbearia</strong>{' '}
            sem planilha na madrugada.
          </p>
        </LandingFadeIn>

        <div className="mt-20 grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-14 xl:gap-16">
          <div className="flex flex-col gap-10">
            <motion.div
              className="grid grid-cols-3 gap-4 lg:gap-5"
              variants={staggerContainer}
              initial={reduceMotion ? 'visible' : 'hidden'}
              whileInView={reduceMotion ? undefined : 'visible'}
              viewport={LANDING_VIEWPORT}
            >
              {stats.map(({ value, label }) => (
                <motion.div
                  key={label}
                  variants={staggerItem}
                  className={cn(landingCardClass(true), 'px-4 py-6 text-center sm:px-5 sm:py-7')}
                >
                  <p className="text-2xl font-semibold tracking-tight text-amber-700 tabular-nums dark:text-amber-400 sm:text-3xl">
                    {value}
                  </p>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:text-xs">
                    {label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
            <motion.ul
              className="grid gap-4 sm:grid-cols-3 sm:gap-4"
              variants={staggerContainer}
              initial={reduceMotion ? 'visible' : 'hidden'}
              whileInView={reduceMotion ? undefined : 'visible'}
              viewport={LANDING_VIEWPORT}
            >
              {trust.map(({ icon: Icon, label, sub }) => (
                <motion.li key={label} variants={staggerItem} className={cn(landingCardClass(true), 'flex gap-3 p-4 sm:flex-col sm:p-5')}>
                  <LandingIconLift className="mt-0.5 inline-flex shrink-0">
                    <Icon className="size-5 text-amber-600 dark:text-amber-400" aria-hidden />
                  </LandingIconLift>
                  <div>
                    <p className="text-sm font-semibold text-zinc-950 dark:text-white">{label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{sub}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </div>
          <motion.ul
            className="flex flex-col gap-5"
            variants={staggerContainer}
            initial={reduceMotion ? 'visible' : 'hidden'}
            whileInView={reduceMotion ? undefined : 'visible'}
            viewport={LANDING_VIEWPORT}
          >
            {quotes.map((q) => (
              <motion.li key={q.name} variants={staggerItem} className={cn(landingCardClass(true), 'p-7 sm:p-8')}>
                <Quote className="size-8 text-amber-500/30 dark:text-amber-500/20" aria-hidden />
                <blockquote className="mt-4 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                  &ldquo;{q.text}&rdquo;
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold text-zinc-950 dark:text-white">{q.name}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">, {q.role}</span>
                </figcaption>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </section>
  )
}
