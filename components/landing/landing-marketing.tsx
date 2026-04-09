import { LANDING_SEO } from '@/components/landing/constants'
import { LandingSmoothScroll } from '@/components/landing/landing-smooth-scroll'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingProblem } from '@/components/landing/landing-problem'
import { LandingSolution } from '@/components/landing/landing-solution'
import { LandingBenefits } from '@/components/landing/landing-benefits'
import { LandingFeatures } from '@/components/landing/landing-features'
import { LandingSocialProof } from '@/components/landing/landing-social-proof'
import { LandingHowItWorks } from '@/components/landing/landing-how-it-works'
import { LandingPricing } from '@/components/landing/landing-pricing'
import { LandingCta } from '@/components/landing/landing-cta'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingScrollToTop } from '@/components/landing/landing-scroll-to-top'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: LANDING_SEO.siteName,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description: LANDING_SEO.description,
  offers: {
    '@type': 'Offer',
    price: '79',
    priceCurrency: 'BRL',
    description: 'Plano Essencial: valores podem variar no cadastro',
  },
}

export function LandingMarketing() {
  return (
    <LandingSmoothScroll>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-screen bg-background text-foreground antialiased">
        <LandingNavbar />
        <main>
          <LandingHero />
          <LandingProblem />
          <LandingSolution />
          <LandingBenefits />
          <LandingFeatures />
          <LandingSocialProof />
          <LandingHowItWorks />
          <LandingPricing />
          <LandingCta />
        </main>
        <LandingFooter />
        <LandingScrollToTop />
      </div>
    </LandingSmoothScroll>
  )
}
