import { Quote } from 'lucide-react'

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

export function LandingSocialProof() {
  return (
    <section className="border-y border-zinc-100 py-20 dark:border-zinc-800 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
              Quem usa, recomenda
            </h2>
            <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
              Números e depoimentos reais de operações que profissionalizaram a gestão.
            </p>
            <dl className="mt-10 grid grid-cols-3 gap-6">
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {label}
                  </dt>
                  <dd className="mt-1 text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 sm:text-3xl">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <ul className="flex flex-col gap-4">
            {quotes.map((q) => (
              <li
                key={q.name}
                className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900"
              >
                <Quote className="size-8 text-amber-500/40 dark:text-amber-500/30" aria-hidden />
                <blockquote className="mt-3 text-zinc-700 dark:text-zinc-300">&ldquo;{q.text}&rdquo;</blockquote>
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
