import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LANDING_LINKS, LANDING_SECTIONS } from '@/components/landing/constants'
import {
  landingCardClass,
  landingContainer,
  landingEyebrow,
  landingSectionLead,
  landingSectionTitle,
  landingSectionY,
} from '@/components/landing/landing-classes'
import { cn } from '@/lib/utils'

type Tier = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  highlighted?: boolean
  cta: string
  href: string
}

const tiers: Tier[] = [
  {
    name: 'Essencial',
    price: 'R$ 79',
    period: '/mês',
    description: 'Para quem está estruturando a primeira unidade.',
    features: ['Até 2 barbeiros', 'Agendamentos ilimitados', 'Gestão de clientes', 'Suporte por e-mail'],
    cta: 'Assinar',
    href: LANDING_LINKS.cadastro,
  },
  {
    name: 'Profissional',
    price: 'R$ 149',
    period: '/mês',
    description: 'O equilíbrio ideal para crescer com relatórios e equipe maior.',
    features: [
      'Até 8 barbeiros',
      'Dashboard e métricas',
      'Planos e assinaturas',
      'Relatórios exportáveis',
      'Suporte prioritário',
    ],
    highlighted: true,
    cta: 'Assinar',
    href: LANDING_LINKS.cadastro,
  },
  {
    name: 'Empresarial',
    price: 'Sob consulta',
    period: '',
    description: 'Rede de unidades ou operações com necessidades específicas.',
    features: ['Barbeiros ilimitados', 'Múltiplas unidades', 'Integrações', 'Gerente de conta dedicado'],
    cta: 'Falar com vendas',
    href: 'mailto:contato@barberapp.com.br?subject=Plano%20Empresarial%20BarberApp',
  },
]

export function LandingPricing() {
  return (
    <section
      id={LANDING_SECTIONS.planos}
      className={cn(
        'scroll-mt-24 border-t border-zinc-200/80 bg-[#f4f4f5] dark:border-zinc-800 dark:bg-zinc-900/50',
        landingSectionY,
      )}
    >
      <div className={landingContainer}>
        <div className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Investimento</p>
          <h2 className={landingSectionTitle}>Planos que acompanham seu crescimento</h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Valores ilustrativos — escolha o plano definitivo no cadastro. Sem surpresas na fatura.
          </p>
        </div>
        <div className="mt-20 grid gap-8 lg:grid-cols-3 lg:gap-6 xl:gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                landingCardClass(),
                'relative flex flex-col p-8 sm:p-9',
                tier.highlighted &&
                  'border-amber-400/90 shadow-md ring-2 ring-amber-500/25 dark:border-amber-500/40 dark:ring-amber-500/20',
              )}
            >
              {tier.highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-3.5 py-1 text-xs font-semibold text-white shadow-md">
                  Recomendado
                </span>
              ) : null}
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">{tier.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{tier.description}</p>
              <p className="mt-8 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-zinc-950 tabular-nums dark:text-white">
                  {tier.price}
                </span>
                {tier.period ? (
                  <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{tier.period}</span>
                ) : null}
              </p>
              <ul className="mt-8 flex flex-1 flex-col gap-3.5 text-sm text-zinc-700 dark:text-zinc-300">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    <span className="leading-snug">{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={cn(
                  'mt-10 h-11 w-full rounded-xl text-sm font-semibold transition hover:scale-[1.01] active:scale-[0.99]',
                  tier.highlighted
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-orange-700 hover:text-white'
                    : '',
                )}
                variant={tier.highlighted ? 'default' : 'outline'}
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
