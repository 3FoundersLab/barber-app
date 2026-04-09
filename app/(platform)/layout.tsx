'use client'

import { Building2, CreditCard, DollarSign, LayoutDashboard, Ticket, Users } from 'lucide-react'
import { BottomTabs, type TabItem } from '@/components/shared/bottom-tabs'
import { SuperDrawer } from '@/components/shared/super-drawer'
import { DesktopSidebar } from '@/components/shared/desktop-sidebar'
import { SuperLogoutButton } from '@/components/shared/super-logout-button'
import { AppPageHeadingProvider } from '@/components/shared/app-page-heading-context'
import { SuperPremiumBackdrop } from '@/components/super/super-premium-backdrop'
import { PLATFORM_PATHS } from '@/lib/routes'

const superTabs: TabItem[] = [
  { label: 'Dashboard', href: PLATFORM_PATHS.dashboard, icon: LayoutDashboard },
  { label: 'Barbearias', href: PLATFORM_PATHS.barbearias, icon: Building2 },
  { label: 'Usuários', href: PLATFORM_PATHS.usuarios, icon: Users },
  { label: 'Planos', href: PLATFORM_PATHS.planos, icon: Ticket },
  { label: 'Financeiro', href: PLATFORM_PATHS.financeiro, icon: DollarSign },
  { label: 'Assinaturas', href: PLATFORM_PATHS.assinaturas, icon: CreditCard },
]

export default function SuperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="relative min-h-screen md:flex" data-super-shell>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          <SuperPremiumBackdrop />
        </div>
        <SuperDrawer />
        <DesktopSidebar
          appearance="super"
          appBrand={{ href: PLATFORM_PATHS.dashboard, collapsible: true }}
          tabs={superTabs}
          footer={({ collapsed }) =>
            collapsed ? <SuperLogoutButton variant="nav" compact /> : <SuperLogoutButton />
          }
        />
        <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
          <AppPageHeadingProvider>{children}</AppPageHeadingProvider>
        </div>
      </div>
      <BottomTabs appearance="super" tabs={superTabs} />
    </>
  )
}
