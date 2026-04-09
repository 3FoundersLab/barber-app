import { cn } from '@/lib/utils'

/** Inputs do perfil premium (mesmo acabamento da conta Super Admin). */
export const superProfileInputClass = cn(
  'h-10 shadow-none transition-[border-color,box-shadow,background-color] duration-300 focus-visible:border-ring focus-visible:ring-ring/45 disabled:opacity-70',
  'border-zinc-200 bg-white text-foreground placeholder:text-zinc-500 hover:border-zinc-300',
  'dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-white/[0.14]',
)

/** Card vidro do perfil premium. */
export const superProfileGlassCardClass = cn(
  'rounded-2xl border backdrop-blur-md transition-[border-color,box-shadow] duration-300',
  'border-zinc-200/95 bg-white/80 shadow-[0_22px_44px_-24px_rgba(0,0,0,0.12)] hover:border-zinc-300/90',
  'dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-[0_24px_48px_-28px_rgba(0,0,0,0.65)] dark:hover:border-white/[0.11]',
)

export const superProfileLabelClass = 'text-sm font-medium text-foreground dark:text-zinc-300'

export const superProfileDangerAlertClass =
  'border-destructive/40 bg-destructive/10 dark:border-red-500/35 dark:bg-red-950/35'
