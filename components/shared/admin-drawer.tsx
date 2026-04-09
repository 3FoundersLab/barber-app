'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { tenantAdminNavSectionsFull, tenantAdminNavSectionsLimited } from '@/lib/tenant-admin-nav'

export function AdminDrawer({
  basePath,
  limitedNav = false,
}: {
  basePath: string
  /** Pagamento pendente: navegação reduzida (alinha com layout e proxy). */
  limitedNav?: boolean
}) {
  const adminSections = limitedNav
    ? tenantAdminNavSectionsLimited(basePath)
    : tenantAdminNavSectionsFull(basePath)
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            'fixed left-4 top-4 z-50 h-9 w-9 shadow-md md:hidden',
            'border-zinc-200/90 bg-white/90 backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-950/90',
            'transition-[border-color,background-color,box-shadow] duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/90',
          )}
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Abrir menu do painel</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className={cn(
          'flex w-[280px] flex-col gap-0 p-0',
          'border-zinc-200/80 bg-white/95 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95',
        )}
      >
        <SheetHeader className="border-b border-zinc-200/80 px-4 py-4 dark:border-zinc-800">
          <SheetTitle>Painel da barbearia</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-1 flex-col space-y-1 p-3">
          {adminSections.map((section, sectionIndex) => (
            <div
              key={section.label}
              className={cn(
                'space-y-1',
                sectionIndex > 0 &&
                  'border-t border-zinc-200/80 pt-3 dark:border-zinc-800',
              )}
            >
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {section.label}
              </p>
              {section.links.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                        : 'text-muted-foreground hover:bg-zinc-100/85 hover:text-foreground dark:hover:bg-white/[0.06]',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          ))}
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
            <span className="text-xs font-medium text-muted-foreground">Aparência</span>
            <ThemeToggle inline />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
