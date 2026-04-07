import { LandingSmoothScroll } from '@/components/landing/landing-smooth-scroll'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingBenefits } from '@/components/landing/landing-benefits'
import { LandingHowItWorks } from '@/components/landing/landing-how-it-works'
import { LandingFeatures } from '@/components/landing/landing-features'
import { LandingSocialProof } from '@/components/landing/landing-social-proof'
import { LandingPricing } from '@/components/landing/landing-pricing'
import { LandingCta } from '@/components/landing/landing-cta'
import { LandingFooter } from '@/components/landing/landing-footer'

export function LandingMarketing() {
  return (
    <LandingSmoothScroll>
      <div className="min-h-screen bg-background text-foreground">
        <LandingNavbar />
        <main>
          <LandingHero />
          <LandingBenefits />
          <LandingHowItWorks />
          <LandingFeatures />
          <LandingSocialProof />
          <LandingPricing />
          <LandingCta />
        </main>
        <LandingFooter />
      </div>
    </LandingSmoothScroll>
  )
}
