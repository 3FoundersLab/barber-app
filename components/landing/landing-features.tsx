import { CalendarRange, CreditCard, Users, Wallet } from 'lucide-react'
import { LANDING_SECTIONS } from '@/components/landing/constants'

const cards = [
  {
    icon: CalendarRange,
    title: 'Agenda inteligente',
    description: 'Grade da equipe, horários e status em tempo real. Menos buracos, menos retrabalho para remarcar.',
  },
  {
    icon: Wallet,
    title: 'Controle financeiro',
    description: 'Receitas, assinaturas e visão do fluxo. Saiba o que a unidade gerou sem abrir dez abas.',
  },
  {
    icon: Users,
    title: 'Gestão de clientes',
    description: 'Perfil, histórico e relacionamento centralizados. Atendimento personalizado em escala.',
  },
  {
    icon: CreditCard,
    title: 'Planos e assinaturas',
    description: 'Cobrança recorrente e status sob controle. Previsibilidade para você e clareza para o cliente.',
  },
]

export function LandingFeatures() {
  return (
    <section
      id={LANDING_SECTIONS.funcionalidades}
      className="scroll-mt-24 bg-white py-20 dark:bg-zinc-950 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Funcionalidades
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            Tudo integrado no mesmo fluxo
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Módulos que conversam entre si — da reserva ao pagamento, sem soluções paralelas.
          </p>
        </div>
        <ul className="mt-16 grid gap-6 sm:grid-cols-2">
          {cards.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex gap-5 rounded-2xl border border-zinc-200/80 bg-zinc-50/30 p-6 transition-all duration-300 hover:border-amber-200/70 hover:bg-white hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-amber-500/25 dark:hover:bg-zinc-900 sm:p-8"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Icon className="size-6" aria-hidden />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-base">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
