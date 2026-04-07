import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div
        className="animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-2xl shadow-zinc-900/10 duration-700 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/40"
        style={{ animationFillMode: 'both' }}
      >
        <div className="flex h-10 items-center gap-2 border-b border-zinc-100 bg-zinc-50/80 px-3 dark:border-zinc-800 dark:bg-zinc-800/50">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/90" />
            <span className="size-2.5 rounded-full bg-amber-400/90" />
            <span className="size-2.5 rounded-full bg-emerald-400/90" />
          </div>
          <span className="ml-2 text-xs text-zinc-400">app.barbearia.com/dashboard</span>
        </div>
        <div className="flex min-h-[220px] sm:min-h-[280px]">
          <aside className="hidden w-14 shrink-0 border-r border-zinc-100 bg-zinc-50/50 sm:block dark:border-zinc-800 dark:bg-zinc-800/30" />
          <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Visão geral</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">Dashboard</p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Hoje +12%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { h: 'h-16', c: 'from-amber-400 to-orange-500' },
                { h: 'h-24', c: 'from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-500' },
                { h: 'h-20', c: 'from-emerald-400 to-teal-500' },
              ].map((bar, i) => (
                <div
                  key={i}
                  className={`rounded-lg bg-gradient-to-t ${bar.c} ${bar.h} opacity-90 transition-transform duration-300 hover:scale-[1.02]`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Agendamentos</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">48</p>
              </div>
              <div className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Clientes</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">312</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute -right-6 -bottom-6 -z-10 size-48 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-500/10"
        aria-hidden
      />
    </div>
  )
}

export function LandingHero() {
  return (
    <section
      id={LANDING_SECTIONS.top}
      className="scroll-mt-24 bg-gradient-to-b from-zinc-50 via-white to-white pt-28 pb-16 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 md:pb-24"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-700" style={{ animationFillMode: 'both' }}>
          <p className="mb-4 inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Plataforma completa para barbearias
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1] dark:text-white">
            Gerencie sua barbearia de forma simples e eficiente
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Agendamentos, clientes, planos e relatórios em um só lugar. Menos planilhas, mais tempo com seus
            clientes na cadeira.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-8 text-base font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:scale-[1.02] hover:from-amber-600 hover:to-orange-700 hover:text-white active:scale-[0.98]"
            >
              <Link href={LANDING_LINKS.cadastro}>Começar agora</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-xl border-zinc-300 bg-white/80 text-base font-medium text-zinc-800 backdrop-blur hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <Link href={`#${LANDING_SECTIONS.comoFunciona}`}>Ver como funciona</Link>
            </Button>
          </div>
        </div>
        <DashboardMockup />
      </div>
    </section>
  )
}
