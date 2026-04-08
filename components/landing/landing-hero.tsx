'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import {
  Banknote,
  CalendarPlus,
  CheckCircle2,
  Package,
  Percent,
  UserCheck,
} from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { LANDING_CTA, LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import { landingButtonLift, landingContainer, landingPrimaryCtaClass } from '@/components/landing/landing-classes'
import { LandingHeroFloatingCard } from '@/components/landing/landing-hero-floating-card'
import {
  heroImageReveal,
  heroStaggerContainer,
  heroStaggerItem,
} from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

/** Foto editorial: profissional em contexto de barbearia (Unsplash). */
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=960&q=82'

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
      className="relative scroll-mt-24 overflow-hidden bg-zinc-950 pt-[7.5rem] pb-24 text-white md:pb-32 lg:pt-36 lg:pb-36"
    >
      {/* Base + profundidade escura */}
      <div className="pointer-events-none absolute inset-0 bg-zinc-950" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(24,24,27,0.9),transparent_55%)]"
        aria-hidden
      />
      {/* Luz ambiente teal / ciano — discretas */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_78%_32%,rgba(6,182,212,0.09),transparent_62%),radial-gradient(ellipse_40%_35%_at_12%_72%,rgba(59,130,246,0.06),transparent_58%),radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(20,184,166,0.05),transparent_55%)]"
        aria-hidden
      />
      {/* Vinheta de borda cinematográfica */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_45%,transparent_0%,rgba(9,9,11,0.55)_100%)]"
        aria-hidden
      />
      {/* Grade técnica suave */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_72%_62%_at_50%_42%,black,transparent)]"
        aria-hidden
      />
      {/* Névoa inferior — profundidade sem blur pesado */}
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

      {/* Funde com a próxima seção (clara no tema claro) */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-36 bg-gradient-to-t from-[#f7f7f8] to-transparent dark:from-zinc-950 dark:to-transparent"
        aria-hidden
      />

      <div
        className={`${landingContainer} relative z-10 grid items-center gap-14 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 xl:gap-20`}
      >
        {/* Coluna esquerda: headline — cascata no load */}
        <motion.div
          className="relative z-30 max-w-xl lg:max-w-none"
          variants={heroStaggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          animate={reduceMotion ? undefined : 'visible'}
        >
          <motion.p
            className="mb-5 inline-flex items-center rounded-full border border-cyan-400/25 bg-cyan-500/[0.09] px-4 py-1.5 text-xs font-semibold text-cyan-100/95 shadow-[0_0_28px_-10px_rgba(34,211,238,0.22)]"
            variants={heroStaggerItem}
          >
            Pra quem vive a barbearia — dono ou barbeiro na ponta da tesoura
          </motion.p>
          <motion.h1
            className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-[1.06] lg:text-[3.125rem] lg:leading-[1.04]"
            variants={heroStaggerItem}
          >
            Pare de perder cliente por desorganização. Busque agenda cheia de novo — todos os dias.
          </motion.h1>
          <motion.p
            className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg"
            variants={heroStaggerItem}
          >
            <span className="font-semibold text-zinc-100">BarberApp</span> é a sua bancada digital: encaixe,
            remarcação e fila da equipe num lugar só. Pix, dinheiro e mensalista separados. Chega de grupo do Zap virar
            agenda e de dois barbeiros marcarem o mesmo horário sem querer.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
            variants={heroStaggerItem}
          >
            <Button
              asChild
              variant="ghost"
              size="lg"
              className={cn(
                'h-14 px-8 text-sm leading-tight sm:px-10 sm:text-base',
                landingPrimaryCtaClass,
                landingButtonLift,
              )}
            >
              <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.primary}</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className={cn(
                'h-14 border-2 border-white/20 bg-white/[0.06] px-7 text-sm text-white backdrop-blur-sm transition-[border-color,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-white/30 hover:bg-white/12 hover:text-white hover:shadow-lg hover:shadow-black/20 sm:px-8 sm:text-base',
                landingButtonLift,
              )}
            >
              <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.trial}</Link>
            </Button>
          </motion.div>
          <motion.p
            className="mt-6 text-center text-[11px] font-bold uppercase tracking-wide leading-relaxed text-amber-300/90 sm:text-left"
            variants={heroStaggerItem}
          >
            {LANDING_CTA.urgencyBanner}
          </motion.p>
          <motion.div variants={heroStaggerItem}>
            <Link
              href={`#${LANDING_SECTIONS.funcionalidades}`}
              className="mt-5 inline-block text-sm font-semibold text-cyan-400/85 underline-offset-4 transition duration-300 hover:text-cyan-300 hover:underline"
            >
              Ver o que entra na prática na sua barbearia →
            </Link>
            <p className="mt-5 text-sm font-medium text-zinc-500">
              Fala a língua da barbearia · Menos correria entre corte e corte
            </p>
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
            variants={heroImageReveal}
            initial={reduceMotion ? 'visible' : 'hidden'}
            animate={reduceMotion ? undefined : 'visible'}
          >
            {/* Glow localizado atrás da foto — apoia a composição */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 z-[5] h-[108%] w-[91%] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-gradient-to-b from-cyan-500/[0.2] via-teal-600/[0.1] to-indigo-950/[0.32] blur-[48px] md:blur-[58px]"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: [0.55, 0.72, 0.55],
                    }
              }
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[38%] z-[6] h-[42%] w-[58%] -translate-x-1/2 rounded-full bg-cyan-400/[0.1] blur-[36px]"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      opacity: [0.4, 0.55, 0.4],
                    }
              }
              transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            />
            <div className="relative z-10 aspect-[3/4] overflow-hidden rounded-[1.75rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06)] ring-1 ring-white/[0.08] transition-[transform,box-shadow,ring-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:group-hover:-translate-y-1 md:group-hover:scale-[1.01] md:group-hover:shadow-[0_44px_88px_-18px_rgba(0,0,0,0.58)] md:group-hover:ring-white/14">
              <Image
                src={HERO_IMAGE}
                alt="Profissional em atendimento na barbearia"
                fill
                className="object-cover object-[center_22%] sm:object-[center_18%]"
                sizes="(max-width: 1024px) 100vw, 42vw"
                priority
              />
              {/* Vinheta na foto — contraste com o glow ao redor */}
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
              subtitle="Hoje · 14:30 · corte + barba"
              delay={0.1}
              floatDuration={5.6}
              floatRange={4}
              tier="all"
              slideFrom="left"
              onDarkSurface
              className="left-0 top-[4%] sm:left-[-4%] sm:top-[7%]"
            />
            <LandingHeroFloatingCard
              icon={UserCheck}
              title="Cliente confirmado"
              subtitle="Lembrete lido · há 2 min"
              delay={0.24}
              floatDuration={6.3}
              floatRange={5}
              tier="all"
              slideFrom="right"
              onDarkSurface
              className="right-0 top-[11%] sm:right-[-5%] sm:top-[15%]"
            />
            <LandingHeroFloatingCard
              icon={Banknote}
              title="Pagamento recebido"
              subtitle="Pix · R$ 65,00"
              delay={0.36}
              floatDuration={5.1}
              floatRange={4}
              tier="sm"
              slideFrom="left"
              onDarkSurface
              className="bottom-[11%] left-0 sm:left-[-3%] sm:bottom-[13%]"
            />
            <LandingHeroFloatingCard
              icon={CheckCircle2}
              title="Serviço realizado"
              subtitle="Corte máquina · check-out"
              delay={0.42}
              floatDuration={6}
              floatRange={5}
              tier="md"
              slideFrom="left"
              onDarkSurface
              className="left-[-6%] top-[38%] md:left-[-9%] md:top-[40%]"
            />
            <LandingHeroFloatingCard
              icon={Package}
              title="Produto recomendado"
              subtitle="Pomada · cliente aceitou"
              delay={0.5}
              floatDuration={5.4}
              floatRange={6}
              tier="md"
              slideFrom="right"
              onDarkSurface
              className="right-[-6%] top-[43%] md:right-[-9%]"
            />
            <LandingHeroFloatingCard
              icon={Percent}
              title="Comissão liberada"
              subtitle="Hoje · R$ 142,80"
              delay={0.58}
              floatDuration={6.6}
              floatRange={4}
              tier="lg"
              slideFrom="right"
              onDarkSurface
              className="bottom-[12%] right-0 lg:right-[-5%] lg:bottom-[14%]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
