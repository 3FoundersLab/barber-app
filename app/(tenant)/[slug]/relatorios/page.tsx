'use client'

import { RelatoriosDashboard } from '@/components/domain/relatorios-dashboard'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'

export default function TenantRelatoriosPage() {
  const { slug, base } = useTenantAdminBase()

  return <RelatoriosDashboard slug={slug} base={base} />
}
