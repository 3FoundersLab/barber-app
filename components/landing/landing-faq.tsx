'use client'

import { LANDING_SECTIONS } from '@/components/landing/constants'
import {
  landingContainer,
  landingEyebrow,
  landingSectionTitle,
  landingSectionYCompact,
} from '@/components/landing/landing-classes'
import { LandingFadeIn } from '@/components/landing/landing-reveal'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

const faqItems = [
  {
    q: 'Como funciona o teste grátis?',
    a: 'Você abre a conta e usa o BarberTool por 7 dias com acesso completo. É o jeito mais rápido de ver agenda, equipe e caixa na prática, sem compromisso no primeiro passo.',
  },
  {
    q: 'Preciso instalar algo?',
    a: 'Não. Tudo roda no navegador — computador, tablet ou celular. Entra no link, faz login e usa.',
  },
  {
    q: 'Funciona no celular?',
    a: 'Sim. A interface é pensada para quem está na bancada: consultar grade, registrar pagamento e acompanhar o dia no celular.',
  },
  {
    q: 'Tem suporte?',
    a: 'Sim. Nos planos pagos você tem canal de suporte para tirar dúvida e destravar a operação. No Essencial, o contato é por e-mail.',
  },
  {
    q: 'Posso cancelar quando quiser?',
    a: 'Sim. Você pode encerrar a assinatura quando fizer sentido para o negócio, sem letras miúdas escondidas.',
  },
] as const

function FaqBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-white dark:hidden" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-50/80 via-white to-white dark:hidden"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(24,24,27,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(24,24,27,0.06)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_30%,black,transparent)] dark:hidden"
        aria-hidden
      />

      <div className="pointer-events-none absolute inset-0 hidden bg-zinc-950 dark:block" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-gradient-to-b from-zinc-900/40 via-zinc-950 to-zinc-950 dark:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(to_right,rgba(255,255,255,0.024)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.024)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_30%,black,transparent)] dark:block"
        aria-hidden
      />
    </>
  )
}

export function LandingFaq() {
  return (
    <section
      id={LANDING_SECTIONS.faq}
      className={cn(
        'relative scroll-mt-24 overflow-hidden border-t border-zinc-200/90 bg-white text-zinc-950 dark:border-white/[0.06] dark:bg-zinc-950 dark:text-white',
        landingSectionYCompact,
      )}
      aria-labelledby="landing-faq-heading"
    >
      <FaqBackdrop />
      <div className={`${landingContainer} relative z-10`}>
        <LandingFadeIn className="mx-auto max-w-2xl text-center">
          <p className={landingEyebrow}>Dúvidas</p>
          <h2 id="landing-faq-heading" className={landingSectionTitle}>
            Perguntas frequentes
          </h2>
        </LandingFadeIn>

        <LandingFadeIn delay={0.06} className="mx-auto mt-8 max-w-2xl lg:mt-10">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map(({ q, a }, i) => (
              <AccordionItem
                key={q}
                value={`item-${i}`}
                className="border-zinc-200 data-[state=open]:border-primary/30 dark:border-white/10 dark:data-[state=open]:border-primary/20"
              >
                <AccordionTrigger
                  className={cn(
                    'py-4 text-left text-base font-semibold text-zinc-900 hover:no-underline dark:text-white',
                    'focus-visible:ring-primary/40 [&>svg]:text-zinc-500 dark:[&>svg]:text-zinc-400',
                  )}
                >
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </LandingFadeIn>
      </div>
    </section>
  )
}
