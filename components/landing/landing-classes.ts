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

/** CTA principal: alto contraste, sombra forte, bom alvo de toque. */
export const landingPrimaryCtaClass = cn(
  'border-0 bg-gradient-to-b from-amber-400 via-amber-500 to-orange-700 font-bold text-white shadow-[0_4px_18px_rgba(194,65,12,0.5),inset_0_1px_0_rgba(255,255,255,0.28)] ring-2 ring-orange-900/35',
  'hover:from-amber-500 hover:via-orange-500 hover:to-orange-800 hover:text-white hover:shadow-[0_6px_24px_rgba(194,65,12,0.55)]',
  'active:scale-[0.98] active:brightness-95',
)

/** CTA secundário (trial) — contorno forte, ainda legível em fundo claro. */
export const landingTrialCtaClass = cn(
  'border-2 border-orange-600 bg-white font-bold text-orange-800 shadow-sm',
  'hover:bg-orange-50 hover:text-orange-900 dark:border-amber-500 dark:bg-zinc-950 dark:text-amber-100 dark:hover:bg-zinc-900',
)
