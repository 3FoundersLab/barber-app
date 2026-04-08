'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { ChevronRight, Headphones, Instagram, Linkedin, Mail, ShieldCheck } from 'lucide-react'
import { LandingAmbientMotes } from '@/components/landing/landing-ambient-motes'
import { AppBrandLogo } from '@/components/shared/app-brand-logo'
import { LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import { landingContainer } from '@/components/landing/landing-classes'
import { LANDING_EASE, LANDING_VIEWPORT, staggerContainer, staggerItem } from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

const footerNavPrimary = [
  { label: 'Início', href: `#${LANDING_SECTIONS.top}` },
  { label: 'Problema', href: `#${LANDING_SECTIONS.problema}` },
  { label: 'Solução', href: `#${LANDING_SECTIONS.solucao}` },
  { label: 'Benefícios', href: `#${LANDING_SECTIONS.beneficios}` },
  { label: 'Funcionalidades', href: `#${LANDING_SECTIONS.funcionalidades}` },
]

const footerNavSecondary = [
  { label: 'Prova social', href: `#${LANDING_SECTIONS.provaSocial}` },
  { label: 'Como funciona', href: `#${LANDING_SECTIONS.comoFunciona}` },
  { label: 'Planos', href: `#${LANDING_SECTIONS.planos}` },
  { label: 'Entrar', href: LANDING_LINKS.login },
  { label: 'Cadastro', href: LANDING_LINKS.cadastro },
]

const social = [
  { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
  { label: 'E-mail', href: 'mailto:contato@barberapp.com.br', icon: Mail },
] as const

function FooterSectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-2.5">
      <span className="h-px w-6 shrink-0 bg-gradient-to-r from-cyan-400/50 to-transparent" aria-hidden />
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">{children}</p>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 py-0.5 text-sm text-zinc-400 transition-colors duration-300 hover:text-zinc-100"
    >
      <ChevronRight
        className="size-3.5 shrink-0 text-cyan-500/0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 group-hover:text-cyan-400/90"
        strokeWidth={2}
        aria-hidden
      />
      <span className="relative inline-block">
        {children}
        <span
          className="absolute -bottom-px left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-cyan-400/80 to-cyan-400/20 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
          aria-hidden
        />
      </span>
    </Link>
  )
}

