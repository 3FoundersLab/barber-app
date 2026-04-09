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
import type { NavEntry } from '@/components/shared/bottom-tabs'

export type TenantAdminNavLink = { label: string; href: string; icon: LucideIcon }

export type TenantAdminNavSection = { label: string; links: TenantAdminNavLink[] }

function path(base: string, segment: string) {
  return `${base}/${segment}`
}

/** Grupos do painel tenant (barbearia), mesma ordem na sidebar e no drawer. */
export function tenantAdminNavSectionsFull(base: string): TenantAdminNavSection[] {
  return [
    {
      label: 'Visão geral',
      links: [{ label: 'Dashboard', href: path(base, 'dashboard'), icon: LayoutDashboard }],
    },
    {
      label: 'Operação',
      links: [
        { label: 'Clientes', href: path(base, 'clientes'), icon: UserRound },
        { label: 'Agendamentos', href: path(base, 'agendamentos'), icon: Calendar },
        { label: 'Comandas', href: path(base, 'comandas'), icon: ClipboardList },
      ],
    },
    {
      label: 'Negócio',
      links: [
        { label: 'Serviços', href: path(base, 'servicos'), icon: Scissors },
        { label: 'Planos', href: path(base, 'planos'), icon: Ticket },
        { label: 'Financeiro', href: path(base, 'financeiro'), icon: DollarSign },
        { label: 'Relatórios', href: path(base, 'relatorios'), icon: BarChart3 },
        { label: 'Estoque', href: path(base, 'estoque'), icon: Package },
      ],
    },
    {
      label: 'Administração',
      links: [
        { label: 'Assinatura', href: path(base, 'assinatura'), icon: CreditCard },
        { label: 'Equipe', href: path(base, 'equipe'), icon: Users },
        { label: 'Configurações', href: path(base, 'configuracoes'), icon: Settings },
      ],
    },
  ]
}

/** Pagamento pendente: dashboard, assinatura e configurações (alinha com proxy). */
export function tenantAdminNavSectionsLimited(base: string): TenantAdminNavSection[] {
  return [
    {
      label: 'Visão geral',
      links: [{ label: 'Dashboard', href: path(base, 'dashboard'), icon: LayoutDashboard }],
    },
    {
      label: 'Plano',
      links: [{ label: 'Assinatura', href: path(base, 'assinatura'), icon: CreditCard }],
    },
    {
      label: 'Sistema',
      links: [{ label: 'Configurações', href: path(base, 'configuracoes'), icon: Settings }],
    },
  ]
}

export function tenantAdminNavFull(base: string): TenantAdminNavLink[] {
  return tenantAdminNavSectionsFull(base).flatMap((s) => s.links)
}

export function tenantAdminNavLimited(base: string): TenantAdminNavLink[] {
  return tenantAdminNavSectionsLimited(base).flatMap((s) => s.links)
}

function sectionsToNavEntries(sections: TenantAdminNavSection[]): NavEntry[] {
  const out: NavEntry[] = []
  for (const s of sections) {
    out.push({ kind: 'section', label: s.label })
    for (const link of s.links) {
      out.push({ label: link.label, href: link.href, icon: link.icon })
    }
  }
  return out
}

export function tenantAdminNavEntriesFull(base: string): NavEntry[] {
  return sectionsToNavEntries(tenantAdminNavSectionsFull(base))
}

export function tenantAdminNavEntriesLimited(base: string): NavEntry[] {
  return sectionsToNavEntries(tenantAdminNavSectionsLimited(base))
}
