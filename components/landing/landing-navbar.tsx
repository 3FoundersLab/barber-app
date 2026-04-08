'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AppBrandLogo } from '@/components/shared/app-brand-logo'
import { LANDING_CTA, LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import { landingContainer, landingPrimaryCtaClass } from '@/components/landing/landing-classes'

const navClass =
  'text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-950 dark:text-zinc-500 dark:hover:text-white'

const links = [
  { href: `#${LANDING_SECTIONS.desafios}`, label: 'Na rotina' },
  { href: `#${LANDING_SECTIONS.beneficios}`, label: 'Na prática' },
  { href: `#${LANDING_SECTIONS.comoFunciona}`, label: 'Como entra' },
  { href: `#${LANDING_SECTIONS.planos}`, label: 'Mensalidade' },
] as const

export function LandingNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 z-50 w-full border-b border-zinc-200/90 bg-white/90 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className={cn(landingContainer, 'flex h-[4.25rem] items-center justify-between gap-3')}>
        <AppBrandLogo
          href={`#${LANDING_SECTIONS.top}`}
          textClassName="text-zinc-950 dark:text-white"
          onClick={() => setOpen(false)}
        />

        <nav className="hidden items-center gap-5 lg:flex xl:gap-6" aria-label="Principal">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className={navClass}>
              {label}
            </Link>
          ))}
          <Link href={LANDING_LINKS.login} className={navClass}>
            Entrar
          </Link>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={cn('h-10 shrink-0 rounded-lg px-4 text-sm', landingPrimaryCtaClass)}
          >
            <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.primary}</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <Button asChild variant="ghost" size="sm" className={cn('rounded-lg text-sm', landingPrimaryCtaClass)}>
            <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.primary}</Link>
          </Button>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-950 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div
        id="landing-mobile-menu"
        className={cn(
          'max-h-[min(70vh,calc(100dvh-4.25rem))] overflow-y-auto border-t border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950 lg:hidden',
          !open && 'hidden',
        )}
      >
        <div className="flex flex-col gap-0.5">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            href={LANDING_LINKS.login}
            className="rounded-lg px-3 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => setOpen(false)}
          >
            Entrar
          </Link>
        </div>
      </div>
    </header>
  )
}
