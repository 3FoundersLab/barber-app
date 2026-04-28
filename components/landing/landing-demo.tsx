'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { Banknote, CalendarPlus, LayoutDashboard, Sparkles } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { LANDING_CTA, LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import { LandingAmbientMotes } from '@/components/landing/landing-ambient-motes'
import { landingButtonLift, landingContainer, landingPrimaryCtaClass } from '@/components/landing/landing-classes'
import { LandingHeroFloatingCard } from '@/components/landing/landing-hero-floating-card'
import { LANDING_VIEWPORT, heroImageReveal, heroStaggerContainer, heroStaggerItem } from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

const DEMO_DASHBOARD_IMAGE =
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1100&q=82'

function DemoBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-white dark:hidden" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-zinc-50/60 to-zinc-100/40 dark:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-15%,rgba(249,115,22,0.07),transparent_55%)] dark:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(24,24,27,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.06)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_58%_at_50%_40%,black,transparent)] dark:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/70 to-transparent dark:hidden"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 hidden bg-zinc-950 dark:block" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900 dark:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_100%_75%_at_50%_-15%,rgba(24,24,27,0.92),transparent_55%)] dark:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_50%_42%_at_82%_38%,rgba(6,182,212,0.1),transparent_60%),radial-gradient(ellipse_38%_34%_at_10%_72%,rgba(59,130,246,0.06),transparent_58%),radial-gradient(ellipse_48%_38%_at_50%_100%,rgba(234,88,12,0.045),transparent_55%)] dark:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_85%_72%_at_50%_48%,transparent_0%,rgba(9,9,11,0.52)_100%)] dark:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(255,255,255,0.026)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.026)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_58%_at_50%_40%,black,transparent)] dark:block"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 z-[2] hidden dark:block">
        <LandingAmbientMotes preset="cta" />
      </div>
      <motion.div
        className="pointer-events-none absolute right-[-8%] top-[22%] hidden h-[min(52vw,380px)] w-[min(52vw,380px)] rounded-full bg-cyan-500/[0.09] blur-[68px] md:right-[6%] dark:block"
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.32, 0.46, 0.32],
                scale: [1, 1.04, 1],
              }
        }
        transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -left-[12%] bottom-[18%] hidden h-[min(44vw,300px)] w-[min(44vw,300px)] rounded-full bg-orange-600/[0.07] blur-[60px] dark:block"
        aria-hidden
        animate={reduceMotion ? undefined : { opacity: [0.22, 0.36, 0.22] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-28 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent [mask-image:linear-gradient(to_top,black,transparent)] dark:block"
        aria-hidden
      />
    </>
  )
}

const demoCtaSecondaryClass = cn(
  landingButtonLift,
  'h-12 rounded-full border-2 px-7 text-sm font-bold shadow-sm backdrop-blur-sm',
  'transition-[transform,box-shadow,background-color,border-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
  'border-zinc-300 bg-white text-zinc-900 hover:border-primary/45 hover:bg-zinc-50',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
  'dark:border-white/22 dark:bg-white/[0.06] dark:text-white dark:hover:border-cyan-400/50 dark:hover:bg-cyan-500/[0.12] dark:hover:text-white',
  'dark:focus-visible:ring-cyan-400/50 dark:focus-visible:ring-offset-zinc-950',
)

