import { LANDING_SEO } from '@/components/landing/constants'
import { LandingSmoothScroll } from '@/components/landing/landing-smooth-scroll'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingBenefits } from '@/components/landing/landing-benefits'
import { LandingDemo } from '@/components/landing/landing-demo'
import { LandingHowItWorks } from '@/components/landing/landing-how-it-works'
import { LandingPricing } from '@/components/landing/landing-pricing'
import { LandingFaq } from '@/components/landing/landing-faq'
import { LandingSocialProof } from '@/components/landing/landing-social-proof'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingScrollToTop } from '@/components/landing/landing-scroll-to-top'

/** Ative `true` quando quiser exibir a seção de prova social novamente. */
const showSocialProof = false

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
      <div className="min-h-screen bg-background text-zinc-950 antialiased dark:text-foreground">
        <LandingNavbar />
        <main>
          <LandingHero />
          <LandingBenefits />
          <LandingDemo />
          <LandingHowItWorks />
          {showSocialProof ? <LandingSocialProof /> : null}
          <LandingPricing />
          <LandingFaq />
        </main>
        <LandingFooter />
        <LandingScrollToTop />
      </div>
    </LandingSmoothScroll>
  )
}
