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
  Shield,
  Ticket,
  UserRound,
  Users,
} from 'lucide-react'
import type { NavEntry, TabItem } from '@/components/shared/bottom-tabs'

export type TenantAdminMenuKey =
  | 'dashboard'
  | 'clientes'
  | 'agendamentos'
  | 'comandas'
  | 'servicos'
  | 'planos'
  | 'financeiro'
  | 'relatorios'
  | 'estoque'
  | 'assinatura'
  | 'equipe'
  | 'permissoes'
  | 'configuracoes'

export type TenantAdminMenuItemBlueprint = {
  key: TenantAdminMenuKey
  label: string
  icon: LucideIcon
}

export type TenantAdminMenuSectionBlueprint = {
  label: string
  items: TenantAdminMenuItemBlueprint[]
}

/** Fonte única para sidebar, drawer e matriz de permissões por menu. */
export const TENANT_ADMIN_MENU_BLUEPRINT: readonly TenantAdminMenuSectionBlueprint[] = [
  {
    label: 'Visão geral',
    items: [{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Operação',
    items: [
      { key: 'clientes', label: 'Clientes', icon: UserRound },
      { key: 'agendamentos', label: 'Agendamentos', icon: Calendar },
      { key: 'comandas', label: 'Comandas', icon: ClipboardList },
    ],
  },
  {
    label: 'Negócio',
    items: [
      { key: 'servicos', label: 'Serviços', icon: Scissors },
      { key: 'planos', label: 'Planos', icon: Ticket },
      { key: 'financeiro', label: 'Financeiro', icon: DollarSign },
      { key: 'relatorios', label: 'Relatórios', icon: BarChart3 },
      { key: 'estoque', label: 'Estoque', icon: Package },
    ],
  },
  {
    label: 'Administração',
    items: [
      { key: 'assinatura', label: 'Assinatura', icon: CreditCard },
      { key: 'equipe', label: 'Equipe', icon: Users },
      { key: 'permissoes', label: 'Permissões', icon: Shield },
      { key: 'configuracoes', label: 'Configurações', icon: Settings },
    ],
  },
] as const

export type TenantAdminNavLink = { label: string; href: string; icon: LucideIcon }

export type TenantAdminNavSection = { label: string; links: TenantAdminNavLink[] }

function path(base: string, segment: string) {
  return `${base}/${segment}`
}

function blueprintToSections(base: string, blueprint: readonly TenantAdminMenuSectionBlueprint[]) {
  return blueprint.map((section) => ({
    label: section.label,
    links: section.items.map((item) => ({
      label: item.label,
      href: path(base, item.key),
      icon: item.icon,
    })),
  }))
}

/** Grupos do painel tenant (barbearia), mesma ordem na sidebar e no drawer. */
export function tenantAdminNavSectionsFull(base: string): TenantAdminNavSection[] {
  return blueprintToSections(base, TENANT_ADMIN_MENU_BLUEPRINT)
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
  const sections = tenantAdminNavSectionsFull(base)
  const out: NavEntry[] = []
  for (const s of sections) {
    out.push({ kind: 'section', label: s.label })
    for (const link of s.links) {
      if (link.href === path(base, 'relatorios')) {
        const group: TabItem = {
          label: 'Relatórios',
          icon: link.icon,
          children: [
            {
              label: 'Visão Geral',
              href: path(base, 'relatorios/visao-geral'),
              relatoriosBrandActive: true,
            },
            {
              label: 'Operacional',
              href: path(base, 'relatorios/operacao'),
              relatoriosBrandActive: true,
            },
            {
              label: 'Tendências',
              href: path(base, 'relatorios/tendencias'),
              relatoriosBrandActive: true,
            },
          ],
        }
        out.push(group)
        continue
      }
      out.push({ label: link.label, href: link.href, icon: link.icon })
    }
  }
  return out
}

export function tenantAdminNavEntriesLimited(base: string): NavEntry[] {
  return sectionsToNavEntries(tenantAdminNavSectionsLimited(base))
}
