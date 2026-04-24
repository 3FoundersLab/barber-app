'use client'

import { forwardRef, memo } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { NotificationBellProps } from '@/types/notification'

const NotificationBellInner = forwardRef<HTMLButtonElement, NotificationBellProps>(
  function NotificationBell({ isLoading, unreadCount, totalCount, className, ...triggerProps }, ref) {
    const badgeLabel = unreadCount > 9 ? '9+' : String(unreadCount)

    return (
      <Button
        ref={ref}
        type="button"
        variant="ghost"
        size="icon"
        className={cn('relative h-9 w-9 shrink-0 rounded-full', className)}
        aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lida(s)` : totalCount > 0 ? ', todas lidas' : ''}`}
        {...triggerProps}
      >
        <Bell className="size-5 text-muted-foreground" aria-hidden />
        {!isLoading && unreadCount > 0 ? (
          <span
            className={cn(
              'absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full',
              'bg-primary px-1 text-[10px] font-semibold text-primary-foreground',
            )}
          >
            {badgeLabel}
          </span>
        ) : null}
      </Button>
    )
  },
)

NotificationBellInner.displayName = 'NotificationBell'

export const NotificationBell = memo(NotificationBellInner)
