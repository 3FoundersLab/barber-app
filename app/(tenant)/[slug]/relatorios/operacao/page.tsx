'use client'

import { RelatoriosOperacionalPainel } from '@/components/domain/relatorios-operacional-painel'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'

export default function TenantRelatoriosOperacaoPage() {
  const { slug, base } = useTenantAdminBase()

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader
        greetingOnly
        profileHref={`${base}/configuracoes`}
        avatarFallback="A"
      />
      <RelatoriosOperacionalPainel slug={slug} base={base} />
    </TenantPanelPageContainer>
  )
}
