'use client'

import { Building2, CreditCard, LayoutDashboard, Ticket, Users } from 'lucide-react'
import { BottomTabs, type TabItem } from '@/components/shared/bottom-tabs'
import { SuperDrawer } from '@/components/shared/super-drawer'
import { DesktopSidebar } from '@/components/shared/desktop-sidebar'
import { SuperLogoutButton } from '@/components/shared/super-logout-button'
import { AppPageHeadingProvider } from '@/components/shared/app-page-heading-context'
import { PLATFORM_PATHS } from '@/lib/routes'

const superTabs: TabItem[] = [
  { label: 'Dashboard', href: PLATFORM_PATHS.dashboard, icon: LayoutDashboard },
  { label: 'Barbearias', href: PLATFORM_PATHS.barbearias, icon: Building2 },
  { label: 'Usuários', href: PLATFORM_PATHS.usuarios, icon: Users },
  { label: 'Planos', href: PLATFORM_PATHS.planos, icon: Ticket },
  { label: 'Assinaturas', href: PLATFORM_PATHS.assinaturas, icon: CreditCard },
]

export default function SuperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SuperDrawer />
      <div className="md:flex md:min-h-screen md:bg-muted/20">
        <DesktopSidebar title="Painel Super Admin" tabs={superTabs} footer={<SuperLogoutButton />} />
        <div className="hidden md:block md:w-64 md:shrink-0" />
        <div className="min-w-0 flex-1">
          <AppPageHeadingProvider>{children}</AppPageHeadingProvider>
        </div>
      </div>
      <BottomTabs tabs={superTabs} />
    </>
  )
}
