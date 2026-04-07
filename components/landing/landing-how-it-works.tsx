import { Building2, Rocket, Settings2 } from 'lucide-react'
import { LANDING_SECTIONS } from '@/components/landing/constants'

const steps = [
  {
    step: 1,
    icon: Building2,
    title: 'Cadastre sua barbearia',
    text: 'Crie sua conta e informe dados do negócio em poucos minutos.',
  },
  {
    step: 2,
    icon: Settings2,
    title: 'Configure seu plano',
    text: 'Escolha o plano ideal e alinhe cobrança com o tamanho da operação.',
  },
  {
    step: 3,
    icon: Rocket,
    title: 'Gerencie tudo em um só lugar',
    text: 'Dashboard, equipe, clientes e agenda integrados desde o primeiro dia.',
  },
]

export function LandingHowItWorks() {
  return (
    <section
      id={LANDING_SECTIONS.comoFunciona}
      className="scroll-mt-24 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            Como funciona
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Três passos para sair do papel — ou do grupo de WhatsApp — para um painel profissional.
          </p>
        </div>
        <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map(({ step, icon: Icon, title, text }) => (
            <li
              key={step}
              className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center shadow-sm transition-shadow duration-300 hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            >
              <span className="mx-auto mb-4 flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-white shadow-md">
                {step}
              </span>
              <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
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
