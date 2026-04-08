import { cn } from '@/lib/utils'

/** Largura e padding horizontais alinhados em toda a landing. */
export const landingContainer = 'mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-12'

/** Espaço vertical generoso entre seções (padrão SaaS premium). */
export const landingSectionY = 'py-24 md:py-32 lg:py-36'

/** Seções um pouco mais compactas (ex.: CTA final). */
export const landingSectionYCompact = 'py-20 md:py-28 lg:py-32'

export const landingEyebrow =
  'text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400 sm:text-xs'

export const landingSectionTitle =
  'mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.625rem] lg:leading-[1.1] dark:text-white'

export const landingSectionLead =
  'mt-5 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400'

/** Card elevado: borda nítida, sombra suave, anel quase imperceptível. */
export function landingCardClass(interactive = false) {
  return cn(
    'rounded-2xl border border-zinc-200/95 bg-white shadow-sm ring-1 ring-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/[0.04]',
    interactive &&
      'duration-300 hover:border-zinc-300 hover:shadow-md dark:hover:border-zinc-700 dark:hover:shadow-lg dark:hover:shadow-black/20',
  )
}
