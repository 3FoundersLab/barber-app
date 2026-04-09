'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { Banknote, CalendarPlus, Sparkles } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { LANDING_CTA, LANDING_LINKS } from '@/components/landing/constants'
import { LandingAmbientMotes } from '@/components/landing/landing-ambient-motes'
import { landingButtonLift, landingContainer, landingPrimaryCtaClass } from '@/components/landing/landing-classes'
import { LandingHeroFloatingCard } from '@/components/landing/landing-hero-floating-card'
import { LANDING_VIEWPORT, heroImageReveal, heroStaggerContainer, heroStaggerItem } from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

/** Tela de trabalho / métricas; leitura de “produto” na conversão final. */
const CTA_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1100&q=82'

function CtaFinalBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-zinc-950" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_75%_at_50%_-15%,rgba(24,24,27,0.92),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_42%_at_82%_38%,rgba(6,182,212,0.1),transparent_60%),radial-gradient(ellipse_38%_34%_at_10%_72%,rgba(59,130,246,0.06),transparent_58%),radial-gradient(ellipse_48%_38%_at_50%_100%,rgba(234,88,12,0.045),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_72%_at_50%_48%,transparent_0%,rgba(9,9,11,0.52)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.026)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.026)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_58%_at_50%_40%,black,transparent)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 z-[2]">
        <LandingAmbientMotes preset="cta" />
      </div>
      <motion.div
        className="pointer-events-none absolute right-[-8%] top-[22%] h-[min(52vw,380px)] w-[min(52vw,380px)] rounded-full bg-cyan-500/[0.09] blur-[68px] md:right-[6%]"
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
        className="pointer-events-none absolute -left-[12%] bottom-[18%] h-[min(44vw,300px)] w-[min(44vw,300px)] rounded-full bg-orange-600/[0.07] blur-[60px]"
        aria-hidden
        animate={reduceMotion ? undefined : { opacity: [0.22, 0.36, 0.22] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />
      <motion.div
        className="pointer-events-none absolute left-[38%] top-[8%] h-[min(36vw,220px)] w-[min(36vw,220px)] rounded-full bg-teal-500/[0.06] blur-[52px]"
        aria-hidden
        animate={reduceMotion ? undefined : { opacity: [0.2, 0.32, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent [mask-image:linear-gradient(to_top,black,transparent)]"
        aria-hidden
      />
    </>
  )
}

export function LandingCta() {
  const sectionRef = useRef<HTMLElement>(null)
  const reduceMotionPref = useReducedMotion()
  const reduceMotion = reduceMotionPref === true

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const parallaxRaw = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : 28])
  const parallaxY = useSpring(parallaxRaw, { stiffness: 90, damping: 28, mass: 0.45 })

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative scroll-mt-24 overflow-hidden bg-zinc-950 py-14 text-white md:py-20 lg:py-36',
      )}
      aria-labelledby="landing-cta-heading"
    >
      <CtaFinalBackdrop reduceMotion={reduceMotion} />

      <div className={`${landingContainer} relative z-10`}>
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 xl:gap-20">
          <motion.div
            className="relative z-20 mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-left"
            variants={heroStaggerContainer}
            initial={reduceMotion ? 'visible' : 'hidden'}
            whileInView={reduceMotion ? undefined : 'visible'}
            viewport={LANDING_VIEWPORT}
          >
            <div
              className="pointer-events-none absolute -left-6 top-[32%] hidden h-52 w-52 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-500/[0.08] via-cyan-600/[0.03] to-transparent blur-[52px] md:block lg:-left-10"
              aria-hidden
            />
            <motion.p
              className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary sm:text-xs"
              variants={heroStaggerItem}
            >
              {LANDING_CTA.urgencyBanner}
            </motion.p>
            <motion.h2
              id="landing-cta-heading"
              className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.5rem] lg:leading-[1.12]"
              variants={heroStaggerItem}
            >
              Pronto para ter agenda cheia e caixa sob controle?
            </motion.h2>
            <motion.p
              className="mx-auto mt-6 max-w-lg text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg lg:mx-0"
              variants={heroStaggerItem}
            >
              Último passo: criar sua conta. Em poucos minutos você já usa o BarberTool na rotina, com{' '}
              <strong className="font-medium text-zinc-200">agendamento</strong>, equipe e fechamento do dia na mesma
              tela.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start sm:gap-4"
              variants={heroStaggerItem}
            >
              <Button
                asChild
                variant="ghost"
                size="lg"
                className={cn('h-14 min-w-[220px] px-10 text-base', landingPrimaryCtaClass, landingButtonLift)}
              >
                <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.primary}</Link>
              </Button>
            </motion.div>
            <motion.div variants={heroStaggerItem}>
              <p className="mt-5 text-sm font-medium text-zinc-500">{LANDING_CTA.urgency}</p>
              <Button
                asChild
                variant="link"
                className="mt-1 h-auto p-0 text-sm font-semibold text-cyan-400/85 underline-offset-4 transition duration-300 hover:text-cyan-300 hover:underline"
              >
                <Link href={LANDING_LINKS.login}>Já tenho conta: entrar</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative z-10 mx-auto w-full max-w-[min(100%,440px)] lg:mx-0 lg:ml-auto lg:max-w-[480px]"
            style={{ y: parallaxY }}
          >
            <div className="relative mx-auto w-full">
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -right-[5%] bottom-[1%] z-[5] hidden aspect-[9/18.5] w-[min(24%,7rem)] rounded-[1.25rem] border border-white/[0.09] bg-gradient-to-b from-zinc-800/55 via-zinc-900/75 to-zinc-950 shadow-[0_22px_44px_-14px_rgba(0,0,0,0.55)] md:block"
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
                className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[104%] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] bg-gradient-to-b from-cyan-500/[0.18] via-teal-600/[0.1] to-indigo-950/[0.3] blur-[48px] md:blur-[58px]"
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
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[42%] z-[1] h-[38%] w-[62%] -translate-x-1/2 rounded-full bg-cyan-400/[0.09] blur-[34px]"
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        opacity: [0.38, 0.52, 0.38],
                      }
                }
                transition={{ duration: 7.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
              />

              <motion.div
                className="group relative z-10 w-full"
                variants={heroImageReveal}
                initial={reduceMotion ? 'visible' : 'hidden'}
                whileInView={reduceMotion ? undefined : 'visible'}
                viewport={LANDING_VIEWPORT}
              >
                <motion.div
                  className="relative overflow-hidden rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.07)] ring-1 ring-white/[0.09] transition-[transform,box-shadow,ring-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:group-hover:-translate-y-1 md:group-hover:scale-[1.01] md:group-hover:shadow-[0_44px_88px_-18px_rgba(0,0,0,0.55)] md:group-hover:ring-white/14"
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          y: [0, -5, 0],
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
                  <div className="relative aspect-[16/10] w-full max-h-[min(52vh,380px)] sm:max-h-[min(56vh,420px)]">
                    <Image
                      src={CTA_PRODUCT_IMAGE}
                      alt="Visualização de painel com agenda e indicadores do BarberTool"
                      fill
                      className="object-cover object-[center_40%]"
                      sizes="(max-width: 1024px) 92vw, 44vw"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/55 via-zinc-950/5 to-transparent"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-r from-zinc-950/35 via-transparent to-cyan-950/15"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-cyan-950/20"
                      aria-hidden
                    />
                  </div>
                </motion.div>
              </motion.div>

              <LandingHeroFloatingCard
                icon={CalendarPlus}
                title="Agenda do dia"
                subtitle="Próximo: 15:00, corte + barba"
                delay={0.08}
                floatDuration={5.5}
                floatRange={3}
                tier="all"
                slideFrom="left"
                onDarkSurface
                className="left-[-3%] top-[18%] sm:left-[-8%] sm:top-[22%]"
              />
              <LandingHeroFloatingCard
                icon={Banknote}
                title="Caixa em dia"
                subtitle="Pix, R$ 70,00"
                delay={0.16}
                floatDuration={6}
                floatRange={4}
                tier="all"
                slideFrom="right"
                onDarkSurface
                className="right-[-3%] top-[32%] sm:right-[-8%] sm:top-[36%]"
              />
              <LandingHeroFloatingCard
                icon={Sparkles}
                title="Fechamento limpo"
                subtitle="Meta, comissões"
                delay={0.24}
                floatDuration={5.8}
                floatRange={3}
                tier="md"
                slideFrom="left"
                onDarkSurface
                className="bottom-[6%] left-[-2%] sm:bottom-[8%] sm:left-[-6%]"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
