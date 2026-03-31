'use client'

import { Calendar, Clock, User } from 'lucide-react'
import { BottomTabs, type TabItem } from '@/components/shared/bottom-tabs'
import { DesktopSidebar } from '@/components/shared/desktop-sidebar'

const barbeiroTabs: TabItem[] = [
  { label: 'Agenda', href: '/barbeiro/agenda', icon: Calendar },
  { label: 'Horários', href: '/barbeiro/horarios', icon: Clock },
  { label: 'Perfil', href: '/barbeiro/perfil', icon: User },
]

export default function BarbeiroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="md:flex md:min-h-screen md:bg-muted/20">
        <DesktopSidebar title="Painel Barbeiro" tabs={barbeiroTabs} />
        <div className="hidden md:block md:w-64 md:shrink-0" />
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </div>
      <BottomTabs tabs={barbeiroTabs} />
    </>
  )
}
