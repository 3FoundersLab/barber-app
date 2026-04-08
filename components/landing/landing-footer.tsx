'use client'

import Link from 'next/link'
import { Instagram, Linkedin, Mail } from 'lucide-react'
import { AppBrandLogo } from '@/components/shared/app-brand-logo'
import { LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import { landingContainer, landingSectionYCompact } from '@/components/landing/landing-classes'
import { LandingFadeIn } from '@/components/landing/landing-reveal'
import { cn } from '@/lib/utils'

const footerLinks = [
  { label: 'Início', href: `#${LANDING_SECTIONS.top}` },
  { label: 'Problema', href: `#${LANDING_SECTIONS.problema}` },
  { label: 'Solução', href: `#${LANDING_SECTIONS.solucao}` },
  { label: 'Benefícios', href: `#${LANDING_SECTIONS.beneficios}` },
  { label: 'Funcionalidades', href: `#${LANDING_SECTIONS.funcionalidades}` },
  { label: 'Prova social', href: `#${LANDING_SECTIONS.provaSocial}` },
  { label: 'Como funciona', href: `#${LANDING_SECTIONS.comoFunciona}` },
  { label: 'Planos', href: `#${LANDING_SECTIONS.planos}` },
]

const social = [
  { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
  { label: 'E-mail', href: 'mailto:contato@barberapp.com.br', icon: Mail },
]

export function LandingFooter() {
  return (
    <footer
      className={cn(
        'border-t border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-950',
        landingSectionYCompact,
      )}
    >
      <div className={landingContainer}>
        <LandingFadeIn>
          <div className="flex flex-col gap-14 md:flex-row md:items-start md:justify-between md:gap-10">
            <div className="max-w-sm">
              <AppBrandLogo
                href={`#${LANDING_SECTIONS.top}`}
                textClassName="text-zinc-950 dark:text-white"
                className="inline-flex"
              />
              <p className="mt-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Grade, ficha do cliente e caixa na mesma tela. Menos improviso na bancada. Mais corte pago no fim do dia.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-950 dark:text-white">Navegação</p>
              <ul className="mt-5 flex flex-col gap-2.5">
                {footerLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-zinc-600 transition-colors duration-300 hover:text-amber-700 dark:text-zinc-400 dark:hover:text-amber-400"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href={LANDING_LINKS.login}
                    className="text-sm text-zinc-600 transition-colors duration-300 hover:text-amber-700 dark:text-zinc-400 dark:hover:text-amber-400"
                  >
                    Entrar
                  </Link>
                </li>
                <li>
                  <Link
                    href={LANDING_LINKS.cadastro}
                    className="text-sm text-zinc-600 transition-colors duration-300 hover:text-amber-700 dark:text-zinc-400 dark:hover:text-amber-400"
                  >
                    Cadastro
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-950 dark:text-white">Contato</p>
              <p className="mt-5 text-sm text-zinc-600 dark:text-zinc-400">
                <a href="mailto:contato@barberapp.com.br" className="transition-colors duration-300 hover:text-amber-700 dark:hover:text-amber-400">
                  contato@barberapp.com.br
                </a>
              </p>
              <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-zinc-950 dark:text-white">Redes</p>
              <ul className="mt-4 flex gap-3">
                {social.map(({ label, href, icon: Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50/80 text-zinc-600 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-amber-300/80 hover:text-amber-700 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-amber-500/40 dark:hover:text-amber-400"
                      aria-label={label}
                    >
                      <Icon className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-16 border-t border-zinc-200/90 pt-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
            © {new Date().getFullYear()} BarberApp. Todos os direitos reservados.
          </p>
        </LandingFadeIn>
      </div>
    </footer>
  )
}
