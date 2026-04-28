'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { Banknote, CalendarPlus, Package, Percent, Sparkles, UserCheck } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import { landingButtonLift, landingContainer, landingPrimaryCtaClass } from '@/components/landing/landing-classes'
import { LandingHeroFloatingCard } from '@/components/landing/landing-hero-floating-card'
import { LANDING_EASE, heroStaggerContainer } from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

/** Foto editorial: profissional em contexto de barbearia (Unsplash). */
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=960&q=82'

const heroCopyStaggerItem = {
  hidden: { opacity: 0, y: 28, x: -14 },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    transition: { duration: 0.66, ease: LANDING_EASE },
  },
} as const

const heroCtaPrimaryClass = cn(
  landingPrimaryCtaClass,
  landingButtonLift,
  'h-14 min-h-[3.5rem] px-7 text-sm font-bold leading-tight sm:px-9 sm:text-base',
  'shadow-[0_0_32px_-6px_rgba(249,115,22,0.5)] hover:shadow-[0_0_48px_-4px_rgba(249,115,22,0.55)] hover:shadow-primary/35',
)

const heroCtaSecondaryClass = cn(
  landingButtonLift,
  'h-14 min-h-[3.5rem] rounded-full border-2 border-white/22 bg-white/[0.06] px-7 text-sm font-bold text-white shadow-sm backdrop-blur-sm sm:px-9 sm:text-base',
  'transition-[transform,box-shadow,background-color,border-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
  'hover:border-cyan-400/50 hover:bg-cyan-500/[0.12] hover:text-white hover:shadow-[0_0_36px_-10px_rgba(34,211,238,0.35)]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
)

const heroVisualReveal = {
  hidden: { opacity: 0, scale: 0.97, x: 22 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: { duration: 0.78, ease: LANDING_EASE, delay: 0.1 },
  },
} as const