export function LandingFooter() {
  const reduceMotion = useReducedMotion() === true

  return (
    <footer
      className="relative overflow-hidden bg-zinc-950 text-zinc-300"
      aria-labelledby="landing-footer-heading"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-8 top-0 z-[1] h-px max-w-3xl bg-gradient-to-r from-cyan-500/0 via-cyan-400/35 to-teal-500/0 opacity-80 blur-[0.5px] sm:inset-x-auto sm:left-1/2 sm:w-[min(100%,42rem)] sm:-translate-x-1/2"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-25%,rgba(6,182,212,0.07),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(234,88,12,0.04),transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:56px_56px] opacity-50 [mask-image:linear-gradient(to_bottom,black_0%,black_45%,transparent_100%)]"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 z-[0]">
        <LandingAmbientMotes preset="footer" />
      </div>
      <motion.div
        className="pointer-events-none absolute -right-[18%] bottom-[-8%] z-[0] h-[min(42vw,300px)] w-[min(42vw,300px)] rounded-full bg-cyan-500/[0.06] blur-[72px]"
        aria-hidden
        animate={reduceMotion ? undefined : { opacity: [0.18, 0.34, 0.18], scale: [1, 1.05, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -left-[10%] top-[35%] z-[0] h-[min(32vw,200px)] w-[min(32vw,200px)] rounded-full bg-teal-600/[0.05] blur-[56px]"
        aria-hidden
        animate={reduceMotion ? undefined : { opacity: [0.15, 0.28, 0.15] }}
        transition={{ duration: 9.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      />

      <div className={`${landingContainer} relative z-10`}>
        <h2 id="landing-footer-heading" className="sr-only">
          Rodapé BarberApp
        </h2>

        <motion.div
          className="grid gap-16 pt-20 pb-12 md:gap-y-16 md:pt-24 md:pb-14 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-16 xl:gap-x-16"
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={LANDING_VIEWPORT}
        >
          <motion.div variants={staggerItem} className="lg:col-span-5 xl:col-span-5">
            <motion.div
              className="relative inline-block"
              whileHover={reduceMotion ? undefined : { scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              <div
                className="pointer-events-none absolute -inset-3 rounded-2xl bg-gradient-to-br from-cyan-500/[0.08] via-transparent to-orange-500/[0.06] blur-xl"
                aria-hidden
              />
              <div className="relative rounded-2xl border border-white/[0.08] bg-zinc-950/80 p-4 pr-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] backdrop-blur-sm transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-cyan-400/15 hover:shadow-[0_0_48px_-16px_rgba(34,211,238,0.12)]">
                <AppBrandLogo
                  href={`#${LANDING_SECTIONS.top}`}
                  textClassName="text-lg font-semibold tracking-tight text-white sm:text-xl"
                  className="inline-flex gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                />
                <p className="mt-3 max-w-[16rem] text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
                  Gestão · agenda · caixa
                </p>
              </div>
            </motion.div>

            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-zinc-400 sm:text-base">
              Software de gestão para barbearia: grade, ficha do cliente e caixa na mesma tela. Menos improviso na
              bancada e mais corte pago no fechamento.
            </p>

            <div className="mt-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-xs font-medium leading-snug text-zinc-400 shadow-sm transition-[border-color,background-color,box-shadow] duration-300 hover:border-cyan-400/20 hover:bg-cyan-500/[0.04]">
                <ShieldCheck className="size-4 shrink-0 text-cyan-400/85" aria-hidden />
                Dados e operação pensados para o dia a dia da bancada
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="grid gap-12 sm:grid-cols-2 sm:gap-10 lg:col-span-4 lg:grid-cols-2 lg:gap-8 xl:col-span-4"
          >
            <div className="sm:border-l sm:border-white/[0.06] sm:pl-8">
              <FooterSectionTitle>Navegação</FooterSectionTitle>
              <ul className="flex flex-col gap-3.5">
                {footerNavPrimary.map((l) => (
                  <li key={l.href}>
                    <FooterLink href={l.href}>{l.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
            <div className="sm:border-l sm:border-white/[0.06] sm:pl-8">
              <FooterSectionTitle>Produto</FooterSectionTitle>
              <ul className="flex flex-col gap-3.5">
                {footerNavSecondary.map((l) => (
                  <li key={l.href}>
                    <FooterLink href={l.href}>{l.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="lg:col-span-3 xl:col-span-3">
            <FooterSectionTitle>Contato & suporte</FooterSectionTitle>
            <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-sm transition-[border-color,box-shadow] duration-300 hover:border-white/[0.1]">
              <a
                href="mailto:contato@barberapp.com.br"
                className="group flex items-start gap-3 text-sm text-zinc-200 transition-colors hover:text-white"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/[0.08] text-cyan-300 transition-[transform,border-color,background-color] duration-300 group-hover:scale-105 group-hover:border-cyan-400/35 group-hover:bg-cyan-500/[0.12]">
                  <Mail className="size-[1.05rem]" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0 pt-1.5">
                  <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500">E-mail</span>
                  <span className="relative mt-1 block font-medium text-zinc-100">
                    contato@barberapp.com.br
                    <span
                      className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r from-cyan-400/70 to-transparent transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
                      aria-hidden
                    />
                  </span>
                </span>
              </a>
              <p className="mt-5 flex items-start gap-2.5 border-t border-white/[0.06] pt-4 text-xs leading-relaxed text-zinc-500">
                <Headphones className="mt-0.5 size-4 shrink-0 text-zinc-600" strokeWidth={1.75} aria-hidden />
                Resposta por e-mail em horário comercial.
              </p>
            </div>

            <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">Redes</p>
            <ul className="mt-4 flex flex-wrap gap-3">
              {social.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <motion.a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={cn(
                      'group/social relative inline-flex size-[3.25rem] items-center justify-center rounded-full',
                      'border border-white/[0.1] bg-white/[0.04] text-zinc-400',
                      'shadow-[0_2px_12px_-4px_rgba(0,0,0,0.5)]',
                      'transition-[color,border-color,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                      'hover:border-cyan-400/30 hover:bg-gradient-to-br hover:from-cyan-500/15 hover:to-teal-600/10 hover:text-cyan-100 hover:shadow-[0_8px_32px_-8px_rgba(34,211,238,0.2)]',
                    )}
                    whileHover={reduceMotion ? undefined : { y: -3 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                  >
                    <span
                      className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover/social:opacity-100"
                      style={{
                        background:
                          'radial-gradient(circle at 50% 0%, rgba(34,211,238,0.15), transparent 65%)',
                      }}
                      aria-hidden
                    />
                    <Icon className="relative size-[1.2rem]" strokeWidth={1.65} aria-hidden />
                  </motion.a>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        <motion.div
          className="border-t border-white/[0.06] bg-gradient-to-b from-transparent to-zinc-950/80 py-10 md:py-11"
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={reduceMotion ? undefined : { opacity: 1 }}
          viewport={LANDING_VIEWPORT}
          transition={{ duration: 0.5, ease: LANDING_EASE, delay: 0.06 }}
        >
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-end">
            <p className="text-center text-[13px] text-zinc-500 md:text-left">
              © {new Date().getFullYear()}{' '}
              <span className="font-medium text-zinc-400">BarberApp</span>. Todos os direitos reservados.
            </p>
            <p className="max-w-md text-center text-xs leading-relaxed text-zinc-600 md:text-right">
              Feito para donos e equipes que vivem a tesoura, com produto em evolução contínua.
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
