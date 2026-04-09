'use client'

import { LandingAmbientMotes } from '@/components/landing/landing-ambient-motes'
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
 * Fundo atmosférico premium: modo claro e escuro (via classe `dark` no `html`).
 * Colocar dentro de um ancestral `relative overflow-hidden`.
 */
export function SuperPremiumBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {/* —— Tema claro —— */}
      <div className="absolute inset-0 dark:hidden">
        <div className="absolute inset-0 bg-zinc-50" />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-zinc-100/85" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_95%_75%_at_50%_-18%,rgba(14,165,233,0.07),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_48%_42%_at_8%_88%,rgba(234,88,12,0.045),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_42%_38%_at_92%_78%,rgba(59,130,246,0.05),transparent_58%)]" />
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.04)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_78%_68%_at_50%_48%,black,transparent)] opacity-[0.85]"
          aria-hidden
        />
        <div className="absolute inset-0 z-[1]">
          <LandingAmbientMotes preset="login" particleClassName="bg-primary/14" />
        </div>
      </div>

      {/* —— Tema escuro —— */}
      <div className="absolute inset-0 hidden dark:block">
        <div className="absolute inset-0 bg-zinc-950" />
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(24,24,27,0.92),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_78%_28%,rgba(6,182,212,0.07),transparent_60%),radial-gradient(ellipse_42%_36%_at_12%_72%,rgba(59,130,246,0.05),transparent_58%),radial-gradient(ellipse_50%_42%_at_50%_100%,rgba(234,88,12,0.045),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.024)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.024)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,black,transparent)] opacity-80" />
        <div className="absolute inset-0 z-[1]">
          <LandingAmbientMotes preset="login" particleClassName="bg-cyan-300/30" />
        </div>
      </div>
    </div>
  )
}
