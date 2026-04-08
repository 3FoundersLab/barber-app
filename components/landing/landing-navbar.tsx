'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AppBrandLogo } from '@/components/shared/app-brand-logo'
import { LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'

const navClass =
  'text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'

const links = [
  { href: `#${LANDING_SECTIONS.desafios}`, label: 'Desafios' },
  { href: `#${LANDING_SECTIONS.beneficios}`, label: 'Benefícios' },
  { href: `#${LANDING_SECTIONS.funcionalidades}`, label: 'Funcionalidades' },
  { href: `#${LANDING_SECTIONS.comoFunciona}`, label: 'Como funciona' },
  { href: `#${LANDING_SECTIONS.planos}`, label: 'Planos' },
] as const

export function LandingNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 z-50 w-full border-b border-zinc-200/80 bg-white/85 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <AppBrandLogo
          href={`#${LANDING_SECTIONS.top}`}
          textClassName="text-zinc-900 dark:text-white"
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
            size="sm"
            className="shrink-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-orange-700 hover:text-white"
          >
            <Link href={LANDING_LINKS.cadastro}>Começar</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <Button
            asChild
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 hover:text-white"
          >
            <Link href={LANDING_LINKS.cadastro}>Começar</Link>
          </Button>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
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
          'max-h-[min(70vh,calc(100dvh-4rem))] overflow-y-auto border-t border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 lg:hidden',
          !open && 'hidden',
        )}
      >
        <div className="flex flex-col gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            href={LANDING_LINKS.login}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={() => setOpen(false)}
          >
            Entrar
          </Link>
        </div>
      </div>
    </header>
  )
}
