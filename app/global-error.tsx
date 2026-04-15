'use client'

import Image from 'next/image'
import Link from 'next/link'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-[#f3f4f6] px-4">
          <section className="flex w-full max-w-2xl flex-col items-center text-center">
            <Image
              src="/errors/500.svg"
              alt="Ilustração de erro 500"
              width={600}
              height={480}
              priority
              className="h-auto w-full max-w-[340px] sm:max-w-[420px]"
            />

            <span className="mt-2 rounded-full border border-[#c7d2fe] bg-[#eef2ff] px-3 py-1 text-sm font-medium text-[#4f46e5]">
              Erro 500
            </span>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#111827]">
              Erro interno do servidor
            </h1>

            <p className="mt-3 text-lg text-[#374151]">
              Ocorreu um erro no servidor. Tente novamente mais tarde ou{' '}
              <a href="/contato" className="font-semibold text-[#4f46e5] hover:underline">
                entre em contato
              </a>{' '}
              para suporte.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-md bg-[#4f46e5] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4338ca]"
              >
                Tentar novamente
              </button>

              <Link
                href="/"
                className="rounded-md border border-[#c7d2fe] bg-white px-5 py-2.5 text-sm font-semibold text-[#4f46e5] transition hover:bg-[#eef2ff]"
              >
                Voltar para início
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
