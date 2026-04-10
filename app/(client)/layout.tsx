'use client'

import { Home, Calendar, Clock, User } from 'lucide-react'
import { BottomTabs, type TabItem } from '@/components/shared/bottom-tabs'
import { DesktopSidebar } from '@/components/shared/desktop-sidebar'
import { appShellMainClass } from '@/components/shared/app-shell-classes'
import { AppPageHeadingProvider } from '@/components/shared/app-page-heading-context'
import { CLIENT_PATHS } from '@/lib/routes'

const clienteTabs: TabItem[] = [
  { label: 'Início', href: CLIENT_PATHS.inicio, icon: Home },
  { label: 'Agendar', href: CLIENT_PATHS.agendar, icon: Calendar },
  { label: 'Meus Horários', href: CLIENT_PATHS.agendamentos, icon: Clock },
  { label: 'Perfil', href: CLIENT_PATHS.perfilEditar, icon: User },
]

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="md:flex md:min-h-screen md:bg-muted/20" data-app-shell>
        <DesktopSidebar title="Área do Cliente" tabs={clienteTabs} />
        <div className={appShellMainClass}>
          <AppPageHeadingProvider>{children}</AppPageHeadingProvider>
        </div>
      </div>
      <BottomTabs tabs={clienteTabs} />
    </>
  )
}
