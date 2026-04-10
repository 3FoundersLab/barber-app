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
/** Mobile-first; em `lg+` alinha com `PageContent` para aproveitar melhor a largura no desktop. */
export const APP_PAGE_HEADER_BAR_CLASS =
  'h-16 shrink-0 border-b bg-background px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12'

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
    <div
      className={cn(
        'flex-1 p-4 md:p-6 lg:px-8 lg:py-6 xl:px-10 xl:py-7 2xl:px-12 2xl:py-8',
        className,
      )}
    >
      {heading ? (
        <div className="mb-4 md:mb-6 lg:mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0 space-y-1">
              <PageTitle>{heading.title}</PageTitle>
              {heading.subtitle != null &&
                (typeof heading.subtitle === 'string' ? (
                  <p className="text-sm text-muted-foreground">{heading.subtitle}</p>
                ) : (
                  heading.subtitle
                ))}
            </div>
            {heading.actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">{heading.actions}</div>
            ) : null}
          </div>
        </div>
      ) : null}
      {children}
    </div>
  )
}
