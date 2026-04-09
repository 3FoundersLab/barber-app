'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LANDING_CTA, LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import {
  landingButtonLift,
  landingContainer,
  landingEyebrow,
  landingPrimaryCtaClass,
  landingSectionLead,
  landingSectionTitle,
  landingSectionYCompact,
} from '@/components/landing/landing-classes'
import { LandingFadeIn } from '@/components/landing/landing-reveal'
import { LandingPremiumCarousel, useLandingCarouselSlideActive } from '@/components/landing/landing-premium-carousel'
import { LANDING_EASE } from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

type BenefitSlide = {
  title: string
  lead: string
  bullets: string[]
  imageSrc: string
  imageAlt: string
}

const slides: BenefitSlide[] = [
  {
    title: 'Gestão completa da barbearia',
    lead: 'Uma visão só da grade, da equipe e do que falta para o dia fechar redondo — sem planilha paralela.',
    bullets: [
      'Agenda única: dono e barbeiro enxergam o mesmo horário, em tempo real.',
      'Dia organizado em segundos: quem entra, quem sai e onde ainda cabe encaixe.',
      'Menos interrupção na tesoura: rotina no sistema, atenção no cliente.',
    ],
    imageSrc:
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1100&q=82',
    imageAlt: 'Interior de barbearia moderna com cadeiras e espelhos',
  },
  {
    title: 'Controle financeiro',
    lead: 'Saiba quanto entrou e de onde veio cada real, sem abrir dez abas no domingo à noite.',
    bullets: [
      'Corte, barba, Pix e mensalista separados: você vê a origem de cada valor.',
      'Pico da semana e vales no radar: ajuste preço e meta com clareza.',
      'Fechamento do dia que você confia antes de trancar a porta.',
    ],
    imageSrc:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1100&q=82',
    imageAlt: 'Notebook com gráficos e indicadores financeiros',
  },
  {
    title: 'Agenda e equipe',
    lead: 'Grade cheia, fila clara e folga de cada barbeiro no mesmo painel — zero caos no WhatsApp.',
    bullets: [
      'Encaixe e reagendamento sem conflito: todos veem a mesma grade.',
      'Fila por profissional: cada um sabe quem é o próximo.',
      'Equipe alinhada: menos atrito na bancada, mais ritmo no atendimento.',
    ],
    imageSrc:
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1100&q=82',
    imageAlt: 'Profissional em atendimento na barbearia',
  },
  {
    title: 'Relatórios e comissões',
    lead: 'Fechamento, metas e comissões refletidas na hora — decisão com número na mão.',
    bullets: [
      'Leitura rápida do que vende, o que enche a grade e o que pode entrar em promo.',
      'Histórico que vira padrão: sazonalidade e hábito do cliente na mesma tela.',
      'Comissões e turno organizados sem planilha escondida.',
    ],
    imageSrc:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1100&q=82',
    imageAlt: 'Dashboard com métricas e gráficos de desempenho',
  },
]

function BenefitsBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-white dark:hidden" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-50/90 via-white to-white dark:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_75%_at_50%_-18%,rgba(234,88,12,0.07),transparent_58%)] dark:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_42%_50%_at_0%_50%,rgba(6,182,212,0.06),transparent_65%),radial-gradient(ellipse_42%_50%_at_100%_50%,rgba(6,182,212,0.05),transparent_65%)] dark:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(24,24,27,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.055)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_72%_62%_at_50%_42%,black,transparent)] dark:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-zinc-100/80 via-transparent to-transparent [mask-image:linear-gradient(to_top,black,transparent)] dark:hidden"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 hidden bg-zinc-950 dark:block" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 dark:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(24,24,27,0.9),transparent_55%)] dark:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_42%_50%_at_0%_50%,rgba(6,182,212,0.09),transparent_65%),radial-gradient(ellipse_42%_50%_at_100%_50%,rgba(6,182,212,0.08),transparent_65%)] dark:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_72%_62%_at_50%_42%,black,transparent)] dark:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-32 bg-gradient-to-t from-zinc-950/85 via-transparent to-transparent [mask-image:linear-gradient(to_top,black,transparent)] dark:block"
        aria-hidden
      />
    </>
  )
}

