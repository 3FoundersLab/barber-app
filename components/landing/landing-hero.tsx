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
          <span className="ml-2 font-mono text-[11px] text-zinc-400">app.barbearia.com/dashboard</span>
        </div>
        <div className="flex min-h-[240px] sm:min-h-[300px]">
          <aside className="hidden w-14 shrink-0 border-r border-zinc-100 bg-zinc-50/50 sm:block dark:border-zinc-800 dark:bg-zinc-800/30" />
          <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Visão geral
                </p>
                <p className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">Hoje na unidade</p>
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Faturamento +12%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { h: 'h-16', c: 'from-amber-400 to-orange-500' },
                { h: 'h-28', c: 'from-zinc-300 to-zinc-400 dark:from-zinc-600 dark:to-zinc-500' },
                { h: 'h-20', c: 'from-emerald-400 to-teal-500' },
              ].map((bar, i) => (
                <div
                  key={i}
                  className={`rounded-lg bg-gradient-to-t ${bar.c} ${bar.h} opacity-90 transition-transform duration-300 hover:scale-[1.02]`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3.5 dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Agendamentos</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">48</p>
              </div>
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 p-3.5 dark:border-zinc-700 dark:bg-zinc-800/50">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Clientes ativos</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">312</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute -right-8 -bottom-8 -z-10 size-56 rounded-full bg-amber-400/20 blur-3xl dark:bg-amber-500/10"
        aria-hidden
      />
    </div>
  )
}

export function LandingHero() {
  return (
    <section
      id={LANDING_SECTIONS.top}
      className="scroll-mt-24 bg-gradient-to-b from-zinc-50 via-white to-white pt-28 pb-20 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 md:pb-28"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_minmax(0,1.05fr)] lg:gap-20 lg:px-8">
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-700" style={{ animationFillMode: 'both' }}>
          <p className="mb-5 inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Plataforma de gestão para barbearias
          </p>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl sm:leading-[1.08] lg:text-[3.35rem] lg:leading-[1.06] dark:text-white">
            Gerencie sua barbearia com mais lucro e menos esforço
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-zinc-600 sm:text-xl dark:text-zinc-400">
            Agenda, clientes, financeiro e assinaturas em um painel único. Menos improviso na bancada, mais previsão
            no caixa.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
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
              <Link href={`#${LANDING_SECTIONS.funcionalidades}`}>Ver o que está incluso</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-500">
            Cadastro em poucos minutos · Interface em português
          </p>
        </div>
        <DashboardMockup />
      </div>
    </section>
  )
}
