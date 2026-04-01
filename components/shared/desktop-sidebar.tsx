'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { TabItem } from '@/components/shared/bottom-tabs'

interface DesktopSidebarProps {
  title: string
  tabs: TabItem[]
  footer?: React.ReactNode
}

export function DesktopSidebar({ title, tabs, footer }: DesktopSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col md:border-r md:bg-background">
      <div className="border-b px-4 py-4">
        <p className="text-sm font-semibold">{title}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {tabs.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {footer ? <div className="border-t p-3">{footer}</div> : null}
    </aside>
  )
}
