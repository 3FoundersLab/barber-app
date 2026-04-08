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
    text: 'Um horário no caderno, outro no Zap. O dia vira bagunça. Você deixa dinheiro na mesa sem perceber.',
  },
  {
    icon: UsersRound,
    title: 'Cadeira vazia',
    text: 'Cliente some ou desmarca em cima da hora. Você não sabe quanto isso custou no mês.',
  },
  {
    icon: Banknote,
    title: 'Caixa no escuro',
    text: 'Fechou o dia sem saber se lucrou de verdade. Assinatura misturada com corte. Bolso aperta e você não sabe o porquê.',
  },
]

const outcomes = [
  'Vê todos os horários da equipe de uma vez. Acabou o buraco escondido na agenda.',
  'Lembra do cliente antes dele te esquecer. Mais volta, mais corte, mais caixa.',
  'Abriu o app: já sabe o que entrou, o que falta cobrar e o que vem de mensalidade.',
]

export function LandingProblemSolution() {
  return (
    <section
      id={LANDING_SECTIONS.desafios}
      className={cn('scroll-mt-24 border-b border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950', landingSectionY)}
    >
      <div className={landingContainer}>
        <div className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Cansado disso?</p>
          <h2 className={landingSectionTitle}>Menos correria. Mais dinheiro na mesa.</h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Quando nada conversa, você perde hora. O caixa sofre. E o cliente bom escapa sem você nem notar.
          </p>
        </div>

        <div className="mt-20 grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-12 xl:gap-16">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Soa familiar?</p>
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
            <p className={landingEyebrow}>Com BarberApp</p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-[1.65rem] sm:leading-snug">
              Você manda no negócio de novo — sem virar refém de planilha
            </h3>
            <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Um lugar só pra ver o que importa: quem vem, quem paga e quanto sobrou no fim do dia.
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