function BenefitSlidePanel({ slideIndex, slide }: { slideIndex: number; slide: BenefitSlide }) {
  const active = useLandingCarouselSlideActive(slideIndex)
  const reduceMotion = useReducedMotion() === true
  const [enterSeq, setEnterSeq] = useState(0)
  const prevActive = useRef<boolean | null>(null)

  useEffect(() => {
    if (active) {
      const shouldAnimate = prevActive.current === false || prevActive.current === null
      if (shouldAnimate) {
        setEnterSeq((n) => n + 1)
      }
      prevActive.current = true
    } else {
      prevActive.current = false
    }
  }, [active])

  return (
    <div className="mx-auto w-full max-w-5xl px-1 pb-1 sm:px-2 md:px-4">
      <motion.div
        key={enterSeq}
        className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-10 lg:gap-14"
        initial={reduceMotion ? false : { opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: LANDING_EASE }}
      >
        <div className="relative order-1 w-full overflow-hidden rounded-2xl shadow-lg shadow-zinc-900/10 ring-1 ring-zinc-200/90 dark:shadow-[0_28px_64px_-24px_rgba(0,0,0,0.75)] dark:ring-white/[0.08]">
          <div className="relative aspect-[4/3] w-full sm:aspect-[5/4] md:aspect-[4/3]">
            <Image
              src={slide.imageSrc}
              alt={slide.imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={slideIndex === 0}
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/25 via-transparent to-transparent dark:from-zinc-950/50"
              aria-hidden
            />
          </div>
        </div>

        <div className="order-2 flex min-w-0 flex-col text-left">
          <h3 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-[1.65rem] sm:leading-snug dark:text-white">
            {slide.title}
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400">{slide.lead}</p>
          <ul className="mt-6 flex flex-col gap-3.5">
            {slide.bullets.map((line) => (
              <li
                key={line}
                className="flex gap-3 text-sm leading-snug text-zinc-700 sm:text-[0.9375rem] dark:text-zinc-300"
              >
                <Check
                  className="mt-0.5 size-5 shrink-0 text-cyan-600 dark:text-cyan-400/95"
                  strokeWidth={2.25}
                  aria-hidden
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  )
}

export function LandingBenefits() {
  return (
    <section
      id={LANDING_SECTIONS.beneficios}
      className={cn(
        'relative scroll-mt-24 overflow-hidden bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white',
        landingSectionYCompact,
      )}
      aria-labelledby="landing-beneficios-heading"
    >
      <BenefitsBackdrop />

      <div className={`${landingContainer} relative z-10`}>
        <LandingFadeIn className="mx-auto max-w-2xl text-center">
          <p className={cn(landingEyebrow, 'tracking-[0.2em]')}>Benefícios: resultado na bancada</p>
          <h2 id="landing-beneficios-heading" className={landingSectionTitle}>
            Benefícios e soluções para sua barbearia crescer
          </h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Cada slide mostra um pilar do BarberTool — navegue e veja o que muda no chão da operação.
          </p>
        </LandingFadeIn>

        <div className="mt-10 sm:mt-12 lg:mt-14">
          <LandingPremiumCarousel
            loop
            scrollDuration={42}
            labelledBy="landing-beneficios-heading"
          >
            {slides.map((slide, i) => (
              <BenefitSlidePanel key={slide.title} slideIndex={i} slide={slide} />
            ))}
          </LandingPremiumCarousel>
        </div>

        <LandingFadeIn delay={0.08} className="mt-10 flex justify-center sm:mt-12">
          <Button
            asChild
            variant="ghost"
            className={cn(
              landingPrimaryCtaClass,
              landingButtonLift,
              'h-12 min-w-[min(100%,280px)] px-10 text-sm font-bold sm:h-14 sm:px-12 sm:text-base',
            )}
          >
            <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.primary}</Link>
          </Button>
        </LandingFadeIn>
      </div>
    </section>
  )
}
