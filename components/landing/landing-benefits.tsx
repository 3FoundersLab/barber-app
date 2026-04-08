import { Clock, LayoutGrid, TrendingUp, Wallet, type LucideIcon } from 'lucide-react'
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
      className={cn(
        'scroll-mt-24 border-b border-zinc-200/80 bg-[#f4f4f5] dark:border-zinc-800 dark:bg-zinc-900/50',
        landingSectionY,
      )}
    >
      <div className={landingContainer}>
        <div className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Resultados</p>
          <h2 className={landingSectionTitle}>O que muda no seu negócio</h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Benefícios diretos para quem quer escalar sem perder o padrão da cadeira.
          </p>
        </div>
        <ul className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {items.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className={cn(
                landingCardClass(true),
                'group flex flex-col p-7 sm:p-8',
                'hover:border-amber-200/80 dark:hover:border-amber-500/25',
              )}
            >
              <div className="mb-6 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/12 to-orange-500/8 text-amber-700 transition-transform duration-300 group-hover:scale-105 dark:text-amber-400">
                <Icon className="size-6" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">{title}</h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
