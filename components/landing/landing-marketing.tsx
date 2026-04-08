import { LandingSmoothScroll } from '@/components/landing/landing-smooth-scroll'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingProblemSolution } from '@/components/landing/landing-problem-solution'
import { LandingBenefits } from '@/components/landing/landing-benefits'
import { LandingFeatures } from '@/components/landing/landing-features'
import { LandingSocialProof } from '@/components/landing/landing-social-proof'
import { LandingHowItWorks } from '@/components/landing/landing-how-it-works'
import { LandingPricing } from '@/components/landing/landing-pricing'
import { LandingCta } from '@/components/landing/landing-cta'
import { LandingFooter } from '@/components/landing/landing-footer'

export function LandingMarketing() {
  return (
    <LandingSmoothScroll>
      <div className="min-h-screen bg-[#f7f7f8] text-foreground antialiased dark:bg-zinc-950">
        <LandingNavbar />
        <main>
          <LandingHero />
          <LandingProblemSolution />
          <LandingBenefits />
          <LandingFeatures />
          <LandingSocialProof />
          <LandingHowItWorks />
          <LandingPricing />
          <LandingCta />
        </main>
        <LandingFooter />
      </div>
    </LandingSmoothScroll>
  )
}
