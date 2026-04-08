import { LandingSmoothScroll } from '@/components/landing/landing-smooth-scroll'
import { LandingNavbar } from '@/components/landing/landing-navbar'
import { LandingHero } from '@/components/landing/landing-hero'
import { LandingProblemSolution } from '@/components/landing/landing-problem-solution'
import { LandingCtaStrip } from '@/components/landing/landing-cta-strip'
import { LandingBenefits } from '@/components/landing/landing-benefits'
import { LandingFeatures } from '@/components/landing/landing-features'
import { LandingSocialProof } from '@/components/landing/landing-social-proof'
import { LandingHowItWorks } from '@/components/landing/landing-how-it-works'
import { LandingPricing } from '@/components/landing/landing-pricing'
import { LandingCta } from '@/components/landing/landing-cta'
import { LandingFooter } from '@/components/landing/landing-footer'
import { LandingMobileCtaBar } from '@/components/landing/landing-mobile-cta-bar'

export function LandingMarketing() {
  return (
    <LandingSmoothScroll>
      <div className="min-h-screen bg-[#f7f7f8] text-foreground antialiased dark:bg-zinc-950">
        <LandingNavbar />
        <main className="pb-[5.5rem] lg:pb-0">
          <LandingHero />
          <LandingProblemSolution />
          <LandingCtaStrip headline="Chega de adivinhar? Veja agenda e caixa no mesmo lugar — grátis pra começar." />
          <LandingBenefits />
          <LandingCtaStrip headline="Quer mais gente na cadeira e menos correria? Entre agora e monte sua loja em minutos." />
          <LandingFeatures />
          <LandingCtaStrip headline="Um clique e você enxerga como fica o dia da sua barbearia organizado." />
          <LandingSocialProof />
          <LandingHowItWorks />
          <LandingCtaStrip headline="Falta só você: crie a conta em ~2 minutos e comece a usar hoje." />
          <LandingPricing />
          <LandingCta />
        </main>
        <LandingFooter />
        <LandingMobileCtaBar />
      </div>
    </LandingSmoothScroll>
  )
}
