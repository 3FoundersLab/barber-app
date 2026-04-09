'use client'

import { cn } from '@/lib/utils'

/**
 * Header do painel Super: vidro + blur; segue `html.dark` (toggle de tema).
 */
export const superPremiumAppHeaderClass = cn(
  'border-zinc-200/90 bg-white/90 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.04)]',
  '[&_.text-muted-foreground]:text-zinc-600',
  'dark:border-zinc-800/70 dark:bg-zinc-950/90 dark:shadow-none dark:[&_.text-muted-foreground]:text-zinc-500',
)

/**
 * Fundo do shell Super / auth: cor sólida via token `background` (claro/escuro no `html`).
 * Colocar dentro de um ancestral `relative overflow-hidden`.
 */
export function SuperPremiumBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 bg-background"
      aria-hidden
    />
  )
}
