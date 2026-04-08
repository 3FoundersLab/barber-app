'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AppBrandLogo } from '@/components/shared/app-brand-logo'
import { LANDING_CTA, LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import { landingContainer, landingPrimaryCtaClass, landingTrialCtaClass } from '@/components/landing/landing-classes'

const links = [
  { href: `#${LANDING_SECTIONS.desafios}`, label: 'Na rotina' },
  { href: `#${LANDING_SECTIONS.beneficios}`, label: 'Na prática' },
  { href: `#${LANDING_SECTIONS.comoFunciona}`, label: 'Como entra' },
  { href: `#${LANDING_SECTIONS.planos}`, label: 'Mensalidade' },
] as const

/** Navegação um pouco mais leve que os CTAs (hierarquia visual). */
const navLinkClass =
  'shrink-0 whitespace-nowrap text-sm font-semibold text-zinc-800 transition-colors hover:text-[#ea580c] dark:text-zinc-200 dark:hover:text-amber-400'

const pillPrimaryClass = cn(
  landingPrimaryCtaClass,
  'h-11 shrink-0 px-6 text-xs uppercase tracking-wide transition sm:px-7',
)

const pillSecondaryClass = cn(
  landingTrialCtaClass,
  'h-11 shrink-0 px-5 text-xs uppercase tracking-wide transition sm:px-6',
)

export function LandingNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 z-50 w-full border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div
        className={cn(
          landingContainer,
          'flex h-[4.75rem] w-full max-w-full min-w-0 items-center gap-3 lg:h-[5rem] lg:gap-4 xl:gap-6',
        )}
      >
        <div className="shrink-0">
          <AppBrandLogo
            href={`#${LANDING_SECTIONS.top}`}
            textClassName="text-zinc-950 dark:text-white"
            onClick={() => setOpen(false)}
          />
        </div>

        {/* flex-1 + min-w-0: ocupa só o espaço ENTRE logo e botões — não invade os CTAs */}
        <nav
          className="mx-1 hidden min-h-0 min-w-0 flex-1 flex-wrap items-center justify-center gap-x-4 gap-y-1 lg:flex xl:gap-x-6 2xl:gap-x-8"
          aria-label="Principal"
        >
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className={navLinkClass}>
              {label}
            </Link>
          ))}
        </nav>

        <div
          className={cn(
            'relative z-20 ml-auto flex shrink-0 items-center gap-2 bg-white dark:bg-zinc-950',
            'pl-2 lg:ml-0 lg:gap-3 lg:pl-3 xl:gap-4',
          )}
        >
          <div className="hidden items-center gap-3 lg:flex xl:gap-4">
            <Button asChild variant="ghost" className={pillSecondaryClass}>
              <Link href={LANDING_LINKS.login}>{LANDING_CTA.navSecondary}</Link>
            </Button>
            <Button asChild variant="ghost" className={pillPrimaryClass}>
              <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.navPrimary}</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Button asChild variant="ghost" className={cn(pillPrimaryClass, 'h-9 px-4 text-[10px]')}>
              <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.navPrimary}</Link>
            </Button>
            <button
              type="button"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-zinc-900 bg-white text-zinc-900 dark:border-zinc-100 dark:bg-zinc-950 dark:text-white"
              aria-expanded={open}
              aria-controls="landing-mobile-menu"
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      <div
        id="landing-mobile-menu"
        className={cn(
          'max-h-[min(75vh,calc(100dvh-4.75rem))] overflow-y-auto border-t border-zinc-200 bg-white px-5 py-6 dark:border-zinc-800 dark:bg-zinc-950 lg:hidden',
          !open && 'hidden',
        )}
      >
        <div className="flex flex-col gap-2">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl px-3 py-3.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <Link
              href={LANDING_LINKS.login}
              className="rounded-full border-2 border-zinc-900 py-3.5 text-center text-xs font-bold uppercase tracking-wide text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
              onClick={() => setOpen(false)}
            >
              {LANDING_CTA.navSecondary}
            </Link>
            <Button asChild variant="ghost" className={cn(pillPrimaryClass, 'w-full')}>
              <Link href={LANDING_LINKS.cadastro} onClick={() => setOpen(false)}>
                {LANDING_CTA.navPrimary}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
