'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  CreditCard,
  ChevronDown,
  DollarSign,
  LayoutDashboard,
  Menu,
  ScrollText,
  Ticket,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { AppBrandLogo } from '@/components/shared/app-brand-logo'
import { PLATFORM_PATHS } from '@/lib/routes'
import { SuperLogoutButton } from '@/components/shared/super-logout-button'
import { ThemeToggle } from '@/components/shared/theme-toggle'

const superLinks = [
  { label: 'Dashboard', href: PLATFORM_PATHS.dashboard, icon: LayoutDashboard },
  { label: 'Barbearias', href: PLATFORM_PATHS.barbearias, icon: Building2 },
  { label: 'Usuários', href: PLATFORM_PATHS.usuarios, icon: Users },
  { label: 'Planos', href: PLATFORM_PATHS.planos, icon: Ticket },
  { label: 'Financeiro', href: PLATFORM_PATHS.financeiro, icon: DollarSign },
  { label: 'Assinaturas', href: PLATFORM_PATHS.assinaturas, icon: CreditCard },
] as const

const superLogsGroup = {
  label: 'Logs',
  icon: ScrollText,
  children: [
    { label: 'Políticas', href: PLATFORM_PATHS.logsPoliticas },
    { label: 'Ações', href: PLATFORM_PATHS.logsAcoes },
  ],
} as const

function pathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SuperDrawer() {
  const pathname = usePathname()
  const logsOpenDefault = superLogsGroup.children.some((c) => pathActive(pathname, c.href))
  const LogsGroupIcon = superLogsGroup.icon

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
          <span className="sr-only">Abrir menu super admin</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className={cn(
          'w-[280px] gap-0 p-0',
          'border-zinc-200/80 bg-white/95 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95',
        )}
      >
        <SheetHeader className="border-b border-zinc-200/80 px-4 py-4 dark:border-zinc-800">
          <SheetTitle asChild className="text-left">
            <AppBrandLogo href={PLATFORM_PATHS.dashboard} />
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {superLinks.map((item) => {
            const isActive = pathActive(pathname, item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200',
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

          <Collapsible defaultOpen={logsOpenDefault} className="space-y-1">
            <CollapsibleTrigger
              type="button"
              className={cn(
                'group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-200',
                logsOpenDefault
                  ? 'bg-zinc-200/80 text-foreground dark:bg-white/[0.08]'
                  : 'text-muted-foreground hover:bg-zinc-100/85 hover:text-foreground dark:hover:bg-white/[0.06]',
              )}
            >
              <LogsGroupIcon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left font-medium">{superLogsGroup.label}</span>
              <ChevronDown className="size-4 shrink-0 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 pl-1">
              {superLogsGroup.children.map((child) => {
                const active = pathActive(pathname, child.href)
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      'block rounded-md py-2 pl-8 pr-3 text-sm transition-all duration-200',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                        : 'text-muted-foreground hover:bg-zinc-100/85 hover:text-foreground dark:hover:bg-white/[0.06]',
                    )}
                  >
                    {child.label}
                  </Link>
                )
              })}
            </CollapsibleContent>
          </Collapsible>
        </nav>

        <div className="mt-auto space-y-3 border-t border-zinc-200/80 p-3 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-xs font-medium text-muted-foreground">Aparência</span>
            <ThemeToggle inline />
          </div>
          <SuperLogoutButton variant="nav" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
