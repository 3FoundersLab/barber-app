import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LANDING_LINKS } from '@/components/landing/constants'
import { landingContainer, landingSectionYCompact } from '@/components/landing/landing-classes'
import { cn } from '@/lib/utils'

export function LandingCta() {
  return (
    <section
      className={cn('bg-[#f7f7f8] dark:bg-zinc-950', landingSectionYCompact)}
      aria-labelledby="landing-cta-heading"
    >
      <div className={landingContainer}>
        <div className="relative overflow-hidden rounded-[1.75rem] border border-zinc-800/90 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 px-8 py-16 text-center shadow-[0_24px_48px_-12px_rgba(0,0,0,0.35)] sm:px-12 md:py-20 lg:rounded-3xl">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.55]"
            style={{
              backgroundImage: `radial-gradient(circle at 18% 35%, rgba(245, 158, 11, 0.45), transparent 50%),
                radial-gradient(circle at 88% 78%, rgba(234, 88, 12, 0.3), transparent 46%)`,
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-2xl">
            <h2
              id="landing-cta-heading"
              className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-[2.375rem] md:leading-[1.15]"
            >
              Pronto pra encher a agenda e ver o caixa de outro jeito?
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-zinc-300 sm:text-lg">
              Cadastro leve. Em minutos você já enxerga a loja de outro ângulo — agenda, cliente e caixa alinhados.
            </p>
            <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button
                asChild
                size="lg"
                className="h-12 min-w-[200px] rounded-xl bg-white px-10 text-base font-semibold text-zinc-950 shadow-lg transition hover:scale-[1.02] hover:bg-zinc-100"
              >
                <Link href={LANDING_LINKS.cadastro}>Começar grátis</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-zinc-500/70 bg-white/5 text-base font-medium text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
              >
                <Link href={LANDING_LINKS.login}>Entrar na minha conta</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
