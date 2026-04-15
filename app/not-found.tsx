import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f4f6] px-4">
      <section className="flex w-full max-w-2xl flex-col items-center text-center">
        <Image
          src="/errors/404.svg"
          alt="Ilustração de erro 404"
          width={600}
          height={480}
          priority
          className="h-auto w-full max-w-[340px] sm:max-w-[420px]"
        />

        <span className="mt-2 rounded-full border border-[#c7d2fe] bg-[#eef2ff] px-3 py-1 text-sm font-medium text-[#4f46e5]">
          Erro 404
        </span>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#111827]">
          Não encontramos esta página
        </h1>

        <p className="mt-3 text-lg text-[#374151]">
          A página solicitada não existe. Verifique a URL ou{' '}
          <Link href="/" className="font-semibold text-[#4f46e5] hover:underline">
            volte para a página inicial
          </Link>
          .
        </p>
      </section>
    </main>
  )
}
