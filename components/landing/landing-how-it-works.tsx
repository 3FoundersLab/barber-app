import { Building2, Rocket, SlidersHorizontal } from 'lucide-react'
import { LANDING_SECTIONS } from '@/components/landing/constants'

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
    <section id={LANDING_SECTIONS.comoFunciona} className="scroll-mt-24 bg-white py-20 dark:bg-zinc-950 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Onboarding
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            Como funciona
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Três passos para sair do improviso e passar a operar com painel profissional.
          </p>
        </div>
        <ol className="mt-16 grid gap-8 md:grid-cols-3 md:gap-6">
          {steps.map(({ step, icon: Icon, title, text }, i) => (
            <li
              key={step}
              className="relative rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/30"
            >
              {i < steps.length - 1 ? (
                <span
                  className="absolute top-1/2 -right-3 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-xs font-bold text-zinc-400 md:flex dark:border-zinc-700 dark:bg-zinc-900"
                  aria-hidden
                >
                  →
                </span>
              ) : null}
              <span className="mx-auto mb-5 flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white shadow-md">
                {step}
              </span>
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-zinc-700 shadow-sm dark:bg-zinc-800 dark:text-zinc-200">
                <Icon className="size-7" aria-hidden />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
