'use client'

import type { ReactNode } from 'react'
import { SuperPremiumBackdrop } from '@/components/super/super-premium-backdrop'

type LoginLandingShellProps = {
  children: ReactNode
  /**
   * `landingDark`: fundo fixo escuro sólido (#05070A) — uso na página de login.
   * Padrão: respeita tema global (cadastro e demais fluxos).
   */
  variant?: 'theme' | 'landingDark'
}

/**
 * Fundo para fluxos de auth alinhados à landing / Super.
 * `variant="landingDark"` fixa o fundo escuro da página de login.
 */
export function LoginLandingShell({ children, variant = 'theme' }: LoginLandingShellProps) {
  const landingDark = variant === 'landingDark'

  return (
    <div className={cnShellRoot(landingDark)}>
      {!landingDark ? (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <SuperPremiumBackdrop />
        </div>
      ) : null}

      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  )
}

function cnShellRoot(landingDark: boolean) {
  return landingDark
    ? 'relative min-h-screen overflow-hidden bg-[#05070A] text-zinc-100 antialiased'
    : 'relative min-h-screen overflow-hidden bg-background text-foreground'
}
