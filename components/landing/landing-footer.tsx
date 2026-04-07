import Link from 'next/link'
import { Instagram, Linkedin, Mail } from 'lucide-react'
import { LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'

const footerLinks = [
  { label: 'Início', href: `#${LANDING_SECTIONS.top}` },
  { label: 'Benefícios', href: `#${LANDING_SECTIONS.beneficios}` },
  { label: 'Como funciona', href: `#${LANDING_SECTIONS.comoFunciona}` },
  { label: 'Funcionalidades', href: `#${LANDING_SECTIONS.funcionalidades}` },
  { label: 'Planos', href: `#${LANDING_SECTIONS.planos}` },
]

const social = [
  { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
  { label: 'E-mail', href: 'mailto:contato@barberapp.com.br', icon: Mail },
]

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 py-14 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href={`#${LANDING_SECTIONS.top}`} className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-white">
              <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white">
                B
              </span>
              BarberApp
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Gestão completa para barbearias modernas. Feito para quem corta bem e quer vender melhor.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Links úteis</p>
            <ul className="mt-4 flex flex-col gap-2">
              {footerLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-zinc-600 transition-colors hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={LANDING_LINKS.login}
                  className="text-sm text-zinc-600 transition-colors hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href={LANDING_LINKS.cadastro}
                  className="text-sm text-zinc-600 transition-colors hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400"
                >
                  Cadastro
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Contato</p>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              <a href="mailto:contato@barberapp.com.br" className="hover:text-amber-600 dark:hover:text-amber-400">
                contato@barberapp.com.br
              </a>
            </p>
            <p className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white">Redes</p>
            <ul className="mt-3 flex gap-3">
              {social.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition hover:border-amber-300 hover:text-amber-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-amber-500/50 dark:hover:text-amber-400"
                    aria-label={label}
                  >
                    <Icon className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-12 border-t border-zinc-200 pt-8 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
          © {new Date().getFullYear()} BarberApp. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
