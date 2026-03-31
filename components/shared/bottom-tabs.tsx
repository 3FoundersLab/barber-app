'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export interface TabItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface BottomTabsProps {
  tabs: TabItem[]
  basePath?: string
}

export function BottomTabs({ tabs, basePath = '' }: BottomTabsProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        {tabs.map((tab) => {
          const fullHref = basePath + tab.href
          const isActive = pathname === fullHref || pathname.startsWith(fullHref + '/')
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={fullHref}
              className={cn(
                'flex min-w-[64px] flex-col items-center justify-center gap-1 px-3 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  isActive && 'text-primary'
                )}
              />
              <span className={cn(
                'font-medium',
                isActive && 'text-primary'
              )}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