export function LandingHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotionPref = useReducedMotion()
  const reduceMotion = reduceMotionPref === true

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const parallaxRaw = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 56])
  const parallaxY = useSpring(parallaxRaw, { stiffness: 88, damping: 26, mass: 0.4 })

  return (
    <section
      ref={sectionRef}
      id={LANDING_SECTIONS.top}
      className="relative scroll-mt-24 overflow-hidden bg-zinc-950 pt-[6.25rem] pb-10 text-white md:pt-28 md:pb-14 lg:pt-36 lg:pb-20"
      aria-labelledby="landing-hero-heading"
    >
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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_78%_32%,rgba(6,182,212,0.09),transparent_62%),radial-gradient(ellipse_40%_35%_at_12%_72%,rgba(59,130,246,0.06),transparent_58%),radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(20,184,166,0.05),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_45%,transparent_0%,rgba(9,9,11,0.55)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_72%_62%_at_50%_42%,black,transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent [mask-image:linear-gradient(to_top,black,transparent)]"
        aria-hidden
      />

      <motion.div
        className="pointer-events-none absolute left-1/2 top-[20%] h-[min(68vw,480px)] w-[min(68vw,480px)] -translate-x-1/2 rounded-full bg-cyan-500/[0.11] blur-[72px] md:left-[56%] md:top-[24%] md:translate-x-0 lg:h-[500px] lg:w-[500px]"
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.35, 0.48, 0.35],
                scale: [1, 1.03, 1],
              }
        }
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -left-[18%] bottom-[12%] h-[min(50vw,360px)] w-[min(50vw,360px)] rounded-full bg-teal-600/[0.07] blur-[64px] lg:left-[0%]"
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.28, 0.4, 0.28],
              }
        }
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
      />
      <motion.div
        className="pointer-events-none absolute right-[-12%] top-[8%] h-[min(42vw,280px)] w-[min(42vw,280px)] rounded-full bg-sky-600/[0.06] blur-[56px] md:right-[2%]"
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.22, 0.34, 0.22],
              }
        }
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      />
      <motion.div
        className="pointer-events-none absolute left-[-8%] top-[42%] h-[min(48vw,320px)] w-[min(48vw,320px)] rounded-full bg-primary/[0.09] blur-[80px] md:left-[2%] md:top-[38%]"
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.2, 0.38, 0.2],
                scale: [1, 1.04, 1],
              }
        }
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />

      <div
        className={`${landingContainer} relative z-10 grid items-center gap-14 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 xl:gap-20`}
      >
        {/* Coluna esquerda: headline, cascata no load */}
        <motion.div
          className="relative z-30 max-w-xl lg:max-w-none"
          variants={heroStaggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          animate={reduceMotion ? undefined : 'visible'}
        >
          <motion.p
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/[0.14] via-orange-500/[0.08] to-cyan-500/[0.1] px-4 py-1.5 text-xs font-semibold text-orange-50 shadow-[0_0_32px_-12px_rgba(249,115,22,0.45)] backdrop-blur-sm"
            variants={heroCopyStaggerItem}
          >
            <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden />
            Barbearia no controle — agenda, equipe e caixa
          </motion.p>
          <motion.h1
            id="landing-hero-heading"
            className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl sm:leading-[1.05] lg:text-[3.25rem] lg:leading-[1.03]"
            variants={heroCopyStaggerItem}
          >
            Agenda cheia, caixa organizado e equipe sob controle
          </motion.h1>
          <motion.p
            className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg"
            variants={heroCopyStaggerItem}
          >
            Pare o caos no WhatsApp e no papel. Com{' '}
            <span className="font-semibold text-zinc-100">BarberTool</span>, você centraliza agendamento, pagamentos e
            equipe — e volta a focar no atendimento.
          </motion.p>
          <motion.div
            className="mt-10 mb-7 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3"
            variants={heroCopyStaggerItem}
          >
            <Button asChild variant="ghost" size="lg" className={heroCtaPrimaryClass}>
              <Link href={LANDING_LINKS.cadastro}>Quero encher minha agenda</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className={heroCtaSecondaryClass}>
              <Link href={LANDING_LINKS.cadastro}>Testar 7 dias grátis</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Coluna direita: figura + widgets */}
        <motion.div
          className="relative z-20 mx-auto w-full max-w-[420px] md:mx-0 md:max-w-none"
          style={{ y: parallaxY }}
        >
          <div className="relative mx-auto w-full max-w-[min(100%,380px)] sm:max-w-md md:ml-auto md:mr-0 md:max-w-md lg:max-w-lg">
          <motion.div
            className="group relative w-full"
            variants={heroVisualReveal}
            initial={reduceMotion ? 'visible' : 'hidden'}
            animate={reduceMotion ? undefined : 'visible'}
          >
            {/* Glow localizado atrás da foto; apoia a composição */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 z-[5] h-[108%] w-[91%] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-gradient-to-b from-primary/[0.22] via-cyan-500/[0.14] to-indigo-950/[0.34] blur-[48px] md:blur-[58px]"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: [0.52, 0.78, 0.52],
                    }
              }
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[38%] z-[6] h-[42%] w-[58%] -translate-x-1/2 rounded-full bg-cyan-400/[0.12] blur-[36px]"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: [0.38, 0.58, 0.38],
                    }
              }
              transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[62%] z-[6] h-[28%] w-[48%] -translate-x-1/2 rounded-full bg-primary/[0.14] blur-[40px]"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: [0.25, 0.42, 0.25],
                    }
              }
              transition={{ duration: 8.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            />
            <div className="relative z-10 aspect-[3/4] overflow-hidden rounded-[1.75rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06),0_0_60px_-20px_rgba(249,115,22,0.12)] ring-1 ring-white/[0.08] transition-[transform,box-shadow,ring-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:group-hover:-translate-y-1 md:group-hover:scale-[1.01] md:group-hover:shadow-[0_44px_88px_-18px_rgba(0,0,0,0.58),0_0_72px_-16px_rgba(249,115,22,0.2)] md:group-hover:ring-primary/20">
              <Image
                src={HERO_IMAGE}
                alt="Profissional em atendimento na barbearia"
                fill
                className="object-cover object-[center_22%] sm:object-[center_18%]"
                sizes="(max-width: 1024px) 100vw, 42vw"
                priority
              />
              {/* Vinheta na foto: contraste com o glow ao redor */}
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/18 to-transparent"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-zinc-950/50 via-transparent to-zinc-950/35"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-cyan-950/20"
                aria-hidden
              />
            </div>
          </motion.div>

            <LandingHeroFloatingCard
              icon={CalendarPlus}
              title="Novo agendamento"
              subtitle="Hoje 14:30"
              delay={0.1}
              floatDuration={5.6}
              floatRange={5}
              tier="all"
              slideFrom="left"
              onDarkSurface
              premiumHero
              className="left-0 top-[4%] sm:left-[-4%] sm:top-[7%]"
            />
            <LandingHeroFloatingCard
              icon={UserCheck}
              title="Cliente confirmado"
              subtitle="Lembrete enviado"
              delay={0.22}
              floatDuration={6.2}
              floatRange={5}
              tier="all"
              slideFrom="right"
              onDarkSurface
              premiumHero
              className="right-0 top-[11%] sm:right-[-5%] sm:top-[15%]"
            />
            <LandingHeroFloatingCard
              icon={Banknote}
              title="Pagamento recebido"
              subtitle="Pix R$ 65"
              delay={0.34}
              floatDuration={5.3}
              floatRange={4}
              tier="all"
              slideFrom="left"
              onDarkSurface
              premiumHero
              className="bottom-[11%] left-0 sm:left-[-3%] sm:bottom-[13%]"
            />
            <LandingHeroFloatingCard
              icon={Package}
              title="Produto recomendado"
              subtitle="Pomada premium"
              delay={0.44}
              floatDuration={5.8}
              floatRange={6}
              tier="all"
              slideFrom="right"
              onDarkSurface
              premiumHero
              className="right-[-6%] top-[40%] md:right-[-9%] md:top-[42%]"
            />
            <LandingHeroFloatingCard
              icon={Percent}
              title="Comissão liberada"
              subtitle="R$ 142"
              delay={0.54}
              floatDuration={6.5}
              floatRange={4}
              tier="all"
              slideFrom="right"
              onDarkSurface
              premiumHero
              className="bottom-[12%] right-0 lg:right-[-5%] lg:bottom-[14%]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
