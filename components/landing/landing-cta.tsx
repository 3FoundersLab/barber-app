import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LANDING_LINKS } from '@/components/landing/constants'

export function LandingCta() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 px-8 py-16 text-center shadow-2xl dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 sm:px-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(245, 158, 11, 0.35), transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(234, 88, 12, 0.25), transparent 45%)`,
            }}
            aria-hidden
          />
          <div className="relative">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Pronto para organizar sua barbearia?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-300">
              Cadastre-se em minutos e comece a usar agendamentos, clientes e métricas no mesmo painel.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-8 h-12 rounded-xl bg-white px-10 text-base font-semibold text-zinc-900 shadow-lg transition hover:scale-[1.03] hover:bg-zinc-100"
            >
              <Link href={LANDING_LINKS.cadastro}>Criar minha barbearia</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
