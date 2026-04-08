'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { LANDING_CTA, LANDING_LINKS } from '@/components/landing/constants'
import { landingButtonLift, landingContainer, landingPrimaryCtaClass } from '@/components/landing/landing-classes'
import { LandingFadeIn } from '@/components/landing/landing-reveal'
import { cn } from '@/lib/utils'

type LandingCtaStripProps = {
  headline: string
  className?: string
}

export function LandingCtaStrip({ headline, className }: LandingCtaStripProps) {
  return (
    <div
      className={cn(
        'border-y border-orange-200/60 bg-gradient-to-r from-amber-50 via-white to-orange-50/90 py-8 dark:border-amber-900/50 dark:from-amber-950/30 dark:via-zinc-950 dark:to-amber-950/25',
        className,
      )}
    >
      <LandingFadeIn
        className={cn(
          landingContainer,
          'flex flex-col items-stretch justify-between gap-5 sm:flex-row sm:items-center',
        )}
      >
        <p className="max-w-xl text-pretty text-center text-base font-semibold leading-snug text-zinc-950 sm:text-left sm:text-lg dark:text-white">
          {headline}
        </p>
        <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:shrink-0 sm:items-end">
          <Button
            asChild
            variant="ghost"
            size="lg"
            className={cn(
              'h-14 w-full min-w-[min(100%,260px)] px-8 text-base sm:w-auto',
              landingPrimaryCtaClass,
              landingButtonLift,
            )}
          >
            <Link href={LANDING_LINKS.cadastro}>{LANDING_CTA.primary}</Link>
          </Button>
          <span className="mt-0.5 text-center text-[11px] font-semibold uppercase leading-snug tracking-wide text-orange-900/80 dark:text-amber-200/90 sm:text-right">
            {LANDING_CTA.urgency}
          </span>
        </div>
      </LandingFadeIn>
    </div>
  )
}
