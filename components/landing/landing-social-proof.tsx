import { Lock, MessageCircle, Quote, RefreshCw } from 'lucide-react'
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

const stats = [
  { value: '+120', label: 'barbearias ativas' },
  { value: '4,8/5', label: 'satisfação média' },
  { value: '35%', label: 'menos faltas (média)' },
]

const quotes = [
  {
    name: 'Rafael M.',
    role: 'Dono, Barbearia Centro',
    text: 'Centralizei agenda e financeiro. Hoje sei exatamente o que entra no caixa por semana.',
  },
  {
    name: 'Diego A.',
    role: 'Sócio, Studio Corte',
    text: 'A equipe adotou rápido. O dashboard ajuda a bater meta sem ficar no Excel à noite.',
  },
]

const trust = [
  { icon: Lock, label: 'Ambiente seguro', sub: 'Boas práticas de dados' },
  { icon: MessageCircle, label: 'Suporte em português', sub: 'Fale com quem entende o negócio' },
  { icon: RefreshCw, label: 'Evolução contínua', sub: 'Melhorias frequentes na plataforma' },
]

export function LandingSocialProof() {
  return (
    <section
      id={LANDING_SECTIONS.provaSocial}
      className={cn(
        'scroll-mt-24 border-b border-zinc-200/80 bg-[#f4f4f5] dark:border-zinc-800 dark:bg-zinc-900/50',
        landingSectionY,
      )}
    >
      <div className={landingContainer}>
        <div className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Prova social</p>
          <h2 className={landingSectionTitle}>Quem usa, recomenda</h2>
          <p className={cn(landingSectionLead, 'mx-auto')}>
            Números e relatos de quem trocou improviso por método na gestão do salão.
          </p>
        </div>

        <div className="mt-20 grid gap-12 lg:grid-cols-2 lg:items-start lg:gap-14 xl:gap-16">
          <div className="flex flex-col gap-10">
            <dl className="grid grid-cols-3 gap-4 lg:gap-5">
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className={cn(landingCardClass(), 'px-4 py-6 text-center sm:px-5 sm:py-7')}
                >
                  <dd className="text-2xl font-semibold tracking-tight text-amber-700 tabular-nums dark:text-amber-400 sm:text-3xl">
                    {value}
                  </dd>
                  <dt className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:text-xs">
                    {label}
                  </dt>
                </div>
              ))}
            </dl>
            <ul className="grid gap-4 sm:grid-cols-3 sm:gap-4">
              {trust.map(({ icon: Icon, label, sub }) => (
                <li key={label} className={cn(landingCardClass(), 'flex gap-3 p-4 sm:flex-col sm:p-5')}>
                  <Icon className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-zinc-950 dark:text-white">{label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <ul className="flex flex-col gap-5">
            {quotes.map((q) => (
              <li key={q.name} className={cn(landingCardClass(true), 'p-7 sm:p-8')}>
                <Quote className="size-8 text-amber-500/30 dark:text-amber-500/20" aria-hidden />
                <blockquote className="mt-4 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                  &ldquo;{q.text}&rdquo;
                </blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold text-zinc-950 dark:text-white">{q.name}</span>
                  <span className="text-zinc-500 dark:text-zinc-400"> — {q.role}</span>
                </figcaption>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
