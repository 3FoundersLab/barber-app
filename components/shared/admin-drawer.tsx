'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, DollarSign, LayoutDashboard, Menu, Scissors, Settings, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const adminLinks = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Agenda', href: '/admin/agendamentos', icon: Calendar },
  { label: 'Financeiro', href: '/admin/financeiro', icon: DollarSign },
  { label: 'Serviços', href: '/admin/servicos', icon: Scissors },
  { label: 'Equipe', href: '/admin/equipe', icon: Users },
  { label: 'Configurações', href: '/admin/configuracoes', icon: Settings },
]

export function AdminDrawer() {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 top-4 z-50 h-9 w-9 shadow-sm md:hidden"
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Abrir menu admin</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Painel Admin</SheetTitle>
        </SheetHeader>

        <nav className="space-y-1 p-3">
          {adminLinks.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
