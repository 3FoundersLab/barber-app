import dynamic from 'next/dynamic'
import { LANDING_SEO } from '@/components/landing/constants'
import { LandingSmoothScroll } from '@/components/landing/landing-smooth-scroll'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingScrollToTopDeferred } from '@/components/landing/landing-scroll-to-top-deferred'

/** Seções abaixo da dobra em chunks separados: menos JS inicial (LCP/FCP/TBT). */
const LandingBenefits = dynamic(() =>
  import('@/components/landing/landing-benefits').then((m) => ({ default: m.LandingBenefits })),
)
const LandingDemo = dynamic(() =>
  import('@/components/landing/landing-demo').then((m) => ({ default: m.LandingDemo })),
)
const LandingHowItWorks = dynamic(() =>
  import('@/components/landing/landing-how-it-works').then((m) => ({ default: m.LandingHowItWorks })),
)
const LandingSocialProof = dynamic(() =>
  import('@/components/landing/landing-social-proof').then((m) => ({ default: m.LandingSocialProof })),
)
const LandingPricing = dynamic(() =>
  import('@/components/landing/landing-pricing').then((m) => ({ default: m.LandingPricing })),
)
const LandingFaq = dynamic(() =>
  import('@/components/landing/landing-faq').then((m) => ({ default: m.LandingFaq })),
)
const LandingFooter = dynamic(() =>
  import('@/components/landing/landing-footer').then((m) => ({ default: m.LandingFooter })),
)

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
        <LandingScrollToTopDeferred />
      </div>
    </LandingSmoothScroll>
  )
}
