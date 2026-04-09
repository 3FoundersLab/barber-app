import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de privacidade',
  description: 'Política de privacidade do BarberApp.',
  robots: { index: true, follow: true },
}

export default function PoliticaDePrivacidadePage() {
  return (
    <main className="min-h-[60vh] bg-background px-5 py-16 text-foreground sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm font-medium text-sky-600 transition-colors duration-300 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
        >
          ← Voltar ao início
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Política de privacidade</h1>
        <p className="mt-6 leading-relaxed text-muted-foreground">
          Esta página está em elaboração. Em breve você encontrará aqui a política de privacidade completa do
          BarberApp.
        </p>
      </div>
    </main>
  )
}
