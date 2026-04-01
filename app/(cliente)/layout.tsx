'use client'

import { Home, Calendar, Clock, User } from 'lucide-react'
import { BottomTabs, type TabItem } from '@/components/shared/bottom-tabs'
import { DesktopSidebar } from '@/components/shared/desktop-sidebar'
import { AppPageHeadingProvider } from '@/components/shared/app-page-heading-context'

const clienteTabs: TabItem[] = [
  { label: 'Início', href: '/cliente/home', icon: Home },
  { label: 'Agendar', href: '/cliente/agendar', icon: Calendar },
  { label: 'Meus Horários', href: '/cliente/agendamentos', icon: Clock },
  { label: 'Perfil', href: '/cliente/perfil/editar', icon: User },
]

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="md:flex md:min-h-screen md:bg-muted/20">
        <DesktopSidebar title="Área do Cliente" tabs={clienteTabs} />
        <div className="hidden md:block md:w-64 md:shrink-0" />
        <div className="min-w-0 flex-1">
          <AppPageHeadingProvider>{children}</AppPageHeadingProvider>
        </div>
      </div>
      <BottomTabs tabs={clienteTabs} />
    </>
  )
}
