'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import { Headphones, Instagram, Linkedin, Mail, ShieldCheck } from 'lucide-react'
import { LandingAmbientMotes } from '@/components/landing/landing-ambient-motes'
import { AppBrandLogo } from '@/components/shared/app-brand-logo'
import { LANDING_SECTIONS } from '@/components/landing/constants'
import { LANDING_VIEWPORT, staggerContainer, staggerItem } from '@/lib/landing-motion'
import { cn } from '@/lib/utils'

const social = [
  { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
  { label: 'E-mail', href: 'mailto:contato@barberapp.com.br', icon: Mail },
] as const

const footerContainer =
  'relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-14 xl:px-16 2xl:px-20'

function FooterSectionTitle({ children, align = 'start' }: { children: ReactNode; align?: 'start' | 'end' }) {
  if (align === 'end') {
    return (
      <div className="mb-2 flex min-h-[0.875rem] items-center justify-start gap-2 lg:justify-end">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{children}</p>
        <span className="h-px w-4 shrink-0 bg-gradient-to-l from-cyan-400/50 to-transparent" aria-hidden />
      </div>
    )
  }
  return (
    <div className="mb-2 flex min-h-[0.875rem] items-center gap-2">
      <span className="h-px w-4 shrink-0 bg-gradient-to-r from-cyan-400/50 to-transparent" aria-hidden />
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{children}</p>
    </div>
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

      <div className={footerContainer}>
        <h2 id="landing-footer-heading" className="sr-only">
          Rodapé BarberApp
        </h2>

        <motion.div
          className="grid gap-8 pt-12 pb-6 sm:gap-y-9 sm:pt-14 sm:pb-7 md:pt-16 md:pb-7 lg:grid-cols-2 lg:items-start lg:gap-x-12 lg:gap-y-0 lg:pt-[3.75rem] lg:pb-8 xl:gap-x-16"
          variants={staggerContainer}
          initial={reduceMotion ? 'visible' : 'hidden'}
          whileInView={reduceMotion ? undefined : 'visible'}
          viewport={LANDING_VIEWPORT}
        >
          <motion.div variants={staggerItem} className="flex min-w-0 flex-col lg:max-w-[min(100%,26rem)]">
            <motion.div
              className="inline-block"
              whileHover={reduceMotion ? undefined : { scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              <AppBrandLogo
                href={`#${LANDING_SECTIONS.top}`}
                textClassName="text-lg font-semibold tracking-tight text-white sm:text-xl"
                className="inline-flex gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              />
            </motion.div>

            <p className="mt-4 max-w-[24rem] text-[15px] leading-[1.58] text-zinc-400 sm:mt-[1.125rem] sm:leading-[1.62]">
              Software de gestão para barbearia: grade, ficha do cliente e caixa na mesma tela. Menos improviso na
              bancada e mais corte pago no fechamento.
            </p>

            <nav className="mt-4 sm:mt-[1.125rem]" aria-label="Informações legais">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-left text-[11px] font-medium leading-snug text-zinc-500 sm:text-[12px]">
                <Link
                  href="#"
                  className="rounded-sm transition-colors duration-300 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  Termos de uso
                </Link>
                <span className="select-none text-zinc-600/70" aria-hidden>
                  ·
                </span>
                <Link
                  href="#"
                  className="rounded-sm transition-colors duration-300 hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/35 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  Política de privacidade
                </Link>
              </div>
            </nav>

            <div className="mt-3.5 w-full min-w-0 sm:mt-4 sm:w-fit sm:shrink-0">
              <span className="inline-flex w-full max-w-full items-start gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3.5 py-2 text-left text-[11px] font-medium leading-[1.5] text-zinc-400 shadow-sm transition-[border-color,background-color,box-shadow] duration-300 hover:border-cyan-400/20 hover:bg-cyan-500/[0.04] sm:w-auto sm:items-center sm:gap-2.5 sm:px-4 sm:py-2 sm:text-xs sm:leading-snug md:whitespace-nowrap">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-cyan-400/85 sm:mt-0 sm:size-4" aria-hidden />
                <span className="min-w-0 sm:whitespace-nowrap">
                  Dados e operação pensados para o dia a dia da bancada
                </span>
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={staggerItem}
            className="flex min-w-0 flex-col items-stretch lg:items-end"
          >
            <div className="flex w-full max-w-full flex-col lg:ml-auto lg:w-fit lg:max-w-[min(100%,20.5rem)]">
              <FooterSectionTitle align="end">Contato & suporte</FooterSectionTitle>
              <div className="w-full max-w-full min-w-0 rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.025] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-sm transition-[border-color,box-shadow] duration-300 hover:border-white/[0.12] sm:min-w-[18.75rem] sm:p-[1.125rem] md:min-w-[19.5rem] md:px-5 md:py-[1.125rem]">
                <a
                  href="mailto:contato@barberapp.com.br"
                  className="group flex w-full min-w-0 items-center gap-3 text-zinc-200 transition-colors hover:text-white sm:gap-3.5"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/25 bg-cyan-500/[0.1] text-cyan-300 transition-[transform,border-color,background-color] duration-300 group-hover:scale-[1.03] group-hover:border-cyan-400/40 group-hover:bg-cyan-500/[0.14]">
                    <Mail className="size-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                      E-mail
                    </span>
                    <span className="relative mt-1 block text-[14px] font-medium leading-snug tracking-tight text-zinc-50 sm:text-[15px] sm:leading-[1.5]">
                      <span className="md:hidden">
                        contato@<wbr />
                        barberapp.com.br
                      </span>
                      <span className="hidden md:inline md:whitespace-nowrap">contato@barberapp.com.br</span>
                      <span
                        className="absolute -bottom-0.5 left-0 h-px w-full max-w-full origin-left scale-x-0 bg-gradient-to-r from-cyan-400/70 to-transparent transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
                        aria-hidden
                      />
                    </span>
                  </span>
                </a>
                <p className="mt-3.5 flex items-start gap-2 border-t border-white/[0.08] pt-3.5 text-[13px] leading-[1.5] text-zinc-500">
                  <Headphones className="mt-px size-4 shrink-0 text-zinc-500" strokeWidth={1.75} aria-hidden />
                  Resposta por e-mail em horário comercial.
                </p>
              </div>

              <div className="mt-4 border-t border-white/[0.06] pt-4 lg:flex lg:flex-col lg:items-end">
                <div className="mb-2 flex items-center justify-start gap-2 lg:justify-end lg:w-full">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Redes</p>
                  <span className="h-px w-4 shrink-0 bg-gradient-to-l from-cyan-400/40 to-transparent" aria-hidden />
                </div>
                <ul className="flex flex-wrap gap-2 justify-start lg:justify-end">
                  {social.map(({ label, href, icon: Icon }) => (
                    <li key={label}>
                      <motion.a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={label}
                        className={cn(
                          'group/social relative inline-flex size-10 items-center justify-center rounded-full',
                          'border border-white/[0.1] bg-white/[0.04] text-zinc-400',
                          'shadow-[0_2px_10px_-4px_rgba(0,0,0,0.45)]',
                          'transition-[color,border-color,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                          'hover:border-cyan-400/30 hover:bg-gradient-to-br hover:from-cyan-500/15 hover:to-teal-600/10 hover:text-cyan-100 hover:shadow-[0_6px_28px_-8px_rgba(34,211,238,0.18)]',
                        )}
                        whileHover={reduceMotion ? undefined : { y: -1.5 }}
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
                        <Icon className="relative size-[1.05rem]" strokeWidth={1.65} aria-hidden />
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="border-t border-white/[0.06] bg-gradient-to-b from-transparent to-zinc-950/80 py-3.5 md:py-4">
          <div className="flex w-full flex-col items-center justify-center gap-2.5 text-center lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:text-left">
            <p className="text-[13px] leading-snug text-zinc-500 lg:shrink-0">
              <span className="lg:whitespace-nowrap">
                © {new Date().getFullYear()}{' '}
                <span className="font-medium text-zinc-400">BarberApp</span>. Todos os direitos reservados.
              </span>
            </p>
            <p className="text-xs leading-[1.65] text-zinc-600 lg:shrink-0 lg:text-right lg:leading-snug">
              <span className="lg:whitespace-nowrap">
                Feito para donos e equipes que vivem a tesoura, com produto em evolução contínua.
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
