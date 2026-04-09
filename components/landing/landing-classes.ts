import { cn } from '@/lib/utils'

/** Largura e padding horizontais alinhados em toda a landing. */
export const landingContainer = 'mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-12'

/** Escala de seção: mobile/tablet mais fluido, desktop preservado. */
export const landingSectionY = 'py-12 md:py-16 lg:py-40'

/** Seções compactas: mantém ritmo sem criar "buracos". */
export const landingSectionYCompact = 'py-10 md:py-14 lg:py-32'

export const landingEyebrow =
  'text-[11px] font-semibold uppercase tracking-[0.22em] text-primary sm:text-xs'

export const landingSectionTitle =
  'mt-4 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.625rem] lg:leading-[1.1] dark:text-white'

export const landingSectionLead =
  'mt-5 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400'

/** Card elevado: borda nítida, sombra suave, anel quase imperceptível. */
export function landingCardClass(interactive = false) {
  return cn(
    'rounded-2xl border border-zinc-200/95 bg-white shadow-sm ring-1 ring-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/[0.04]',
    interactive &&
      cn(
        'transition-[transform,box-shadow,border-color,ring-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        'hover:-translate-y-0.5 hover:scale-[1.005] hover:border-zinc-300 hover:shadow-xl hover:ring-zinc-950/[0.07]',
        'dark:hover:border-zinc-600 dark:hover:shadow-2xl dark:hover:shadow-black/35 dark:hover:ring-white/[0.08]',
        'active:translate-y-0 active:scale-[1] active:shadow-md',
      ),
  )
}

/**
 * CTA principal: laranja da marca (`primary`), pílula, brilho suave no hover.
 * Combine com h-11 | h-12 | h-14 e text-xs | text-sm conforme o bloco.
 */
export const landingPrimaryCtaClass = cn(
  'rounded-full border-0 bg-primary font-bold text-primary-foreground shadow-sm',
  'transition-[transform,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
  'hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25',
  'active:scale-[0.98] active:shadow-md',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
)

/** CTA secundário: pílula com borda escura (alinhado ao “Já sou cliente” do header). */
export const landingTrialCtaClass = cn(
  'rounded-full border-2 border-zinc-900 bg-white font-bold text-zinc-900 shadow-none',
  'transition-[transform,box-shadow,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
  'hover:bg-zinc-50 hover:shadow-md hover:shadow-zinc-900/10',
  'dark:border-zinc-100 dark:bg-transparent dark:text-zinc-100 dark:hover:bg-zinc-800 dark:hover:shadow-black/40',
)

/** Hover com leve elevação nos CTAs da landing (CSS, leve na GPU). */
export const landingButtonLift = cn(
  'transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
  'hover:-translate-y-0.5 hover:scale-[1.012] hover:shadow-xl',
  'active:translate-y-0 active:scale-[0.99] active:shadow-md',
)

/**
 * Links da navegação desktop: sublinhado animado e leve lift.
 * Use com `inline-block` no elemento.
 */
export const landingNavLinkMicro = cn(
  'relative inline-block py-1 transition-[color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
  'hover:-translate-y-px',
  'after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.22,1,0.36,1)] hover:after:scale-x-100',
)

/** Painel em destaque (ex.: coluna “Com BarberTool”): brilho no hover. */
export const landingPanelGlowHover = cn(
  'transition-[transform,box-shadow,border-color,ring-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
  'hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-xl hover:shadow-primary/10 hover:ring-2 hover:ring-primary/20',
  'dark:hover:border-primary/45 dark:hover:shadow-primary/15 dark:hover:ring-primary/25',
)
