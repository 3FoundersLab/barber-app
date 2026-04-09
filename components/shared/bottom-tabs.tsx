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
  appearance?: 'default' | 'super'
}

export function BottomTabs({ tabs, basePath = '', appearance = 'default' }: BottomTabsProps) {
  const pathname = usePathname()
  const isSuper = appearance === 'super'

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        isSuper
          ? 'border-t border-zinc-200/90 bg-white/92 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/92'
          : 'border-t bg-background',
      )}
    >
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
                'flex min-w-[64px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
                isSuper && !isActive && 'hover:bg-zinc-100/80 dark:hover:bg-white/[0.06]',
                isSuper && isActive && 'bg-primary/10 dark:bg-primary/15',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isActive && 'text-primary',
                  isSuper && isActive && 'scale-105',
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
