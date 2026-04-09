'use client'

import { cn } from '@/lib/utils'
import { useOptionalAppPageHeading } from '@/components/shared/app-page-heading-context'

export interface PageContainerProps {
  children: React.ReactNode
  className?: string
  /** Adiciona padding inferior para BottomTabs */
  hasBottomNav?: boolean
}

export function PageContainer({
  children,
  className,
  hasBottomNav = true,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        'flex min-h-screen flex-col bg-background',
        hasBottomNav && 'pb-20 md:pb-0',
        className
      )}
    >
      {children}
    </main>
  )
}

/**
 * Faixa superior do app: altura fixa para o `border-b` do header da página e do topo do sidebar
 * ficarem na mesma linha (sem “degrau” entre colunas).
 */
export const APP_PAGE_HEADER_BAR_CLASS = 'h-16 shrink-0 border-b bg-background px-4 md:px-6'

interface PageHeaderProps {
  children: React.ReactNode
  className?: string
}

export function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex items-center justify-between gap-4',
        APP_PAGE_HEADER_BAR_CLASS,
        className,
      )}
    >
      {children}
    </header>
  )
}

interface PageTitleProps {
  children: React.ReactNode
  className?: string
}

export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <h1 className={cn('text-xl font-semibold tracking-tight', className)}>
      {children}
    </h1>
  )
}

interface PageContentProps {
  children: React.ReactNode
  className?: string
}

export function PageContent({ children, className }: PageContentProps) {
  const headingCtx = useOptionalAppPageHeading()
  const heading = headingCtx?.heading ?? null

  return (
    <div className={cn('flex-1 p-4 md:p-6', className)}>
      {heading ? (
        <div className="mb-4 space-y-1 md:mb-6">
          <PageTitle>{heading.title}</PageTitle>
          {heading.subtitle != null &&
            (typeof heading.subtitle === 'string' ? (
              <p className="text-sm text-muted-foreground">{heading.subtitle}</p>
            ) : (
              heading.subtitle
            ))}
        </div>
      ) : null}
      {children}
    </div>
  )
}
