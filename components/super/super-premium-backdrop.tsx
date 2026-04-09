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
      {/* —— Tema claro (alinhado à LP: #f7f7f8, grid 56px, glows cyan/sky + primary) —— */}
      <div className="absolute inset-0 dark:hidden">
        <div className="absolute inset-0 bg-[#f2f3f5]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#fafafa] to-[#eef0f3]" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-orange-50/35" />
        {/* Glow superior centro-direita: “luz” SaaS */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_110%_70%_at_62%_-5%,rgba(14,165,233,0.14),transparent_52%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_48%_at_88%_22%,rgba(56,189,248,0.11),transparent_58%)]" />
        {/* Glow inferior esquerda: calor da marca */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_52%_46%_at_6%_92%,rgba(249,115,22,0.075),transparent_56%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_38%_34%_at_18%_72%,rgba(234,88,12,0.055),transparent_60%)]" />
        {/* Profundidade: leve vinheta nas bordas */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_88%_78%_at_50%_50%,transparent_32%,rgba(228,228,231,0.55)_100%)]" />
        {/* Brilho suave no centro (contraste com o card de login) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_52%_at_50%_42%,rgba(255,255,255,0.55),transparent_68%)]" />
        {/* Grid: mesmo pitch da hero LP, linhas zinc discretas + máscara orgânica */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(24,24,27,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.055)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_74%_64%_at_50%_46%,black,transparent)] opacity-[0.92]"
          aria-hidden
        />
        {/* Micro-textura: linhas mais tênues (1/2 step) para sensação premium */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(24,24,27,0.028)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.028)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_48%,black,transparent)] opacity-[0.65]"
          aria-hidden
        />
        <div className="absolute inset-0 z-[1]">
          <LandingAmbientMotes
            preset="login"
            particleClassName="bg-gradient-to-br from-primary/28 to-sky-400/22"
          />
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
