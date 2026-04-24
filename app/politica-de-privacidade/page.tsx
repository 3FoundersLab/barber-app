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
          <p className="mt-3 text-sm text-muted-foreground">Versão 2026-04-24</p>

          <section className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Esta política descreve como o BarberTool trata dados pessoais para operação da plataforma de gestão de
              barbearias.
            </p>
            <p>
              <strong className="text-foreground">Controlador:</strong> BarberTool.{' '}
              <strong className="text-foreground">Contato de privacidade (encarregado):</strong>{' '}
              privacidade@barbertool.com.br.
            </p>
          </section>

          <section className="mt-8 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">1. Finalidades e bases legais</h2>
            <p>
              Tratamos dados para: criar contas, autenticar usuários, permitir agenda/comandas/clientes, cobrança e
              prevenção a fraudes. As bases legais podem incluir execução de contrato, cumprimento de obrigação legal e
              legítimo interesse; quando aplicável, consentimento.
            </p>
          </section>

          <section className="mt-8 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">2. Dados tratados</h2>
            <p>
              Podemos tratar nome, e-mail, telefone, dados de perfil, dados operacionais de clientes e equipe,
              informações de uso da plataforma e registros técnicos de segurança.
            </p>
          </section>

          <section className="mt-8 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">3. Compartilhamento</h2>
            <p>
              Utilizamos operadores e suboperadores para infraestrutura e comunicação (por exemplo, hospedagem, banco
              de dados, envio de e-mail e métricas técnicas), sempre com medidas de segurança e cláusulas contratuais
              apropriadas.
            </p>
          </section>

          <section className="mt-8 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">4. Retenção</h2>
            <p>
              Mantemos dados pessoais pelo tempo necessário para cumprir finalidades legítimas, obrigações legais e
              defesa de direitos. Após esse período, aplicamos exclusão, bloqueio ou anonimização.
            </p>
          </section>

          <section className="mt-8 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">5. Direitos do titular</h2>
            <p>
              Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio, eliminação,
              portabilidade, informação sobre compartilhamento e revisão de decisões automatizadas, quando aplicável.
            </p>
            <p>
              Solicitações podem ser feitas por privacidade@barbertool.com.br ou pelo canal interno quando disponível na
              plataforma.
            </p>
          </section>

          <section className="mt-8 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <h2 className="text-base font-semibold text-foreground">6. Segurança</h2>
            <p>
              Adotamos controles de autenticação, autorização, segregação de acesso e trilhas de auditoria, além de
              medidas técnicas e administrativas para proteger dados pessoais.
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
