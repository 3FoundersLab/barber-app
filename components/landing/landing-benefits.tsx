import {
  BarChart3,
  CalendarDays,
  CreditCard,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { LANDING_SECTIONS } from '@/components/landing/constants'

type Item = { icon: LucideIcon; title: string; description: string }

const items: Item[] = [
  {
    icon: Users,
    title: 'Gestão de clientes',
    description: 'Histórico, preferências e contato centralizados para fidelizar e vender mais.',
  },
  {
    icon: CreditCard,
    title: 'Planos e assinaturas',
    description: 'Controle de cobranças, periodicidade e status sem complicação.',
  },
  {
    icon: BarChart3,
    title: 'Relatórios e métricas',
    description: 'Indicadores claros para decidir com dados, não no achismo.',
  },
  {
    icon: CalendarDays,
    title: 'Agendamentos',
    description: 'Organize a agenda da equipe e reduza faltas com visão em tempo real.',
  },
]

export function LandingBenefits() {
  return (
    <section
      id={LANDING_SECTIONS.beneficios}
      className="scroll-mt-24 border-y border-zinc-100 bg-zinc-50/50 py-20 dark:border-zinc-800 dark:bg-zinc-900/40 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            Tudo o que você precisa para crescer
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Benefícios pensados para donos de barbearia que querem operação profissional sem dor de cabeça.
          </p>
        </div>
        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="group rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-200/80 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-amber-500/30"
            >
              <div className="mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 text-amber-600 transition-transform group-hover:scale-110 dark:text-amber-400">
                <Icon className="size-6" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
