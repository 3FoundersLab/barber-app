import { CalendarRange, CreditCard, Users, Wallet } from 'lucide-react'
import { LANDING_SECTIONS } from '@/components/landing/constants'
import {
  landingCardClass,
  landingContainer,
  landingEyebrow,
  landingSectionLead,
  landingSectionTitle,
  landingSectionY,
} from '@/components/landing/landing-classes'
import { cn } from '@/lib/utils'

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
      className={cn('scroll-mt-24 bg-white dark:bg-zinc-950', landingSectionY)}
    >
      <div className={landingContainer}>
        <div className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Funcionalidades</p>
          <h2 className={landingSectionTitle}>Tudo integrado no mesmo fluxo</h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Módulos que conversam entre si — da reserva ao pagamento, sem soluções paralelas.
          </p>
        </div>
        <ul className="mt-20 grid gap-6 sm:grid-cols-2 lg:gap-8">
          {cards.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className={cn(
                landingCardClass(true),
                'flex gap-6 p-7 sm:gap-7 sm:p-9',
                'hover:border-amber-200/70 dark:hover:border-amber-500/20',
              )}
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/[0.12] text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                <Icon className="size-6" aria-hidden />
              </span>
              <div className="min-w-0 pt-0.5">
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-[0.9375rem] dark:text-zinc-400">
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
