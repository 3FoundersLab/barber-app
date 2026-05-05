'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { AppBrandLogo } from '@/components/shared/app-brand-logo'
import { groupNavEntries, isTabGroup, type NavEntry, type TabItem } from '@/components/shared/bottom-tabs'
import { APP_PAGE_HEADER_BAR_CLASS } from '@/components/shared/page-container'
import { superShellHeaderBarClass } from '@/components/super/super-ui'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { shellSidebarInsetRem } from '@/lib/shell-sidebar-inset'
import { cn } from '@/lib/utils'

const SUPER_SIDEBAR_COLLAPSED_KEY = 'barber-app-super-sidebar-collapsed'

export type DesktopSidebarFooter = ReactNode | ((ctx: { collapsed: boolean }) => ReactNode)

interface DesktopSidebarProps {
  title?: string
  appBrand?: { href: string; collapsible?: boolean }
  tabs: NavEntry[]
  /** Faixa opcional logo abaixo do cabeçalho (ex.: contexto da unidade no painel tenant). */
  belowHeader?: DesktopSidebarFooter
  footer?: DesktopSidebarFooter
  /** Super Admin: vidro e navegação alinhados à landing. */
  appearance?: 'default' | 'super'
}

function resolveFooter(footer: DesktopSidebarFooter | undefined, collapsed: boolean) {
  if (footer == null) return null
  if (typeof footer === 'function') return footer({ collapsed })
  return footer
}

function pathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DesktopSidebar({
  title,
  appBrand,
  tabs,
  belowHeader,
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
  /** Tablet: 16rem; desktop largo: mais espaço para labels e seções sem mudar o mobile. */
  const widthClass = wide ? 'md:w-64 lg:w-72' : 'md:w-[4.5rem]'

  const asideRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = asideRef.current?.closest('[data-app-shell]')
    if (!el || !(el instanceof HTMLElement)) return

    const apply = () => {
      el.style.setProperty('--shell-sidebar-inset', shellSidebarInsetRem(collapsible, wide))
    }
    apply()
    window.addEventListener('resize', apply)
    return () => {
      window.removeEventListener('resize', apply)
      el.style.removeProperty('--shell-sidebar-inset')
    }
  }, [collapsible, wide])

  const headerBarClass = isSuper ? superShellHeaderBarClass : APP_PAGE_HEADER_BAR_CLASS
  const sidebarHeaderExtras = cn('border-b-0', isSuper && 'shadow-none')

  const header = appBrand ? (
    <div
      className={cn(
        'flex items-center overflow-hidden',
        headerBarClass,
        sidebarHeaderExtras,
        wide ? 'flex-row gap-2' : 'flex-row justify-center gap-1 px-1.5',
      )}
    >
      <div
        className={cn(
          'min-w-0',
          wide ? 'flex-1' : 'flex shrink-0 items-center justify-center',
        )}
      >
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
            wide ? 'h-8 w-8' : 'h-6 w-6',
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
    <div className={cn('flex items-center overflow-hidden', headerBarClass, sidebarHeaderExtras)}>
      <p className="truncate text-sm font-semibold">{title}</p>
    </div>
  )

  const navGroups = groupNavEntries(tabs)

  function renderSidebarTabItem(item: TabItem) {
    if (isTabGroup(item)) {
      const groupActive = item.children.some((c) => pathActive(pathname, c.href))
      const Icon = item.icon

      if (!wide) {
        return (
          <DropdownMenu key={`group:${item.label}`}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title={item.label}
                className={cn(
                  'flex w-full items-center justify-center rounded-md px-2 py-2 md:py-2.5 text-sm transition-all duration-200',
                  groupActive
                    ? isSuper
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'bg-primary text-primary-foreground'
                    : isSuper
                      ? 'text-muted-foreground hover:bg-zinc-100/85 hover:text-foreground dark:hover:bg-white/[0.06]'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                aria-haspopup="menu"
              >
                <Icon className="h-4 w-4 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" className="min-w-[11rem]">
              {item.children.map((child) => {
                const active = pathActive(pathname, child.href)
                const brand = Boolean(child.relatoriosBrandActive)
                return (
                  <DropdownMenuItem
                    key={child.href}
                    asChild
                    className={cn(
                      active &&
                        (brand
                          ? 'bg-[var(--relatorios-visao-ativo)] text-[var(--relatorios-visao-ativo-foreground)] focus:bg-[var(--relatorios-visao-ativo)]'
                          : 'bg-accent'),
                    )}
                  >
                    <Link href={child.href} className="cursor-pointer">
                      {child.label}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }

      return (
        <Collapsible
          key={`group:${item.label}`}
          defaultOpen={groupActive}
          className="space-y-1"
        >
          <CollapsibleTrigger
            type="button"
            className={cn(
              'group flex w-full items-center gap-2 rounded-md text-sm transition-all duration-200',
              'px-2.5 py-1.5 text-left md:px-3 md:py-2',
              groupActive && !isSuper && 'bg-muted/80 text-foreground',
              groupActive && isSuper && 'bg-zinc-200/80 text-foreground dark:bg-white/[0.08]',
              !groupActive &&
                (isSuper
                  ? 'text-muted-foreground hover:bg-zinc-100/85 hover:text-foreground dark:hover:bg-white/[0.06]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'),
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
            <ChevronDown className="size-4 shrink-0 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-px pl-1.5 md:space-y-0.5 md:pl-2">
            {item.children.map((child) => {
              const active = pathActive(pathname, child.href)
              const brand = Boolean(child.relatoriosBrandActive)
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    'block truncate rounded-md py-1.5 pl-6 pr-2 text-sm transition-all duration-200 md:py-2 md:pl-7 md:pr-3',
                    active && brand
                      ? 'bg-[var(--relatorios-visao-ativo)] text-[var(--relatorios-visao-ativo-foreground)] shadow-sm'
                      : active
                        ? isSuper
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                          : 'bg-primary text-primary-foreground'
                        : isSuper
                          ? 'text-muted-foreground hover:bg-zinc-100/85 hover:text-foreground dark:hover:bg-white/[0.06]'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {child.label}
                </Link>
              )
            })}
          </CollapsibleContent>
        </Collapsible>
      )
    }

    const isActive = pathActive(pathname, item.href)
    const Icon = item.icon

    return (
      <Link
        key={item.href}
        href={item.href}
        title={!wide ? item.label : undefined}
        className={cn(
          'flex items-center gap-2 rounded-md text-sm transition-all duration-200',
          wide ? 'px-2.5 py-1.5 md:px-3 md:py-2' : 'justify-center px-2 py-2 md:py-2.5',
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
  }

  return (
    <>
      <aside
        ref={asideRef}
        className={cn(
          'hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:flex-col md:border-r md:transition-[width] md:duration-200 md:ease-out',
          isSuper
            ? 'md:border-zinc-200/80 md:bg-white/75 md:backdrop-blur-xl dark:md:border-zinc-800/80 dark:md:bg-zinc-950/72'
            : 'md:bg-background',
          widthClass,
        )}
      >
        {header}

        {belowHeader ? (
          <div className="px-2.5 py-2 md:px-3">
            {resolveFooter(belowHeader, !wide)}
          </div>
        ) : null}

        <nav
          id="desktop-sidebar-nav"
          className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-2.5 py-2 md:space-y-1 md:px-3 md:py-3 lg:py-4"
          aria-label="Navegação principal"
        >
          {navGroups.map((group, groupIndex) => (
            <div
              key={group.label ?? `default-${groupIndex}`}
              className={cn(
                'space-y-0.5 md:space-y-1',
                groupIndex > 0 &&
                  (isSuper
                    ? 'border-t border-zinc-200/80 pt-2.5 dark:border-zinc-800/80 md:pt-3 lg:pt-3.5'
                    : 'border-t border-border/70 pt-2.5 md:pt-3 lg:pt-3.5'),
              )}
            >
              {group.label ? (
                wide ? (
                  <p
                    className={cn(
                      'px-2.5 pb-0.5 pt-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:px-3 md:pb-1 md:text-xs',
                      isSuper && 'text-zinc-500 dark:text-zinc-400',
                    )}
                  >
                    {group.label}
                  </p>
                ) : groupIndex > 0 ? (
                  <div
                    className={cn(
                      'mx-1 mb-1 h-px shrink-0',
                      isSuper ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-border',
                    )}
                    role="separator"
                    aria-hidden
                  />
                ) : null
              ) : null}
              {group.items.map((item) => renderSidebarTabItem(item))}
            </div>
          ))}
        </nav>

        {footer ? (
          <div
            className={cn(
              'border-t px-2.5 py-2.5 md:px-3 md:py-3',
              isSuper && 'border-zinc-200/80 dark:border-zinc-800',
            )}
          >
            {resolveFooter(footer, !wide)}
          </div>
        ) : null}
      </aside>
    </>
  )
}
