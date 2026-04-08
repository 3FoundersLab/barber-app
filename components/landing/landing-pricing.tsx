'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LANDING_CTA, LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import {
  landingButtonLift,
  landingCardClass,
  landingContainer,
  landingEyebrow,
  landingPrimaryCtaClass,
  landingTrialCtaClass,
  landingSectionLead,
  landingSectionTitle,
  landingSectionY,
} from '@/components/landing/landing-classes'
import { LandingFadeIn } from '@/components/landing/landing-reveal'
import { LANDING_VIEWPORT, staggerContainer, staggerItem } from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

type Tier = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  highlighted?: boolean
  cta: string
  href: string
}

const tiers: Tier[] = [
  {
    name: 'Essencial',
    price: 'R$ 79',
    period: '/mês',
    description: 'Bancada pequena, mas organizada: você e mais um na tesoura, sem bagunça na grade.',
    features: [
      'Até 2 barbeiros na chapa',
      'Marcação à vontade — corte, barba, combo',
      'Ficha do cliente guardada',
      'Dúvida? Chama a gente no e-mail',
    ],
    cta: LANDING_CTA.primary,
    href: LANDING_LINKS.cadastro,
  },
  {
    name: 'Profissional',
    price: 'R$ 149',
    period: '/mês',
    description: 'Turma grande, sábado lotado: você vê o movimento e o caixa sem adivinhar.',
    features: [
      'Até 8 barbeiros na mesma barbearia',
      'Fechamento do dia na cara',
      'Mensalista e cobrança no eixo',
      'Puxa relatório quando precisar fechar mês',
      'Suporte na frente da fila',
    ],
    highlighted: true,
    cta: LANDING_CTA.trial,
    href: LANDING_LINKS.cadastro,
  },
  {
    name: 'Empresarial',
    price: 'Sob consulta',
    period: '',
    description: 'Rede, franquia ou várias bancadas: a gente encaixa no seu jeito de tocar negócio.',
    features: [
      'Barbeiros sem teto',
      'Mais de uma unidade',
      'Conversa com o que você já usa',
      'Alguém dedicado só pra você',
    ],
    cta: 'Falar com a gente',
    href: 'mailto:contato@barberapp.com.br?subject=Plano%20Empresarial%20BarberApp',
  },
]

export function LandingPricing() {
  const reduceMotion = useReducedMotion() === true

  return (
    <section
      id={LANDING_SECTIONS.planos}
      className={cn(
        'scroll-mt-24 border-t border-zinc-200/80 bg-[#f4f4f5] dark:border-zinc-800 dark:bg-zinc-900/50',
        landingSectionY,
      )}
    >
      <div className={landingContainer}>
        <LandingFadeIn className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Mensalidade</p>
          <h2 className={landingSectionTitle}>Paga pelo tamanho da sua bancada</h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Valores de exemplo — no cadastro você escolhe o pacote certo. Sem letras miúdas escondidas na fatura.
          </p>
        </LandingFadeIn>
        <motion.div
          className="mt-20 grid gap-8 lg:grid-cols-3 lg:gap-6 xl:gap-8"
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={LANDING_VIEWPORT}
        >
          {tiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={staggerItem}
              className={cn(
                landingCardClass(true),
                'relative flex flex-col p-8 sm:p-9',
                tier.highlighted &&
                  'border-amber-400/90 shadow-md ring-2 ring-amber-500/25 dark:border-amber-500/40 dark:ring-amber-500/20',
              )}
            >
              {tier.highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-1 text-xs font-semibold text-white shadow-md">
                  Recomendado
                </span>
              ) : null}
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">{tier.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{tier.description}</p>
              <p className="mt-8 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-zinc-950 tabular-nums dark:text-white">
                  {tier.price}
                </span>
                {tier.period ? (
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{tier.period}</span>
                ) : null}
              </p>
              <ul className="mt-8 flex flex-1 flex-col gap-3.5 text-sm text-zinc-700 dark:text-zinc-300">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    <span className="leading-snug">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={tier.name === 'Empresarial' ? 'outline' : 'ghost'}
                className={cn(
                  'mt-10 h-12 w-full text-sm font-bold',
                  landingButtonLift,
                  tier.name === 'Essencial' && landingPrimaryCtaClass,
                  tier.name === 'Profissional' && landingTrialCtaClass,
                  tier.name === 'Empresarial' &&
                    'rounded-full border-2 border-zinc-400 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900',
                )}
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </motion.div>
        <LandingFadeIn delay={0.12} className="mt-12 text-center">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {LANDING_CTA.urgency} · {LANDING_CTA.urgencyBanner}
          </p>
        </LandingFadeIn>
      </div>
    </section>
  )
}
