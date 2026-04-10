'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { TenantAssinaturaSummary } from '@/components/shared/tenant-assinatura-summary'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  ALERT_DEFAULT_AUTO_CLOSE_MS,
} from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AdminConfiguracoesPageSkeleton } from '@/components/shared/loading-skeleton'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { createClient } from '@/lib/supabase/client'
import { toUserFriendlyErrorMessage } from '@/lib/to-user-friendly-error'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { fetchLatestAssinaturaWithPlano, type AssinaturaComPlano } from '@/lib/tenant-assinatura-query'
import type { Barbearia } from '@/types'

export default function TenantAssinaturaPage() {
  const { slug, base } = useTenantAdminBase()
  const [barbearia, setBarbearia] = useState<Barbearia | null>(null)
  const [assinatura, setAssinatura] = useState<AssinaturaComPlano | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('Usuário não autenticado')
        setIsLoading(false)
        return
      }

      const barbeariaId = await resolveAdminBarbeariaId(supabase, user.id, { slug })
      if (!barbeariaId) {
        setError('Barbearia não encontrada para este usuário')
        setIsLoading(false)
        return
      }

      const { data: b, error: bErr } = await supabase.from('barbearias').select('*').eq('id', barbeariaId).maybeSingle()
      if (bErr || !b) {
        setError(
          bErr
            ? toUserFriendlyErrorMessage(bErr, { fallback: 'Não foi possível carregar a barbearia' })
            : 'Não foi possível carregar a barbearia',
        )
        setIsLoading(false)
        return
      }

      setBarbearia(b)
      const assinaturaData = await fetchLatestAssinaturaWithPlano(supabase, b.id)
      setAssinatura(assinaturaData)
      setIsLoading(false)
    }

    void load()
  }, [slug])

  if (isLoading) {
    return (
      <TenantPanelPageContainer>
        <TenantPanelPageHeader title="Assinatura" profileHref={`${base}/configuracoes`} avatarFallback="A" />
        <PageContent className="space-y-6">
          <AdminConfiguracoesPageSkeleton />
        </PageContent>
      </TenantPanelPageContainer>
    )
  }

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader title="Assinatura" profileHref={`${base}/configuracoes`} avatarFallback="A" />

      <PageContent className="space-y-6">
        {barbearia?.status_cadastro === 'pagamento_pendente' && (
          <Alert variant="warning" className="text-left">
            <AlertTitle>Pagamento pendente</AlertTitle>
            <AlertDescription>
              O administrador da plataforma ainda precisa confirmar o pagamento. Enquanto isso, o uso do painel fica
              restrito. Os dados do plano aparecem abaixo quando houver registro de assinatura.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {assinatura ? (
          <TenantAssinaturaSummary assinatura={assinatura} />
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col gap-3 py-8 text-center text-sm text-muted-foreground">
              <p>Nenhuma assinatura encontrada para esta barbearia.</p>
              <Button variant="outline" size="sm" className="mx-auto w-fit" asChild>
                <Link href={`${base}/configuracoes`}>Ir para configurações</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </PageContent>
    </TenantPanelPageContainer>
  )
}
