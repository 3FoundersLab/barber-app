'use client'

import { Ticket } from 'lucide-react'
import { TenantRoutePlaceholder } from '@/components/shared/tenant-route-placeholder'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'

/**
 * Plano SaaS da barbearia na plataforma: Assinatura. Preços ao cliente: Serviços.
 */
export default function TenantPlanosPage() {
  const { base } = useTenantAdminBase()

  return (
    <TenantRoutePlaceholder
      title="Planos"
      cardTitle="Plano da sua barbearia na plataforma"
      description="Contrato, valores e renovação do sistema ficam centralizados em Assinatura. Use Serviços para precificar cortes e pacotes oferecidos aos seus clientes."
      icon={Ticket}
      actions={[
        { label: 'Abrir assinatura', href: `${base}/assinatura` },
        { label: 'Ir para serviços', href: `${base}/servicos`, variant: 'outline' },
      ]}
    />
  )
}
