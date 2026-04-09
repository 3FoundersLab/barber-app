'use client'

import { ClipboardList } from 'lucide-react'
import { TenantRoutePlaceholder } from '@/components/shared/tenant-route-placeholder'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'

export default function TenantComandasPage() {
  const { base } = useTenantAdminBase()

  return (
    <TenantRoutePlaceholder
      title="Comandas"
      cardTitle="Comandas em breve"
      description="Aqui você poderá acompanhar consumo no balcão, vínculo com serviços e fechamento do dia. Enquanto isso, use Agendamentos e Financeiro para o fluxo atual."
      icon={ClipboardList}
      actions={[
        { label: 'Agendamentos', href: `${base}/agendamentos` },
        { label: 'Financeiro', href: `${base}/financeiro`, variant: 'outline' },
        { label: 'Serviços', href: `${base}/servicos`, variant: 'outline' },
      ]}
    />
  )
}
