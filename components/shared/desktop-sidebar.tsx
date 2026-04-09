'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { AppBrandLogo } from '@/components/shared/app-brand-logo'
import type { TabItem } from '@/components/shared/bottom-tabs'
import { APP_PAGE_HEADER_BAR_CLASS } from '@/components/shared/page-container'
import { superShellHeaderBarClass } from '@/components/super/super-ui'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SUPER_SIDEBAR_COLLAPSED_KEY = 'barber-app-super-sidebar-collapsed'

export type DesktopSidebarFooter = ReactNode | ((ctx: { collapsed: boolean }) => ReactNode)

interface DesktopSidebarProps {
  title?: string
  appBrand?: { href: string; collapsible?: boolean }
  tabs: TabItem[]
  footer?: DesktopSidebarFooter
  /** Super Admin: vidro e navegação alinhados à landing. */
  appearance?: 'default' | 'super'
}

function resolveFooter(footer: DesktopSidebarFooter | undefined, collapsed: boolean) {
  if (footer == null) return null
  if (typeof footer === 'function') return footer({ collapsed })
  return footer
}

export function DesktopSidebar({
  title,
  appBrand,
  tabs,
  footer,
  appearance = 'default',
}: DesktopSidebarProps) {
  const pathname = usePathname()
  const isSuper = appearance === 'super'
  const collapsible = Boolean(appBrand?.collapsible)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!collapsible || typeof window === 'undefined') return
    try {
      setCollapsed(window.localStorage.getItem(SUPER_SIDEBAR_COLLAPSED_KEY) === '1')
    } catch {
      /* ignore */
    }
  }, [collapsible])

  useEffect(() => {
    if (!collapsible || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(SUPER_SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed, collapsible])

  const wide = !collapsible || !collapsed
  const widthClass = wide ? 'md:w-64' : 'md:w-[4.5rem]'

  const headerBarClass = isSuper ? superShellHeaderBarClass : APP_PAGE_HEADER_BAR_CLASS

  const header = appBrand ? (
    <div
      className={cn(
        'flex items-center gap-2 overflow-hidden',
        headerBarClass,
        wide ? 'flex-row' : 'flex-col justify-center gap-0.5 px-2',
      )}
    >
      <div className={cn('min-w-0 flex-1', wide ? '' : 'flex w-full flex-none justify-center')}>
        <AppBrandLogo
          href={appBrand.href}
          variant={wide ? 'full' : 'icon'}
          className={cn(
            wide ? 'w-full' : 'w-auto [&>span]:size-8 [&>span]:text-xs',
          )}
        />
      </div>
      {collapsible ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            'shrink-0 text-muted-foreground',
            wide ? 'h-8 w-8' : 'mx-auto h-6 w-6',
          )}
          aria-expanded={wide}
          aria-label={wide ? 'Recolher menu lateral' : 'Expandir menu lateral'}
          onClick={() => setCollapsed((c) => !c)}
        >
          {wide ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </Button>
      ) : null}
    </div>
  ) : (
    <div className={cn('flex items-center overflow-hidden', headerBarClass)}>
      <p className="truncate text-sm font-semibold">{title}</p>
    </div>
  )

  return (
    <>
      <aside
        className={cn(
          'hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:flex-col md:border-r md:transition-[width] md:duration-200 md:ease-out',
          isSuper
            ? 'md:border-zinc-200/80 md:bg-white/75 md:backdrop-blur-xl dark:md:border-zinc-800/80 dark:md:bg-zinc-950/72'
            : 'md:bg-background',
          widthClass,
        )}
      >
        {header}

        <nav
          id="desktop-sidebar-nav"
          className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3"
          aria-label="Navegação principal"
        >
          {tabs.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                title={!wide ? item.label : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-md text-sm transition-all duration-200',
                  wide ? 'px-3 py-2' : 'justify-center px-2 py-2.5',
                  isActive
                    ? isSuper
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'bg-primary text-primary-foreground'
                    : isSuper
                      ? 'text-muted-foreground hover:bg-zinc-100/85 hover:text-foreground dark:hover:bg-white/[0.06]'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {wide ? <span className="truncate">{item.label}</span> : null}
              </Link>
            )
          })}
        </nav>

        {footer ? (
          <div
            className={cn(
              'border-t p-3',
              isSuper && 'border-zinc-200/80 dark:border-zinc-800',
            )}
          >
            {resolveFooter(footer, !wide)}
          </div>
        ) : null}
      </aside>
      <div className={cn('hidden shrink-0 md:block', widthClass)} aria-hidden />
    </>
  )
}
