'use client'

import { LayoutDashboard, Calendar, Scissors, Users, Settings, DollarSign } from 'lucide-react'
import { useParams } from 'next/navigation'
import { BottomTabs, type TabItem } from '@/components/shared/bottom-tabs'
import { AdminDrawer } from '@/components/shared/admin-drawer'
import { DesktopSidebar } from '@/components/shared/desktop-sidebar'
import { AppPageHeadingProvider } from '@/components/shared/app-page-heading-context'

export default function AdminSlugLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const base = slug ? `/b/${slug}` : '/painel'

  const adminTabs: TabItem[] = [
    { label: 'Dashboard', href: `${base}/dashboard`, icon: LayoutDashboard },
    { label: 'Agenda', href: `${base}/agendamentos`, icon: Calendar },
    { label: 'Financeiro', href: `${base}/financeiro`, icon: DollarSign },
    { label: 'Serviços', href: `${base}/servicos`, icon: Scissors },
    { label: 'Equipe', href: `${base}/equipe`, icon: Users },
    { label: 'Config', href: `${base}/configuracoes`, icon: Settings },
  ]

  return (
    <>
      <AdminDrawer basePath={base} />
      <div className="md:flex md:min-h-screen md:bg-muted/20">
        <DesktopSidebar title="Painel Admin" tabs={adminTabs} />
        <div className="hidden md:block md:w-64 md:shrink-0" />
        <div className="min-w-0 flex-1">
          <AppPageHeadingProvider>{children}</AppPageHeadingProvider>
        </div>
      </div>
      <BottomTabs tabs={adminTabs} />
    </>
  )
}
