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
    title: 'Mais clientes na cadeira',
    description: 'Vê quem some e quem vale pena puxar de volta. Mais retorno. Menos lugar vazio.',
  },
  {
    icon: LayoutGrid,
    title: 'Dia redondo, equipe alinhada',
    description: 'Todo mundo olha o mesmo horário. Acabou o “eu não sabia desse corte”.',
  },
  {
    icon: Wallet,
    title: 'Caixa que você confia',
    description: 'Sabe o que vendeu, o que é mensalidade e onde está o pico. Decide com cabeça fria.',
  },
  {
    icon: Clock,
    title: 'Horas de volta pra você',
    description: 'Menos Zap, menos papel. Você corta; o resto roda sozinho.',
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
          <p className={landingEyebrow}>O que você sente</p>
          <h2 className={landingSectionTitle}>Mais gente, mais ordem, mais lucro</h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Nada de promessa vazia. É o que muda no bolso e na cabeça quando a loja para de viver no improviso.
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
