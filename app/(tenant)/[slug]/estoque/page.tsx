'use client'

import { Package } from 'lucide-react'
import { TenantRoutePlaceholder } from '@/components/shared/tenant-route-placeholder'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'

export default function TenantEstoquePage() {
  const { base } = useTenantAdminBase()

  return (
    <TenantRoutePlaceholder
      title="Estoque"
      cardTitle="Estoque em breve"
      description="Cadastro de produtos, entradas, saídas e alertas de reposição serão adicionados aqui. Ajuste dados da unidade e da equipe nas configurações enquanto o módulo não está disponível."
      icon={Package}
      actions={[
        { label: 'Configurações', href: `${base}/configuracoes` },
        { label: 'Serviços', href: `${base}/servicos`, variant: 'outline' },
        { label: 'Dashboard', href: `${base}/dashboard`, variant: 'outline' },
      ]}
    />
  )
}
