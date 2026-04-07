import { LayoutDashboard, PieChart, UserCog, Wallet } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LANDING_SECTIONS } from '@/components/landing/constants'

const cards = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard com gráficos',
    description: 'Visão consolidada de desempenho, tendências e KPIs da sua unidade.',
  },
  {
    icon: Wallet,
    title: 'Controle de pagamentos',
    description: 'Acompanhe recebimentos, assinaturas e fluxo financeiro com clareza.',
  },
  {
    icon: UserCog,
    title: 'Gestão de usuários',
    description: 'Equipe, permissões e perfis organizados para escalar com segurança.',
  },
  {
    icon: PieChart,
    title: 'Relatórios',
    description: 'Exporte insights para planejar campanhas, metas e horários de pico.',
  },
]

export function LandingFeatures() {
  return (
    <section
      id={LANDING_SECTIONS.funcionalidades}
      className="scroll-mt-24 bg-zinc-50/80 py-20 dark:bg-zinc-900/50 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            Funcionalidades principais
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Módulos que conversam entre si — menos retrabalho, mais consistência no atendimento.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {cards.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="border-zinc-200/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-200/60 hover:shadow-lg dark:border-zinc-700 dark:hover:border-amber-500/25"
            >
              <CardHeader className="gap-3">
                <div className="inline-flex size-11 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Icon className="size-5" aria-hidden />
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
