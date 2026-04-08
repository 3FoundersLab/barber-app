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
    title: 'Grade firme, buraco à mostra',
    description: 'Marca, remarca, encaixe e vê quem tá livre. Menos buraco no meio do dia cheio.',
  },
  {
    icon: Wallet,
    title: 'Dinheiro do dia separado direitinho',
    description: 'Corte, barba, combo, Pix e mensalista cada um no seu canto. Fecha a loja sabendo o que ficou.',
  },
  {
    icon: Users,
    title: 'Cliente com nome e história',
    description: 'Quem gosta de pezinho baixo, quem só vem de mês em mês. Atende melhor sem perguntar de novo.',
  },
  {
    icon: CreditCard,
    title: 'Mensalista no eixo',
    description: 'Quem paga fixo mês a mês fica sob controle. Você projeta o caixa antes do pagamento dos meninos.',
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
          <p className={landingEyebrow}>Ferramenta de bancada</p>
          <h2 className={landingSectionTitle}>Do “tem vaga?” ao “pago no Pix” — junto</h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Quatro coisas que qualquer barbearia usa todo santo dia, falando a mesma língua: horário, cliente, caixa e
            quem paga direto.
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
