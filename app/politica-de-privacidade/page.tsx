import type { Metadata } from 'next'
import { LegalPageHeader } from '@/components/shared/legal-page-header'

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description: 'Política de privacidade do BarberTool.',
  robots: { index: true, follow: true },
}

export default function PoliticaDePrivacidadePage() {
  return (
    <>
      <LegalPageHeader />
      <main className="min-h-[60vh] bg-background px-5 py-16 text-foreground sm:px-8">
        <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Política de privacidade</h1>
        <p className="mt-6 leading-relaxed text-muted-foreground">
          Esta página está em elaboração. Em breve você encontrará aqui a política de privacidade completa do
          BarberTool.
        </p>
        </div>
      </main>
    </>
  )
}
