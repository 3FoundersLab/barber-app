import { Banknote, CalendarX, UsersRound } from 'lucide-react'
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
      className={cn('scroll-mt-24 border-b border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950', landingSectionY)}
    >
      <div className={landingContainer}>
        <div className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Do caos ao controle</p>
          <h2 className={landingSectionTitle}>
            O dia a dia da barbearia não precisa ser uma corrida contra o relógio
          </h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Quando a operação não conversa, você perde tempo, dinheiro e oportunidade de encantar quem senta na
            cadeira.
          </p>
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-12 xl:gap-16">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Sons familiares?</p>
            <ul className="flex flex-col gap-5">
              {pains.map(({ icon: Icon, title, text }) => (
                <li
                  key={title}
                  className={cn(
                    landingCardClass(true),
                    'flex gap-5 p-6 sm:p-7',
                    'hover:border-zinc-300/80 dark:hover:border-zinc-600',
                  )}
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="text-base font-semibold text-zinc-950 dark:text-white">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={cn(
              'flex flex-col justify-center rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-500/[0.08] via-white to-orange-500/[0.06] p-8 shadow-sm ring-1 ring-amber-500/[0.08] dark:border-amber-500/20 dark:from-amber-500/[0.12] dark:via-zinc-950 dark:to-orange-500/[0.06] dark:ring-amber-500/10 sm:p-10 lg:p-11',
            )}
          >
            <p className={landingEyebrow}>A solução</p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-[1.65rem] sm:leading-snug">
              Um sistema pensado para a rotina da barbearia
            </h3>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              O BarberApp reúne agenda, clientes, financeiro e assinaturas em um fluxo só — para você decidir rápido e
              trabalhar com método.
            </p>
            <ul className="mt-10 flex flex-col gap-4">
              {outcomes.map((line) => (
                <li key={line} className="flex gap-3.5 text-sm font-medium leading-snug text-zinc-800 dark:text-zinc-200">
                  <span className="mt-1.5 flex size-2 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden />
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
