import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LANDING_LINKS } from '@/components/landing/constants'

export function LandingCta() {
  return (
    <section className="py-20 md:py-28" aria-labelledby="landing-cta-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-8 py-16 text-center shadow-2xl dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 sm:px-12 md:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage: `radial-gradient(circle at 15% 40%, rgba(245, 158, 11, 0.4), transparent 52%),
                radial-gradient(circle at 85% 75%, rgba(234, 88, 12, 0.28), transparent 48%)`,
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-2xl">
            <h2
              id="landing-cta-heading"
              className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.35rem] md:leading-tight"
            >
              Mais lucro e menos esforço na gestão da sua barbearia
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-zinc-300">
              Junte agenda, clientes e financeiro em um só sistema. Comece agora e veja a diferença na primeira semana.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 min-w-[200px] rounded-xl bg-white px-10 text-base font-semibold text-zinc-900 shadow-lg transition hover:scale-[1.03] hover:bg-zinc-100"
              >
                <Link href={LANDING_LINKS.cadastro}>Criar minha barbearia</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-zinc-500/60 bg-transparent text-base font-medium text-white hover:bg-white/10 hover:text-white"
              >
                <Link href={LANDING_LINKS.login}>Já tenho conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
