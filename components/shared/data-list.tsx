'use client'

import { RefreshCw } from 'lucide-react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  ALERT_DEFAULT_AUTO_CLOSE_MS,
} from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { cn } from '@/lib/utils'

interface DataListProps<T> {
  items: T[]
  isLoading?: boolean
  error?: string | null
  /** Fecha o alerta de erro (X e auto-close). Sem isso o aviso permanece fixo. */
  onClearError?: () => void
  /** Ms até fechar o erro; padrão `ALERT_DEFAULT_AUTO_CLOSE_MS` quando `onClearError` existe. */
  errorAutoCloseMs?: number
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
  onClearError,
  errorAutoCloseMs,
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
    const closeMs = onClearError
      ? (errorAutoCloseMs ?? ALERT_DEFAULT_AUTO_CLOSE_MS)
      : undefined
    return (
      <div className={cn('flex min-h-[300px] flex-col justify-center gap-4', className)}>
        <Alert
          variant="danger"
          onClose={onClearError}
          autoCloseMs={closeMs}
        >
          <AlertTitle>Erro ao carregar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        {onRetry && (
          <div className="flex justify-center">
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        )}
      </div>
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
