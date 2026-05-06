'use client'

import { RelatoriosTendenciasPainel } from '@/components/domain/relatorios-tendencias-painel'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'

export default function TenantRelatoriosTendenciasPage() {
  const { slug, base } = useTenantAdminBase()

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader
        greetingOnly
        profileHref={`${base}/configuracoes`}
        avatarFallback="A"
      />
      <RelatoriosTendenciasPainel slug={slug} base={base} />
    </TenantPanelPageContainer>
  )
}
