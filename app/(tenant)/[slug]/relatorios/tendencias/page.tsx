'use client'

import { TrendingUp } from 'lucide-react'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'

export default function TenantRelatoriosTendenciasPage() {
  const { base } = useTenantAdminBase()

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader
        title="Relatórios"
        subtitle="Acompanhe indicadores por áreas específicas do negócio."
        profileHref={`${base}/configuracoes`}
        avatarFallback="A"
      />
      <PageContent className="space-y-4">
        <Empty className="mx-auto max-w-xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TrendingUp className="size-6" aria-hidden />
            </EmptyMedia>
            <EmptyTitle>Tendências em construção</EmptyTitle>
            <EmptyDescription>Esta página ainda não possui conteúdo.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </PageContent>
    </TenantPanelPageContainer>
  )
}
