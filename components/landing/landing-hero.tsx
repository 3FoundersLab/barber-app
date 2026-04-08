import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LANDING_CTA, LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import { landingContainer, landingPrimaryCtaClass, landingTrialCtaClass } from '@/components/landing/landing-classes'
import { cn } from '@/lib/utils'

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div
        className="animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden rounded-3xl border border-zinc-200/95 bg-white shadow-[0_24px_48px_-12px_rgba(24,24,27,0.12),0_12px_24px_-8px_rgba(24,24,27,0.08)] ring-1 ring-zinc-950/[0.04] duration-700 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45)] dark:ring-white/[0.06]"
        style={{ animationFillMode: 'both' }}
      >
        <div className="flex h-11 items-center gap-2 border-b border-zinc-100 bg-zinc-50/90 px-4 dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-red-400/90" />
            <span className="size-2.5 rounded-full bg-amber-400/90" />
            <span className="size-2.5 rounded-full bg-emerald-400/90" />
          </div>
          <span className="ml-2 font-mono text-[11px] text-zinc-500 dark:text-zinc-500">app.barbearia.com/dashboard</span>
        </div>
        <div className="flex min-h-[248px] sm:min-h-[308px]">
          <aside className="hidden w-[3.25rem] shrink-0 border-r border-zinc-100 bg-zinc-50/60 sm:block dark:border-zinc-800 dark:bg-zinc-900/50" />
          <div className="flex flex-1 flex-col gap-6 p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Sua barbearia · hoje
                </p>
                <p className="mt-1 text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">Tudo numa tela</p>
              </div>
              <span className="rounded-full bg-emerald-600/10 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400">
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
                  className={`rounded-xl bg-gradient-to-t ${bar.c} ${bar.h} opacity-90 transition-transform duration-300 hover:scale-[1.02]`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/90 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Horários hoje</p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-zinc-950 dark:text-white">
                  48
                </p>
              </div>
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/90 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Quem volta</p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-zinc-950 dark:text-white">
                  312
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute -right-10 -bottom-10 -z-10 size-64 rounded-full bg-gradient-to-tr from-amber-400/25 to-orange-500/15 blur-3xl dark:from-amber-500/15 dark:to-orange-600/10"
        aria-hidden
      />
    </div>
  )
}

export function LandingHero() {
  return (
    <section
      id={LANDING_SECTIONS.top}
      className="scroll-mt-24 bg-gradient-to-b from-zinc-100/80 via-[#f7f7f8] to-[#f7f7f8] pt-32 pb-24 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-950 md:pb-32 lg:pt-36 lg:pb-36"
    >
      <div
        className={`${landingContainer} grid items-center gap-16 lg:grid-cols-[1fr_minmax(0,1.06fr)] lg:gap-20 xl:gap-24`}
      >
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-700" style={{ animationFillMode: 'both' }}>
          <p className="mb-5 inline-flex items-center rounded-full border border-amber-200/90 bg-amber-50/90 px-4 py-1.5 text-xs font-semibold text-amber-950 shadow-sm dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100">
            Feito pra quem manda na barbearia
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl sm:leading-[1.06] lg:text-[3.125rem] lg:leading-[1.04] dark:text-white">
            Organize sua barbearia, aumente seu faturamento e nunca mais perca clientes
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
            <span className="font-semibold text-zinc-950 dark:text-zinc-100">BarberApp</span> junta agenda, clientes e
            dinheiro num só lugar. Você vê o dia inteiro em segundos — no celular ou no computador. Chega de planilha e
            de Zap virar agenda oficial.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <Button
              asChild
              variant="ghost"
              size="lg"
              className={cn('h-14 rounded-xl px-9 text-base', landingPrimaryCtaClass)}
            >
              <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.primary}</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className={cn('h-14 rounded-xl px-7 text-base', landingTrialCtaClass)}
            >
              <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.trial}</Link>
            </Button>
          </div>
          <p className="mt-2 text-center text-[11px] font-bold uppercase tracking-wide text-orange-800/90 sm:text-left dark:text-amber-300/90">
            {LANDING_CTA.urgencyBanner}
          </p>
          <Link
            href={`#${LANDING_SECTIONS.funcionalidades}`}
            className="mt-5 inline-block text-sm font-semibold text-zinc-500 underline-offset-4 transition hover:text-zinc-800 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Ver o que muda na prática →
          </Link>
          <p className="mt-5 text-sm font-medium text-zinc-500 dark:text-zinc-500">
            100% em português · Menos correria, mais lucro
          </p>
        </div>
        <DashboardMockup />
      </div>
    </section>
  )
}
