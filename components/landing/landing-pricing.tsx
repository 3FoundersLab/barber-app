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
  landingSectionYCompact,
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

function PlanosBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-zinc-950" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(24,24,27,0.9),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_42%_50%_at_0%_50%,rgba(6,182,212,0.09),transparent_65%),radial-gradient(ellipse_42%_50%_at_100%_50%,rgba(6,182,212,0.08),transparent_65%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_72%_62%_at_50%_42%,black,transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950/85 via-transparent to-transparent [mask-image:linear-gradient(to_top,black,transparent)]"
        aria-hidden
      />
    </>
  )
}

const tiers: Tier[] = [
  {
    name: 'Essencial',
    price: 'R$ 79',
    period: '/mês',
    description: 'Bancada pequena, mas organizada: você e mais um na tesoura, sem bagunça na grade.',
    features: [
      'Até 2 barbeiros na chapa',
      'Marcação à vontade: corte, barba, combo',
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
    href: 'mailto:contato@barbertool.com.br?subject=Plano%20Empresarial%20BarberTool',
  },
]

export function LandingPricing() {
  const reduceMotion = useReducedMotion() === true

  return (
    <section
      id={LANDING_SECTIONS.planos}
      className={cn(
        'dark relative scroll-mt-24 overflow-hidden border-t border-zinc-800/90',
        landingSectionYCompact,
      )}
      aria-labelledby="landing-planos-heading"
    >
      <PlanosBackdrop />
      <div className={`${landingContainer} relative z-10`}>
        <LandingFadeIn className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Investimento: planos</p>
          <h2 id="landing-planos-heading" className={cn(landingSectionTitle, 'text-white')}>
            Planos que acompanham o tamanho da sua bancada
          </h2>
          <p className={cn(landingSectionLead, 'mx-auto text-zinc-400')}>
            Preços transparentes. No cadastro você confirma o pacote ideal para sua{' '}
            <strong className="font-semibold text-zinc-200">barbearia</strong>, sem surpresa na fatura.
          </p>
        </LandingFadeIn>
        <motion.div
          className="mt-10 grid gap-6 lg:grid-cols-3 lg:gap-6 xl:gap-8"
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
                'border-zinc-800 bg-zinc-900/50 ring-1 ring-white/[0.06]',
                'hover:border-zinc-600 hover:shadow-black/30 dark:hover:shadow-black/40',
                tier.highlighted &&
                  cn(
                    'z-[1] border-2 border-primary bg-zinc-900/65',
                    'shadow-[0_20px_56px_-12px_rgba(249,115,22,0.35),0_0_0_1px_rgba(249,115,22,0.15)]',
                    'ring-2 ring-primary/45 ring-offset-2 ring-offset-zinc-950',
                    'hover:border-primary hover:shadow-[0_24px_60px_-10px_rgba(249,115,22,0.4)]',
                  ),
              )}
            >
              {tier.highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3.5 py-1 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25">
                  Recomendado
                </span>
              ) : null}
              <h3 className="text-lg font-semibold text-white">{tier.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{tier.description}</p>
              <p className="mt-8 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-white tabular-nums">{tier.price}</span>
                {tier.period ? (
                  <span className="text-sm font-medium text-zinc-400">{tier.period}</span>
                ) : null}
              </p>
              <ul className="mt-8 flex flex-1 flex-col gap-3.5 text-sm text-zinc-300">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 size-5 shrink-0 text-emerald-400" aria-hidden />
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
                    'rounded-full border-2 border-zinc-500 bg-zinc-950 text-white shadow-sm hover:border-zinc-400 hover:bg-zinc-900',
                )}
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </motion.div>
        <LandingFadeIn delay={0.12} className="mt-8 text-center">
          <p className="text-sm font-medium text-zinc-400">
            {LANDING_CTA.urgency}{' '}
            <span className="text-primary">{LANDING_CTA.urgencyBanner}</span>
          </p>
        </LandingFadeIn>
      </div>
    </section>
  )
}
