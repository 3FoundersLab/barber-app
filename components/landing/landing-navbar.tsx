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
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = originalOverflow
    }
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [open])

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
        className={cn(
          'fixed inset-0 z-[70] bg-zinc-950/62 backdrop-blur-[2px] transition-opacity duration-300 ease-in-out lg:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />
      <aside
        id="landing-mobile-menu"
        className={cn(
          'fixed top-0 right-0 z-[80] flex h-dvh w-[min(80vw,400px)] max-w-[400px] flex-col border-l border-white/12 bg-zinc-950/98 shadow-[-22px_0_50px_rgba(0,0,0,0.45)] ring-1 ring-cyan-500/10 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:hidden',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-6">
          <AppBrandLogo
            href={`#${LANDING_SECTIONS.top}`}
            textClassName="text-white"
            onClick={() => setOpen(false)}
          />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full border border-zinc-700/85 bg-zinc-900 text-zinc-100 transition-colors duration-200 hover:border-zinc-500 hover:bg-zinc-800"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-5 py-6 sm:px-6">
          <nav className="flex flex-col gap-2.5" aria-label="Menu mobile da landing">
            {links.map(({ href, label }) => {
              const id = href.replace(/^#/, '')
              const isActive = activeSectionId === id
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'rounded-xl px-4 py-3.5 text-base font-semibold text-zinc-100 transition-[color,background-color,transform] duration-200 ease-in-out',
                    'hover:bg-white/8 hover:text-primary active:scale-[0.99]',
                    isActive && 'bg-white/10 text-primary',
                  )}
                  aria-current={isActive ? 'location' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-8 border-t border-white/10 pt-5">
            <Button asChild variant="ghost" className={cn(pillPrimaryClass, 'h-12 w-full text-sm')}>
              <Link href={LANDING_LINKS.cadastro} onClick={() => setOpen(false)}>
                {LANDING_CTA.primary}
              </Link>
            </Button>
          </div>
        </div>
      </aside>
    </header>
  )
}
