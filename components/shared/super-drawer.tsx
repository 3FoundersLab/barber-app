'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, CreditCard, LayoutDashboard, Menu, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { SuperLogoutButton } from '@/components/shared/super-logout-button'

const superLinks = [
  { label: 'Dashboard', href: '/super/dashboard', icon: LayoutDashboard },
  { label: 'Barbearias', href: '/super/barbearias', icon: Building2 },
  { label: 'Planos', href: '/super/planos', icon: Ticket },
  { label: 'Assinaturas', href: '/super/assinaturas', icon: CreditCard },
]

export function SuperDrawer() {
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
          <span className="sr-only">Abrir menu super admin</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] gap-0 p-0">
        <SheetHeader className="border-b">
          <SheetTitle>Painel Super Admin</SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {superLinks.map((item) => {
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

        <div className="mt-auto border-t p-3">
          <SuperLogoutButton variant="nav" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
