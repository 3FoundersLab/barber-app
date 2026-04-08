import { Banknote, CalendarX, UsersRound } from 'lucide-react'
import { LANDING_SECTIONS } from '@/components/landing/constants'

const pains = [
  {
    icon: CalendarX,
    title: 'Agenda espalhada',
    text: 'Caderno, WhatsApp e lembretes soltos. Buracos na grade e retrabalho para remarcar.',
  },
  {
    icon: UsersRound,
    title: 'Cadeira vazia',
    text: 'Faltas e desmarcações de última hora sem visão do que isso custa ao mês.',
  },
  {
    icon: Banknote,
    title: 'Financeiro no feeling',
    text: 'Difícil saber o que entrou, o que é assinatura e onde está o lucro real.',
  },
]

const outcomes = [
  'Agenda unificada com visão da equipe e do dia.',
  'Clientes e histórico centralizados para fidelizar.',
  'Números claros: receitas, planos e indicadores no painel.',
]

export function LandingProblemSolution() {
  return (
    <section
      id={LANDING_SECTIONS.desafios}
      className="scroll-mt-24 border-b border-zinc-100 bg-white py-20 dark:border-zinc-800 dark:bg-zinc-950 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Do caos ao controle
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            O dia a dia da barbearia não precisa ser uma corrida contra o relógio
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Quando a operação não conversa, você perde tempo, dinheiro e oportunidade de encantar quem senta na
            cadeira.
          </p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2 lg:items-stretch lg:gap-16">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Sons familiares?</p>
            <ul className="flex flex-col gap-4">
              {pains.map(({ icon: Icon, title, text }) => (
                <li
                  key={title}
                  className="flex gap-4 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-5 dark:border-zinc-800 dark:bg-zinc-900/60"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-200/80 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex flex-col justify-center rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-500/[0.07] via-white to-orange-500/[0.06] p-8 shadow-sm dark:border-amber-500/20 dark:from-amber-500/10 dark:via-zinc-900 dark:to-orange-500/5 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              A solução
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Um sistema pensado para a rotina da barbearia
            </h3>
            <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              O BarberApp reúne agenda, clientes, financeiro e assinaturas em um fluxo só — para você decidir rápido
              e trabalhar com método.
            </p>
            <ul className="mt-8 flex flex-col gap-3">
              {outcomes.map((line) => (
                <li key={line} className="flex gap-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-current" aria-hidden />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
