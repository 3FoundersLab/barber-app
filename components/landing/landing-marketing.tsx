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
          <LandingCtaStrip headline="Chega de chutar o caixa no domingo? Agenda e dinheiro na mesma tela — abre a conta e vê na hora." />
          <LandingBenefits />
          <LandingCtaStrip headline="Quer cadeira girando e menos briga por horário? Monta a grade em minutos e chama a equipe." />
          <LandingFeatures />
          <LandingCtaStrip headline="Do encaixe ao Pix: vê como a sua bancada fica quando tudo conversa." />
          <LandingSocialProof />
          <LandingHowItWorks />
          <LandingCtaStrip headline="Falta só você: dois minutos e já marca o primeiro horário de verdade." />
          <LandingPricing />
          <LandingCta />
        </main>
        <LandingFooter />
        <LandingMobileCtaBar />
      </div>
    </LandingSmoothScroll>
  )
}