export function LandingDemo() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion() === true

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const parallaxRaw = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 22])
  const parallaxY = useSpring(parallaxRaw, { stiffness: 90, damping: 28, mass: 0.45 })

  return (
    <section
      ref={sectionRef}
      id={LANDING_SECTIONS.demonstracao}
      className="relative scroll-mt-24 overflow-hidden bg-white py-10 text-zinc-950 md:py-14 lg:py-20 dark:bg-zinc-950 dark:text-white"
      aria-labelledby="landing-demo-heading"
    >
      <DemoBackdrop reduceMotion={reduceMotion} />

      <div className={`${landingContainer} relative z-10`}>
        <motion.div
          className="mx-auto max-w-2xl text-center"
          variants={heroStaggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={LANDING_VIEWPORT}
        >
          <motion.p
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary sm:text-xs"
            variants={heroStaggerItem}
          >
            Veja na prática
          </motion.p>
          <motion.h2
            id="landing-demo-heading"
            className="mt-3 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white"
            variants={heroStaggerItem}
          >
            Dashboard, agenda e ações do dia — numa tela só
          </motion.h2>
          <motion.p
            className="mx-auto mt-4 max-w-lg text-pretty text-sm leading-relaxed text-zinc-600 sm:text-base dark:text-zinc-400"
            variants={heroStaggerItem}
          >
            Imagine a rotina: grade cheia, Pix batendo, comissão clara. É isso que o cliente enxerga usando o BarberTool.
          </motion.p>
        </motion.div>

        <div className="relative mx-auto mt-10 max-w-[min(100%,440px)] lg:mt-12 lg:max-w-[480px]">
          <motion.div className="relative w-full" style={{ y: parallaxY }}>
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -right-[5%] bottom-[1%] z-[5] hidden aspect-[9/18.5] w-[min(24%,7rem)] rounded-[1.25rem] border border-zinc-300/90 bg-gradient-to-b from-zinc-100 via-zinc-200/90 to-zinc-300 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.2)] md:block dark:border-white/[0.09] dark:from-zinc-800/55 dark:via-zinc-900/75 dark:to-zinc-950 dark:shadow-[0_22px_44px_-14px_rgba(0,0,0,0.55)]"
              style={{ transformOrigin: 'center bottom' }}
              animate={
                reduceMotion
                  ? undefined
                  : {
                      y: [0, 5, 0],
                      rotate: [-2.2, -1.2, -2.2],
                    }
              }
              transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="absolute inset-x-[11%] top-[5%] h-1.5 rounded-full bg-zinc-600/50" />
              <div className="absolute inset-x-2 top-[16%] bottom-[11%] rounded-lg bg-zinc-950/55 ring-1 ring-cyan-500/[0.06]" />
            </motion.div>

            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[104%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] bg-gradient-to-b from-primary/[0.12] via-cyan-500/[0.08] to-indigo-500/[0.1] blur-[48px] md:blur-[58px] dark:from-cyan-500/[0.18] dark:via-teal-600/[0.1] dark:to-indigo-950/[0.3]"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: [0.52, 0.7, 0.52],
                    }
              }
              transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <motion.div
              className="group relative z-10 w-full"
              variants={heroImageReveal}
              initial={reduceMotion ? 'visible' : 'hidden'}
              whileInView={reduceMotion ? undefined : 'visible'}
              viewport={LANDING_VIEWPORT}
            >
              <motion.div
                className="relative overflow-hidden rounded-2xl shadow-[0_24px_56px_-18px_rgba(0,0,0,0.18)] ring-1 ring-zinc-200/90 transition-[transform,box-shadow,ring-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:group-hover:-translate-y-1 md:group-hover:scale-[1.01] md:group-hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.22)] md:group-hover:ring-zinc-300/80 dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.07)] dark:ring-white/[0.09] dark:md:group-hover:shadow-[0_44px_88px_-18px_rgba(0,0,0,0.55)] dark:md:group-hover:ring-white/14"
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        y: [0, -4, 0],
                      }
                }
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div
                  className="flex h-9 items-center gap-2 border-b border-white/[0.08] bg-zinc-900/95 px-3 backdrop-blur-sm sm:h-10 sm:px-3.5"
                  aria-hidden
                >
                  <span className="size-2 rounded-full bg-zinc-600/90 sm:size-2.5" />
                  <span className="size-2 rounded-full bg-zinc-600/70 sm:size-2.5" />
                  <span className="size-2 rounded-full bg-zinc-600/50 sm:size-2.5" />
                  <span className="ml-2 h-5 flex-1 max-w-[12rem] rounded-md bg-zinc-800/80 sm:max-w-[14rem]" />
                </div>
                <div className="relative aspect-[16/10] w-full max-h-[min(48vh,360px)] sm:max-h-[min(52vh,400px)]">
                  <Image
                    src={DEMO_DASHBOARD_IMAGE}
                    alt="Painel do BarberTool com agenda e indicadores"
                    fill
                    className="object-cover object-[center_40%]"
                    sizes="(max-width: 1024px) 92vw, 480px"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/55 via-zinc-950/5 to-transparent"
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-zinc-950/35 via-transparent to-cyan-950/15"
                    aria-hidden
                  />
                </div>
              </motion.div>
            </motion.div>

            <LandingHeroFloatingCard
              icon={LayoutDashboard}
              title="Visão do dia"
              subtitle="Ocupação e faturamento"
              delay={0.06}
              floatDuration={5.4}
              floatRange={3}
              tier="all"
              slideFrom="left"
              onDarkSurface
              className="left-[-3%] top-[14%] sm:left-[-8%] sm:top-[18%]"
            />
            <LandingHeroFloatingCard
              icon={CalendarPlus}
              title="Próximo horário"
              subtitle="Corte + barba, 15:00"
              delay={0.14}
              floatDuration={5.7}
              floatRange={4}
              tier="all"
              slideFrom="right"
              onDarkSurface
              className="right-[-3%] top-[28%] sm:right-[-8%] sm:top-[32%]"
            />
            <LandingHeroFloatingCard
              icon={Banknote}
              title="Pagamento registrado"
              subtitle="Pix R$ 70"
              delay={0.22}
              floatDuration={5.9}
              floatRange={3}
              tier="all"
              slideFrom="left"
              onDarkSurface
              className="bottom-[8%] left-[-2%] sm:bottom-[10%] sm:left-[-6%]"
            />
            <LandingHeroFloatingCard
              icon={Sparkles}
              title="Comissões atualizadas"
              subtitle="Fechamento do turno"
              delay={0.3}
              floatDuration={6.1}
              floatRange={3}
              tier="all"
              slideFrom="right"
              onDarkSurface
              className="bottom-[10%] right-[-2%] sm:bottom-[12%] sm:right-[-6%]"
            />
          </motion.div>
        </div>

        <motion.div
          className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap"
          variants={heroStaggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={LANDING_VIEWPORT}
        >
          <Button
            asChild
            variant="ghost"
            size="lg"
            className={cn('h-12 px-8 text-sm font-bold sm:h-14', landingPrimaryCtaClass, landingButtonLift)}
          >
            <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.primary}</Link>
          </Button>
          <Button asChild variant="ghost" size="lg" className={demoCtaSecondaryClass}>
            <Link href={`#${LANDING_SECTIONS.planos}`}>Ver planos</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
