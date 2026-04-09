'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronUp } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface TabSubItem {
  label: string
  href: string
}

export interface TabItemLeaf {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export interface TabItemGroup {
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: TabSubItem[]
}

export type TabItem = TabItemLeaf | TabItemGroup

export function isTabGroup(item: TabItem): item is TabItemGroup {
  return 'children' in item && Array.isArray(item.children)
}

/** Separador de seção na sidebar desktop (não é item de bottom tabs). */
export interface NavSectionHeader {
  kind: 'section'
  label: string
}

export type NavEntry = TabItem | NavSectionHeader

export function isNavSectionHeader(entry: NavEntry): entry is NavSectionHeader {
  return (entry as NavSectionHeader).kind === 'section'
}

/** Itens clicáveis na ordem, para a barra inferior mobile. */
export function flattenNavEntries(entries: NavEntry[]): TabItem[] {
  return entries.filter((e): e is TabItem => !isNavSectionHeader(e))
}

export function groupNavEntries(
  entries: NavEntry[],
): { label?: string; items: TabItem[] }[] {
  const groups: { label?: string; items: TabItem[] }[] = []
  let currentLabel: string | undefined
  let currentItems: TabItem[] = []

  const pushGroup = () => {
    if (currentLabel !== undefined || currentItems.length > 0) {
      groups.push({ label: currentLabel, items: currentItems })
    }
    currentLabel = undefined
    currentItems = []
  }

  for (const e of entries) {
    if (isNavSectionHeader(e)) {
      pushGroup()
      currentLabel = e.label
      currentItems = []
    } else {
      currentItems.push(e)
    }
  }
  pushGroup()
  return groups
}

interface BottomTabsProps {
  tabs: TabItem[]
  basePath?: string
  appearance?: 'default' | 'super'
  /** Muitos itens (ex.: painel tenant): rolagem horizontal no mobile em vez de espichar. */
  scrollable?: boolean
}

function childPathActive(pathname: string, basePath: string, childHref: string) {
  const full = basePath + childHref
  return pathname === full || pathname.startsWith(`${full}/`)
}

export function BottomTabs({
  tabs,
  basePath = '',
  appearance = 'default',
  scrollable = false,
}: BottomTabsProps) {
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
      <div
        className={cn(
          'flex h-16 items-center',
          scrollable
            ? 'touch-pan-x justify-start gap-0.5 overflow-x-auto overflow-y-hidden px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            : 'justify-around',
        )}
      >
        {tabs.map((tab) => {
          if (isTabGroup(tab)) {
            const groupActive = tab.children.some((c) => childPathActive(pathname, basePath, c.href))
            const Icon = tab.icon

            return (
              <DropdownMenu key={`group:${tab.label}`}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'flex min-w-[64px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs transition-all duration-200',
                      'text-muted-foreground hover:text-foreground',
                      isSuper && 'hover:bg-zinc-100/80 dark:hover:bg-white/[0.06]',
                      groupActive && 'text-primary',
                      isSuper && groupActive && 'bg-primary/10 dark:bg-primary/15',
                    )}
                    aria-expanded={undefined}
                    aria-haspopup="menu"
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 transition-transform duration-200',
                        groupActive && 'text-primary',
                        isSuper && groupActive && 'scale-105',
                      )}
                    />
                    <span className="flex items-center gap-0.5 font-medium">
                      {tab.label}
                      <ChevronUp className="size-3 opacity-70" aria-hidden />
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" side="top" className="min-w-[10rem]">
                  {tab.children.map((child) => {
                    const fullHref = basePath + child.href
                    const active = childPathActive(pathname, basePath, child.href)
                    return (
                      <DropdownMenuItem key={child.href} asChild className={cn(active && 'bg-accent')}>
                        <Link href={fullHref} className="cursor-pointer">
                          {child.label}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          }

          const fullHref = basePath + tab.href
          const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`)
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={fullHref}
              className={cn(
                'flex min-w-[64px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-2.5 py-2 text-xs transition-all duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
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
              <span className={cn('font-medium', isActive && 'text-primary')}>{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
