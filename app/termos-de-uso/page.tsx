import type { Metadata } from 'next'
import { LegalPageHeader } from '@/components/shared/legal-page-header'

export const metadata: Metadata = {
  title: 'Termos de uso',
  description: 'Termos de uso do BarberApp.',
  robots: { index: true, follow: true },
}

export default function TermosDeUsoPage() {
  return (
    <>
      <LegalPageHeader />
      <main className="min-h-[60vh] bg-background px-5 py-16 text-foreground sm:px-8">
        <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Termos de uso</h1>
        <p className="mt-6 leading-relaxed text-muted-foreground">
          Esta página está em elaboração. Em breve você encontrará aqui os termos de uso completos do BarberApp.
        </p>
        </div>
      </main>
    </>
  )
}
