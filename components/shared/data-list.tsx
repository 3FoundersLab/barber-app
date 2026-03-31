'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { cn } from '@/lib/utils'

interface DataListProps<T> {
  items: T[]
  isLoading?: boolean
  error?: string | null
  renderItem: (item: T, index: number) => React.ReactNode
  renderSkeleton?: () => React.ReactNode
  skeletonCount?: number
  emptyIcon?: React.ComponentType<{ className?: string }>
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  onRetry?: () => void
  className?: string
  itemClassName?: string
  keyExtractor?: (item: T, index: number) => string
}

export function DataList<T>({
  items,
  isLoading = false,
  error = null,
  renderItem,
  renderSkeleton,
  skeletonCount = 5,
  emptyIcon: EmptyIcon,
  emptyTitle = 'Nenhum item encontrado',
  emptyDescription,
  emptyAction,
  onRetry,
  className,
  itemClassName,
  keyExtractor = (_, index) => String(index),
}: DataListProps<T>) {
  // Loading state
  if (isLoading && renderSkeleton) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className={itemClassName}>
            {renderSkeleton()}
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Empty className={cn('min-h-[300px]', className)}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </EmptyMedia>
          <EmptyTitle>Erro ao carregar</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
        {onRetry && (
          <EmptyContent>
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </EmptyContent>
        )}
      </Empty>
    )
  }

  // Empty state
  if (items.length === 0) {
    return (
      <Empty className={cn('min-h-[300px]', className)}>
        <EmptyHeader>
          {EmptyIcon && (
            <EmptyMedia variant="icon">
              <EmptyIcon className="h-6 w-6" />
            </EmptyMedia>
          )}
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          {emptyDescription && (
            <EmptyDescription>{emptyDescription}</EmptyDescription>
          )}
        </EmptyHeader>
        {emptyAction && (
          <EmptyContent>
            {emptyAction}
          </EmptyContent>
        )}
      </Empty>
    )
  }

  // Data list
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {items.map((item, index) => (
        <div key={keyExtractor(item, index)} className={itemClassName}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}
