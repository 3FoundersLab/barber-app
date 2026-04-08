import { Lock, MessageCircle, Quote, RefreshCw } from 'lucide-react'
import { LANDING_SECTIONS } from '@/components/landing/constants'

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
      className="scroll-mt-24 border-y border-zinc-100 bg-zinc-50/50 py-20 dark:border-zinc-800 dark:bg-zinc-900/40 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Prova social
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
            Quem usa, recomenda
          </h2>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
            Números e relatos de quem trocou improviso por método na gestão do salão.
          </p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <dl className="grid grid-cols-3 gap-4 sm:gap-8">
              {stats.map(({ value, label }) => (
                <div key={label} className="rounded-2xl border border-zinc-200/80 bg-white p-4 text-center dark:border-zinc-700 dark:bg-zinc-900 sm:p-5">
                  <dd className="text-2xl font-bold tracking-tight text-amber-600 tabular-nums dark:text-amber-400 sm:text-3xl">
                    {value}
                  </dd>
                  <dt className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {label}
                  </dt>
                </div>
              ))}
            </dl>
            <ul className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              {trust.map(({ icon: Icon, label, sub }) => (
                <li
                  key={label}
                  className="flex flex-1 items-start gap-3 rounded-xl border border-zinc-200/80 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900 sm:min-w-[200px]"
                >
                  <Icon className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white">{label}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <ul className="flex flex-col gap-4">
            {quotes.map((q) => (
              <li
                key={q.name}
                className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 sm:p-7"
              >
                <Quote className="size-8 text-amber-500/35 dark:text-amber-500/25" aria-hidden />
                <blockquote className="mt-3 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                  &ldquo;{q.text}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-semibold text-zinc-900 dark:text-white">{q.name}</span>
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
