'use client'

import { BarChart3 } from 'lucide-react'
import { TenantRoutePlaceholder } from '@/components/shared/tenant-route-placeholder'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'

export default function TenantRelatoriosPage() {
  const { base } = useTenantAdminBase()

  return (
    <TenantRoutePlaceholder
      title="Relatórios"
      cardTitle="Relatórios em breve"
      description="Gráficos e exportações consolidados virão nesta área. Hoje o resumo operacional e financeiro pode ser visto no painel e na lista de atendimentos pagos."
      icon={BarChart3}
      actions={[
        { label: 'Dashboard', href: `${base}/dashboard` },
        { label: 'Financeiro', href: `${base}/financeiro`, variant: 'outline' },
        { label: 'Agendamentos', href: `${base}/agendamentos`, variant: 'outline' },
      ]}
    />
  )
}
