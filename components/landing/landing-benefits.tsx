'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import {
  landingButtonLift,
  landingContainer,
  landingPrimaryCtaClass,
  landingSectionY,
} from '@/components/landing/landing-classes'
import { LandingPremiumCarousel, useLandingCarouselSlideActive } from '@/components/landing/landing-premium-carousel'
import { Button } from '@/components/ui/button'
import { LANDING_EASE, LANDING_VIEWPORT } from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

type BenefitBlock = {
  title: string
  lead: string
  bullets: string[]
  imageSrc: string
  imageAlt: string
}

const blocks: BenefitBlock[] = [
  {
    title: 'Gestão completa da barbearia',
    lead: 'Nunca mais perca um cliente por desorganização. Uma visão só da grade, da equipe e do que falta para o dia fechar redondo.',
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
    title: 'Controle financeiro simplificado',
    lead: 'Saiba quanto entrou e onde está o lucro, sem abrir dez planilhas no domingo à noite.',
    bullets: [
      'Corte, barba, Pix e mensalista separados: você vê de onde veio cada real.',
      'Pico da semana e vales no radar: ajuste preço e meta com clareza.',
      'Fechamento do dia que você confia para dormir sem revisar papel.',
    ],
    imageSrc:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1100&q=82',
    imageAlt: 'Análise financeira em notebook com gráficos',
  },
  {
    title: 'Comunicação com clientes',
    lead: 'Cliente lembrado volta. Cliente esquecido some. Menos “sumiu” e mais cadeira cheia.',
    bullets: [
      'Lembretes e confirmações que reduzem furo de agenda.',
      'Histórico na hora: preferências e último corte sem perguntar de novo.',
      'Menos caos no WhatsApp: informação no lugar certo, para quem precisa.',
    ],
    imageSrc:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1100&q=82',
    imageAlt: 'Smartphone com foco em comunicação e apps',
  },
  {
    title: 'Crescimento e escala',
    lead: 'Veja o que puxa resultado e repita no próximo mês, com base para contratar ou abrir outra unidade com número na mão.',
    bullets: [
      'Sinais claros de horário cheio, serviço forte e equipe no limite.',
      'Base para escalar: processo repetível em vez de “jeitinho” de cada um.',
      'Decisões com dado simples: menos achismo, mais margem.',
    ],
    imageSrc:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1100&q=82',
    imageAlt: 'Dashboard com métricas e gráficos de desempenho',
  },
  {
    title: 'Relatórios e inteligência do negócio',
    lead: 'Pare de decidir no feeling: veja padrões de agenda, ticket e recorrência, e aja antes do problema aparecer no caixa.',
    bullets: [
      'Leitura rápida do que vende, o que enche a grade e o que pode sair de promo.',
      'Histórico que vira previsão: sazonalidade e hábito do cliente na mesma tela.',
      'Menos planilha paralela: números organizados para reunião com sócio ou equipe.',
    ],
    imageSrc:
      'https://images.unsplash.com/photo-1543286386-713bdd548da4?auto=format&fit=crop&w=1100&q=82',
    imageAlt: 'Gráficos e indicadores de desempenho em tela',
  },
]

function BenefitsDarkBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
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
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_78%_28%,rgba(6,182,212,0.09),transparent_62%),radial-gradient(ellipse_40%_35%_at_12%_68%,rgba(59,130,246,0.06),transparent_58%),radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(20,184,166,0.05),transparent_55%)]"
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
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[18%] h-[min(62vw,420px)] w-[min(62vw,420px)] -translate-x-1/2 rounded-full bg-cyan-500/[0.1] blur-[72px] md:left-[62%] md:top-[22%] md:translate-x-0"
        aria-hidden
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.32, 0.46, 0.32],
                scale: [1, 1.03, 1],
              }
        }
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -left-[14%] bottom-[8%] h-[min(48vw,320px)] w-[min(48vw,320px)] rounded-full bg-teal-600/[0.07] blur-[64px]"
        aria-hidden
        animate={reduceMotion ? undefined : { opacity: [0.26, 0.38, 0.26] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />
    </>
  )
}

