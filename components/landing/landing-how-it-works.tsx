import { Building2, Rocket, SlidersHorizontal } from 'lucide-react'
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

const steps = [
  {
    step: 1,
    icon: Building2,
    title: 'Crie sua barbearia',
    text: 'Cadastro rápido com dados do negócio. Em minutos você já entra no painel.',
  },
  {
    step: 2,
    icon: SlidersHorizontal,
    title: 'Configure agenda e equipe',
    text: 'Serviços, horários e profissionais do seu jeito. Tudo visível para quem atende.',
  },
  {
    step: 3,
    icon: Rocket,
    title: 'Opere com clareza',
    text: 'Agenda, clientes e financeiro no mesmo lugar — do primeiro corte à meta do mês.',
  },
]

export function LandingHowItWorks() {
  return (
    <section
      id={LANDING_SECTIONS.comoFunciona}
      className={cn('scroll-mt-24 bg-white dark:bg-zinc-950', landingSectionY)}
    >
      <div className={landingContainer}>
        <div className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Onboarding</p>
          <h2 className={landingSectionTitle}>Como funciona</h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Três passos para sair do improviso e passar a operar com painel profissional.
          </p>
        </div>
        <ol className="mt-20 grid gap-6 md:grid-cols-3 md:gap-8">
          {steps.map(({ step, icon: Icon, title, text }) => (
            <li
              key={step}
              className={cn(
                landingCardClass(),
                'flex flex-col items-center p-8 text-center sm:p-9',
                'h-full min-h-[280px]',
              )}
            >
              <span className="mb-6 flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white shadow-md shadow-amber-500/20">
                {step}
              </span>
              <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                <Icon className="size-7" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">{title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
