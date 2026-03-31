'use client'

import { LayoutDashboard, Calendar, Scissors, Users, Settings, DollarSign } from 'lucide-react'
import { BottomTabs, type TabItem } from '@/components/shared/bottom-tabs'
import { AdminDrawer } from '@/components/shared/admin-drawer'
import { DesktopSidebar } from '@/components/shared/desktop-sidebar'

const adminTabs: TabItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Agenda', href: '/admin/agendamentos', icon: Calendar },
  { label: 'Financeiro', href: '/admin/financeiro', icon: DollarSign },
  { label: 'Serviços', href: '/admin/servicos', icon: Scissors },
  { label: 'Equipe', href: '/admin/equipe', icon: Users },
  { label: 'Config', href: '/admin/configuracoes', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AdminDrawer />
      <div className="md:flex md:min-h-screen md:bg-muted/20">
        <DesktopSidebar title="Painel Admin" tabs={adminTabs} />
        <div className="hidden md:block md:w-64 md:shrink-0" />
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
      <BottomTabs tabs={adminTabs} />
    </>
  )
}