function BenefitImagePanel({
  src,
  alt,
  reduceMotion,
  index,
  isActive,
}: {
  src: string
  alt: string
  reduceMotion: boolean
  index: number
  isActive: boolean
}) {
  return (
    <motion.div
      className="relative mx-auto w-full max-w-lg lg:max-w-none"
      initial={false}
      animate={
        reduceMotion
          ? {}
          : isActive
            ? { opacity: 1, x: 0, scale: 1 }
            : { opacity: 0.72, x: 0, scale: 0.992 }
      }
      transition={{ duration: 0.45, ease: LANDING_EASE }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[105%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-[1.75rem] bg-gradient-to-b from-cyan-500/[0.18] via-teal-600/[0.08] to-indigo-950/[0.28] blur-[44px] md:blur-[52px]"
        animate={
          reduceMotion
            ? undefined
            : {
                opacity: [0.5, 0.65, 0.5],
              }
        }
        transition={{ duration: 8 + index * 0.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={cn(
          'group relative z-10 overflow-hidden rounded-[1.5rem] shadow-[0_28px_56px_-14px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.07)] ring-1 ring-white/[0.08]',
          'aspect-[4/3] sm:aspect-[16/10]',
        )}
        whileHover={reduceMotion || !isActive ? undefined : { y: -4, transition: { duration: 0.45, ease: LANDING_EASE } }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-center transition duration-700 ease-out group-hover:scale-[1.02]"
          sizes="(max-width: 1024px) 100vw, 48vw"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/55 via-transparent to-zinc-950/15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-950/10 to-teal-900/15"
          aria-hidden
        />
      </motion.div>
    </motion.div>
  )
}

function BenefitSlide({
  block,
  slideIndex,
  reduceMotion,
}: {
  block: BenefitBlock
  slideIndex: number
  reduceMotion: boolean
}) {
  const isActive = useLandingCarouselSlideActive(slideIndex)
  const imageLeft = slideIndex % 2 === 0

  return (
    <article
      className={cn(
        'group/slide grid items-center gap-10 md:gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20',
        !imageLeft && 'lg:grid-flow-dense',
      )}
    >
      <div className={cn(imageLeft ? 'lg:col-start-1' : 'lg:col-start-2 lg:row-start-1')}>
        <BenefitImagePanel
          src={block.imageSrc}
          alt={block.imageAlt}
          reduceMotion={reduceMotion}
          index={slideIndex}
          isActive={isActive}
        />
      </div>

      <motion.div
        className={cn('flex flex-col justify-center', imageLeft ? 'lg:col-start-2' : 'lg:col-start-1 lg:row-start-1')}
        initial={false}
        animate={
          reduceMotion
            ? {}
            : isActive
              ? { opacity: 1, y: 0 }
              : { opacity: 0.68, y: 8 }
        }
        transition={{ duration: 0.42, ease: LANDING_EASE }}
      >
        <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem] sm:leading-snug">{block.title}</h3>
        <p className="mt-4 text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg">{block.lead}</p>
        <ul className="mt-8 space-y-3.5" role="list">
          {block.bullets.map((item) => (
            <li key={item} className="flex gap-3 text-sm leading-relaxed text-zinc-300 sm:text-[0.9375rem]">
              <span
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/25"
                aria-hidden
              >
                <Check className="size-3" strokeWidth={2.5} />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-9">
          <Button
            asChild
            variant="ghost"
            size="lg"
            className={cn(
              'h-12 rounded-full border-2 border-white/18 bg-white/[0.06] px-7 text-sm font-semibold text-white backdrop-blur-sm',
              'transition-[border-color,background-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
              'hover:border-white/28 hover:bg-white/12 hover:text-white hover:shadow-lg hover:shadow-black/25',
              landingButtonLift,
            )}
          >
            <Link href={`#${LANDING_SECTIONS.funcionalidades}`}>Saiba mais</Link>
          </Button>
        </div>
      </motion.div>
    </article>
  )
}

export function LandingBenefits() {
  const reduceMotion = useReducedMotion() === true

  return (
    <section
      id={LANDING_SECTIONS.beneficios}
      className={cn('relative scroll-mt-24 overflow-hidden border-y border-white/[0.06] text-white', landingSectionY)}
      aria-labelledby="landing-beneficios-heading"
    >
      <BenefitsDarkBackdrop reduceMotion={reduceMotion} />

      <div className={`${landingContainer} relative z-10`}>
        <motion.header
          className="mx-auto max-w-3xl text-center"
          initial={reduceMotion ? false : { opacity: 0, y: 26 }}
          whileInView={
            reduceMotion
              ? undefined
              : { opacity: 1, y: 0, transition: { duration: 0.58, ease: LANDING_EASE } }
          }
          viewport={LANDING_VIEWPORT}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-400/95 sm:text-xs">
            Benefícios · resultado na bancada
          </p>
          <h2
            id="landing-beneficios-heading"
            className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.625rem] lg:leading-[1.1]"
          >
            Benefícios e soluções para sua barbearia crescer
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-zinc-400 sm:text-lg">
            Navegue pelos destaques: cada slide é um capítulo da operação, da organização à inteligência do negócio.
          </p>
        </motion.header>

        <div className="mt-16 sm:mt-20">
          <LandingPremiumCarousel theme="dark" loop={false} scrollDuration={34} labelledBy="landing-beneficios-heading">
            {blocks.map((block, index) => (
              <BenefitSlide key={block.title} block={block} slideIndex={index} reduceMotion={reduceMotion} />
            ))}
          </LandingPremiumCarousel>
        </div>

        <motion.div
          className="mx-auto mt-16 max-w-xl text-center sm:mt-20"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={
            reduceMotion
              ? undefined
              : { opacity: 1, y: 0, transition: { duration: 0.52, ease: LANDING_EASE, delay: 0.06 } }
          }
          viewport={LANDING_VIEWPORT}
        >
          <Button
            asChild
            variant="ghost"
            size="lg"
            className={cn(
              'h-14 px-8 text-sm font-bold sm:px-10 sm:text-base',
              landingPrimaryCtaClass,
              landingButtonLift,
            )}
          >
            <Link href={LANDING_LINKS.cadastro}>Começar gratuitamente</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
