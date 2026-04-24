import type { Metadata } from 'next'
import { LegalPageHeader } from '@/components/shared/legal-page-header'

export const metadata: Metadata = {
  title: 'Termos de uso',
  description: 'Termos de uso do BarberTool.',
  robots: { index: true, follow: true },
}

export default function TermosDeUsoPage() {
  return (
    <>
      <LegalPageHeader />
      <main className="min-h-[60vh] bg-background px-5 py-16 text-foreground sm:px-8">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">Termos de uso</h1>
          <p className="mt-3 text-sm text-muted-foreground">Versão 2026-04-24</p>

          <section className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Estes termos regulam o uso da plataforma BarberTool para gestão operacional de barbearias, incluindo
              agenda, clientes, equipe e financeiro.
            </p>
            <p>
              Ao utilizar a plataforma, o usuário declara ciência das regras de uso, segurança da conta e
              responsabilidades de tratamento de dados pessoais.
            </p>
          </section>

          <section className="mt-8 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">1. Conta e acesso</h2>
            <p>
              O usuário é responsável por manter credenciais sob sigilo, informar dados corretos e notificar acessos
              indevidos.
            </p>
          </section>

          <section className="mt-8 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">2. Uso permitido</h2>
            <p>
              É proibido usar a plataforma para atividades ilícitas, violação de direitos de terceiros, tentativa de
              acesso não autorizado ou tratamento irregular de dados pessoais.
            </p>
          </section>

          <section className="mt-8 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">3. Proteção de dados</h2>
            <p>
              O uso do serviço deve observar a LGPD. O detalhamento de tratamento de dados, direitos do titular e canal
              de privacidade está na Política de Privacidade.
            </p>
          </section>

          <section className="mt-8 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">4. Alterações</h2>
            <p>
              Podemos atualizar estes termos para refletir mudanças legais e de produto. As versões vigentes serão
              publicadas nesta página.
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
