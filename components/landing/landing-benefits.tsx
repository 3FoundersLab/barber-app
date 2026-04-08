import { Clock, LayoutGrid, TrendingUp, Wallet, type LucideIcon } from 'lucide-react'
import { LANDING_SECTIONS } from '@/components/landing/constants'

type Item = { icon: LucideIcon; title: string; description: string }

const items: Item[] = [
  {
    icon: TrendingUp,
    title: 'Mais clientes',
    description: 'Histórico e recorrência na palma da mão. Você lembra do cliente antes dele lembrar de você.',
  },
  {
    icon: LayoutGrid,
    title: 'Mais organização',
    description: 'Agenda e equipe alinhadas. Todo mundo enxerga o mesmo dia — sem versões conflitantes.',
  },
  {
    icon: Wallet,
    title: 'Mais faturamento',
    description: 'Visão do que entra, assinaturas e picos de demanda. Decisões com número, não com achismo.',
  },
  {
    icon: Clock,
    title: 'Economia de tempo',
    description: 'Menos mensagens e planilhas. O sistema faz o trabalho chato; você foca no corte e na experiência.',
  },
]

export function LandingBenefits() {
  return (
    <section
      id={LANDING_SECTIONS.beneficios}
      className="scroll-mt-24 border-y border-zinc-100 bg-zinc-50/40 py-20 dark:border-zinc-800 dark:bg-zinc-900/30 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Resultados
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            O que muda no seu negócio
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Benefícios diretos para quem quer escalar sem perder o padrão da cadeira.
          </p>
        </div>
        <ul className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="group flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-200/80 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-amber-500/30"
            >
              <div className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-amber-600 transition-transform group-hover:scale-105 dark:text-amber-400">
                <Icon className="size-6" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
