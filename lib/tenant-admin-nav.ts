import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Calendar,
  ClipboardList,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Package,
  Scissors,
  Settings,
  Ticket,
  UserRound,
  Users,
} from 'lucide-react'
import type { TabItem } from '@/components/shared/bottom-tabs'

export type TenantAdminNavLink = { label: string; href: string; icon: LucideIcon }

function href(base: string, segment: string) {
  return `${base}/${segment}`
}

/** Itens completos do painel tenant (barbearia), mesma ordem na sidebar e no drawer. */
export function tenantAdminNavFull(base: string): TenantAdminNavLink[] {
  return [
    { label: 'Dashboard', href: href(base, 'dashboard'), icon: LayoutDashboard },
    { label: 'Clientes', href: href(base, 'clientes'), icon: UserRound },
    { label: 'Agendamentos', href: href(base, 'agendamentos'), icon: Calendar },
    { label: 'Comandas', href: href(base, 'comandas'), icon: ClipboardList },
    { label: 'Serviços', href: href(base, 'servicos'), icon: Scissors },
    { label: 'Planos', href: href(base, 'planos'), icon: Ticket },
    { label: 'Financeiro', href: href(base, 'financeiro'), icon: DollarSign },
    { label: 'Relatórios', href: href(base, 'relatorios'), icon: BarChart3 },
    { label: 'Estoque', href: href(base, 'estoque'), icon: Package },
    { label: 'Assinatura', href: href(base, 'assinatura'), icon: CreditCard },
    { label: 'Equipe', href: href(base, 'equipe'), icon: Users },
    { label: 'Configurações', href: href(base, 'configuracoes'), icon: Settings },
  ]
}

/** Pagamento pendente: dashboard, visão da assinatura e configurações (alinha com proxy). */
export function tenantAdminNavLimited(base: string): TenantAdminNavLink[] {
  return [
    { label: 'Dashboard', href: href(base, 'dashboard'), icon: LayoutDashboard },
    { label: 'Assinatura', href: href(base, 'assinatura'), icon: CreditCard },
    { label: 'Configurações', href: href(base, 'configuracoes'), icon: Settings },
  ]
}

export function tenantAdminTabsFull(base: string): TabItem[] {
  return tenantAdminNavFull(base).map(({ label, href: h, icon }) => ({
    label,
    href: h,
    icon,
  }))
}

export function tenantAdminTabsLimited(base: string): TabItem[] {
  return tenantAdminNavLimited(base).map(({ label, href: h, icon }) => ({
    label,
    href: h,
    icon,
  }))
}
