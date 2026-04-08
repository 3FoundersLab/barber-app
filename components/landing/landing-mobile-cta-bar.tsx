'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LANDING_CTA, LANDING_LINKS } from '@/components/landing/constants'
import { landingPrimaryCtaClass } from '@/components/landing/landing-classes'
import { cn } from '@/lib/utils'

export function LandingMobileCtaBar() {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-orange-200/80 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden dark:border-amber-900/50 dark:bg-zinc-950/95',
      )}
    >
      <Button asChild variant="ghost" className={cn('h-12 w-full text-base', landingPrimaryCtaClass)}>
        <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.primary}</Link>
      </Button>
      <p className="mt-2.5 text-center text-[10px] font-medium leading-snug text-zinc-500 dark:text-zinc-400">
        {LANDING_CTA.urgency}
      </p>
    </div>
  )
}
