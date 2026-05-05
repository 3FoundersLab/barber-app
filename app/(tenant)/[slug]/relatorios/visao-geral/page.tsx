'use client'

import { RelatoriosVisaoGeralPainel } from '@/components/domain/relatorios-visao-geral-painel'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'

export default function TenantRelatoriosVisaoGeralPage() {
  const { slug, base } = useTenantAdminBase()

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader
        greetingOnly
        profileHref={`${base}/configuracoes`}
        avatarFallback="A"
      />
      <RelatoriosVisaoGeralPainel slug={slug} base={base} />
    </TenantPanelPageContainer>
  )
}
