'use client'

import { Calendar, Clock, User } from 'lucide-react'
import { BottomTabs, type TabItem } from '@/components/shared/bottom-tabs'
import { DesktopSidebar } from '@/components/shared/desktop-sidebar'
import { appShellMainClass } from '@/components/shared/app-shell-classes'
import { AppPageHeadingProvider } from '@/components/shared/app-page-heading-context'
import { STAFF_PATHS } from '@/lib/routes'

const barbeiroTabs: TabItem[] = [
  { label: 'Agenda', href: STAFF_PATHS.agenda, icon: Calendar },
  { label: 'Horários', href: STAFF_PATHS.horarios, icon: Clock },
  { label: 'Perfil', href: STAFF_PATHS.perfilEditar, icon: User },
]

export default function BarbeiroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="md:flex md:min-h-screen md:bg-muted/20" data-app-shell>
        <DesktopSidebar title="Painel Barbeiro" tabs={barbeiroTabs} />
        <div className={appShellMainClass}>
          <AppPageHeadingProvider>{children}</AppPageHeadingProvider>
        </div>
      </div>
      <BottomTabs tabs={barbeiroTabs} />
    </>
  )
}
