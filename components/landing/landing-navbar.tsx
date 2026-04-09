'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AppBrandLogo } from '@/components/shared/app-brand-logo'
import { LANDING_CTA, LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import {
  landingButtonLift,
  landingContainer,
  landingNavLinkMicro,
  landingPrimaryCtaClass,
  landingTrialCtaClass,
} from '@/components/landing/landing-classes'
import { ThemeToggle } from '@/components/shared/theme-toggle'

const links = [
  { href: `#${LANDING_SECTIONS.problema}`, label: 'Problema' },
  { href: `#${LANDING_SECTIONS.solucao}`, label: 'Solução' },
  { href: `#${LANDING_SECTIONS.beneficios}`, label: 'Benefícios' },
  { href: `#${LANDING_SECTIONS.funcionalidades}`, label: 'Funcionalidades' },
  { href: `#${LANDING_SECTIONS.planos}`, label: 'Planos' },
] as const

const navSectionIds = links.map((l) => l.href.replace(/^#/, ''))

/** Navegação um pouco mais leve que os CTAs (hierarquia visual). */
const navLinkBaseClass = cn(
  'shrink-0 whitespace-nowrap text-sm font-semibold text-zinc-800 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-primary dark:text-zinc-200 dark:hover:text-primary',
  landingNavLinkMicro,
)

const pillPrimaryClass = cn(
  landingPrimaryCtaClass,
  landingButtonLift,
  'h-11 shrink-0 px-6 text-xs uppercase tracking-wide sm:px-7',
)

const pillSecondaryClass = cn(
  landingTrialCtaClass,
  landingButtonLift,
  'h-11 shrink-0 px-5 text-xs uppercase tracking-wide sm:px-6',
)

export function LandingNavbar() {
  const [open, setOpen] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

  useEffect(() => {
    const applyHash = () => {
      const id = window.location.hash.replace(/^#/, '')
      if (id && navSectionIds.includes(id)) {
        setActiveSectionId(id)
      }
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)

    const elements = navSectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el != null)

    if (elements.length === 0) {
      return () => window.removeEventListener('hashchange', applyHash)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        visible.sort(
          (a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top,
        )
        const id = visible[0].target.id
        if (navSectionIds.includes(id)) {
          setActiveSectionId(id)
        }
      },
      { root: null, rootMargin: '-72px 0px -48% 0px', threshold: 0 },
    )

    elements.forEach((el) => observer.observe(el))

    return () => {
      window.removeEventListener('hashchange', applyHash)
      observer.disconnect()
    }
  }, [])

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

        {/* flex-1 + min-w-0: ocupa só o espaço entre logo e botões, sem invadir os CTAs */}
        <nav
          className="mx-1 hidden min-h-0 min-w-0 flex-1 flex-wrap items-center justify-center gap-x-4 gap-y-1 lg:flex xl:gap-x-6 2xl:gap-x-8"
          aria-label="Principal"
        >
          {links.map(({ href, label }) => {
            const id = href.replace(/^#/, '')
            const isActive = activeSectionId === id
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  navLinkBaseClass,
                  isActive && 'text-primary dark:text-primary after:scale-x-100',
                )}
                aria-current={isActive ? 'location' : undefined}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div
          className={cn(
            'relative z-20 ml-auto flex shrink-0 items-center gap-2 bg-white dark:bg-zinc-950',
            'pl-2 lg:ml-0 lg:gap-3 lg:pl-3 xl:gap-4',
          )}
        >
          <div className="hidden items-center gap-3 lg:flex xl:gap-4">
            <ThemeToggle inline variant="landing" />
            <Button asChild variant="ghost" className={pillSecondaryClass}>
              <Link href={LANDING_LINKS.login}>{LANDING_CTA.navSecondary}</Link>
            </Button>
            <Button asChild variant="ghost" className={pillPrimaryClass}>
              <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.navPrimary}</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle inline variant="landing" />
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
          {links.map(({ href, label }) => {
            const id = href.replace(/^#/, '')
            const isActive = activeSectionId === id
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-xl px-3 py-3.5 text-sm font-semibold text-zinc-900 transition-[color,transform,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:scale-[0.99] dark:text-zinc-100',
                  'hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/10 dark:hover:text-primary',
                  isActive && 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary',
                )}
                aria-current={isActive ? 'location' : undefined}
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            )
          })}
          <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Aparência
              </span>
              <ThemeToggle inline variant="landing" />
            </div>
            <Link
              href={LANDING_LINKS.login}
              className="rounded-full border-2 border-zinc-900 py-3.5 text-center text-xs font-bold uppercase tracking-wide text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
              onClick={() => setOpen(false)}
            >
              {LANDING_CTA.navSecondary}
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
