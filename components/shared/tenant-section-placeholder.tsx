'use client'

import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'

interface TenantSectionPlaceholderProps {
  title: string
  description: string
}

/** Página-base do painel tenant até a funcionalidade estar implementada. */
export function TenantSectionPlaceholder({ title, description }: TenantSectionPlaceholderProps) {
  const { base } = useTenantAdminBase()

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader title={title} profileHref={`${base}/configuracoes`} avatarFallback="A" />
      <PageContent>
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Esta seção será preenchida em versões futuras do painel.
          </CardContent>
        </Card>
      </PageContent>
    </TenantPanelPageContainer>
  )
}
