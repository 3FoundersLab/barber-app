'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import {
  Banknote,
  CalendarPlus,
  Percent,
  TrendingUp,
  UserCheck,
  Wallet,
} from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { LANDING_CTA, LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import { landingContainer, landingPrimaryCtaClass, landingTrialCtaClass } from '@/components/landing/landing-classes'
import { LandingHeroFloatingCard } from '@/components/landing/landing-hero-floating-card'
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
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-zinc-100/80 via-[#f7f7f8] to-[#f7f7f8] pt-[7.5rem] pb-20 text-zinc-950 md:pb-28 lg:pt-36 lg:pb-32 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950 dark:text-white"
    >
      {/* Camadas de fundo — claras na landing clara; equivalente no dark */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-8%,rgba(34,211,238,0.10),transparent_58%),radial-gradient(ellipse_65%_45%_at_100%_42%,rgba(6,182,212,0.06),transparent_52%),radial-gradient(ellipse_50%_40%_at_0%_58%,rgba(59,130,246,0.05),transparent_48%)] dark:bg-[radial-gradient(ellipse_85%_60%_at_50%_-10%,rgba(34,211,238,0.14),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_40%,rgba(6,182,212,0.10),transparent_50%),radial-gradient(ellipse_55%_45%_at_0%_60%,rgba(59,130,246,0.08),transparent_45%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950/95"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(24,24,27,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-90 [mask-image:radial-gradient(ellipse_78%_58%_at_50%_38%,black,transparent)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] dark:opacity-[0.35]"
        aria-hidden
      />

      <motion.div
        className="pointer-events-none absolute left-1/2 top-[18%] h-[min(72vw,520px)] w-[min(72vw,520px)] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-[80px] md:left-[58%] md:top-[22%] md:translate-x-0 lg:h-[560px] lg:w-[560px] dark:bg-cyan-500/18"
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.14, 0.22, 0.14],
                scale: [1, 1.04, 1],
              }
        }
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -left-[20%] bottom-[5%] h-[min(55vw,380px)] w-[min(55vw,380px)] rounded-full bg-blue-500/8 blur-[72px] md:bottom-[8%] lg:left-[2%] dark:bg-blue-600/14"
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.1, 0.18, 0.1],
              }
        }
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />

      <div
        className={`${landingContainer} relative z-10 grid items-center gap-14 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 xl:gap-20`}
      >
        {/* Coluna esquerda: headline */}
        <motion.div
          className="relative z-30 max-w-xl lg:max-w-none"
          initial={reduceMotion ? false : { opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.p
            className="mb-5 inline-flex items-center rounded-full border border-cyan-200/90 bg-cyan-50/90 px-4 py-1.5 text-xs font-semibold text-teal-950 shadow-sm dark:border-cyan-400/25 dark:bg-cyan-500/[0.08] dark:text-cyan-100/95 dark:shadow-[0_0_24px_-8px_rgba(34,211,238,0.25)]"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            Pra quem vive a barbearia — dono ou barbeiro na ponta da tesoura
          </motion.p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl sm:leading-[1.06] lg:text-[3.125rem] lg:leading-[1.04] dark:text-white">
            Pare de perder cliente por desorganização. Busque agenda cheia de novo — todos os dias.
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
            <span className="font-semibold text-zinc-950 dark:text-zinc-100">BarberApp</span> é a sua bancada digital: encaixe,
            remarcação e fila da equipe num lugar só. Pix, dinheiro e mensalista separados. Chega de grupo do Zap virar
            agenda e de dois barbeiros marcarem o mesmo horário sem querer.
          </p>
          <motion.div
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button
              asChild
              variant="ghost"
              size="lg"
              className={cn(
                'h-14 px-8 text-sm leading-tight sm:px-10 sm:text-base',
                landingPrimaryCtaClass,
              )}
            >
              <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.primary}</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className={cn(
                'h-14 px-7 text-sm sm:px-8 sm:text-base',
                landingTrialCtaClass,
              )}
            >
              <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.trial}</Link>
            </Button>
          </motion.div>
          <p className="mt-6 text-center text-[11px] font-bold uppercase tracking-wide leading-relaxed text-orange-800/90 sm:text-left dark:text-amber-300/90">
            {LANDING_CTA.urgencyBanner}
          </p>
          <Link
            href={`#${LANDING_SECTIONS.funcionalidades}`}
            className="mt-5 inline-block text-sm font-semibold text-zinc-500 underline-offset-4 transition hover:text-zinc-800 hover:underline dark:text-cyan-300/90 dark:hover:text-cyan-200"
          >
            Ver o que entra na prática na sua barbearia →
          </Link>
          <p className="mt-5 text-sm font-medium text-zinc-500 dark:text-zinc-500">
            Fala a língua da barbearia · Menos correria entre corte e corte
          </p>
        </motion.div>

        {/* Coluna direita: figura + widgets */}
        <motion.div
          className="relative z-20 mx-auto w-full max-w-[420px] md:mx-0 md:max-w-none"
          style={{ y: parallaxY }}
        >
          <div className="relative mx-auto w-full max-w-[min(100%,380px)] sm:max-w-md md:ml-auto md:mr-0 md:max-w-md lg:max-w-lg">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[1.75rem] shadow-[0_28px_56px_-18px_rgba(0,0,0,0.28),0_12px_24px_-10px_rgba(0,0,0,0.12)] ring-1 ring-zinc-900/[0.08] dark:shadow-[0_32px_64px_-20px_rgba(0,0,0,0.75)] dark:ring-white/10">
              <Image
                src={HERO_IMAGE}
                alt="Profissional em atendimento na barbearia"
                fill
                className="object-cover object-[center_22%] sm:object-[center_18%]"
                sizes="(max-width: 1024px) 100vw, 42vw"
                priority
              />
              {/* Vinheta escura na foto — foco no assunto, mesmo com fundo da página claro */}
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

            <LandingHeroFloatingCard
              icon={CalendarPlus}
              title="Novo agendamento"
              subtitle="14:30 · corte + barba"
              delay={0.12}
              floatDuration={5.4}
              floatRange={5}
              tier="all"
              className="left-[-2%] top-[6%] sm:left-[-6%] sm:top-[10%]"
            />
            <LandingHeroFloatingCard
              icon={UserCheck}
              title="Cliente confirmou"
              subtitle="Lembrete enviado · ✓"
              delay={0.22}
              floatDuration={6.1}
              floatRange={4}
              tier="all"
              className="right-[-4%] top-[14%] sm:right-[-8%] sm:top-[18%]"
            />
            <LandingHeroFloatingCard
              icon={TrendingUp}
              title="Venda adicional"
              subtitle="+ tintura no mesmo horário"
              delay={0.32}
              floatDuration={5.8}
              floatRange={6}
              tier="md"
              className="left-[-10%] top-[42%] md:left-[-12%]"
            />
            <LandingHeroFloatingCard
              icon={Percent}
              title="Comissão do dia"
              subtitle="R$ 186,40 líquido"
              delay={0.38}
              floatDuration={6.4}
              floatRange={5}
              tier="md"
              className="right-[-8%] top-[48%] md:right-[-10%]"
            />
            <LandingHeroFloatingCard
              icon={Wallet}
              title="Controle financeiro"
              subtitle="Caixa · Pix · dinheiro"
              delay={0.44}
              floatDuration={5.2}
              floatRange={5}
              tier="lg"
              className="bottom-[14%] left-[-4%] lg:left-[-6%]"
            />
            <LandingHeroFloatingCard
              icon={Banknote}
              title="Pagamento recebido"
              subtitle="Pix · compensado"
              delay={0.5}
              floatDuration={6}
              floatRange={4}
              tier="lg"
              className="bottom-[18%] right-[-2%] lg:right-[-6%]"
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
