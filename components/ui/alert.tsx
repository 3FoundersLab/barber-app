import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import {
  AlertTriangle,
  CircleCheck,
  Info,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

/** Tempo padrão (ms) para fechar automaticamente quando `autoCloseMs` não for informado. */
export const ALERT_DEFAULT_AUTO_CLOSE_MS = 10_000

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>

const VARIANT_DEFAULT_ICONS: Record<AlertVariant, LucideIcon> = {
  default: Info,
  neutral: Info,
  info: Info,
  success: CircleCheck,
  purple: Sparkles,
  warning: Info,
  danger: AlertTriangle,
  destructive: AlertTriangle,
  dark: Info,
}

const alertVariants = cva(
  'relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 text-sm',
  {
    variants: {
      variant: {
        default:
          'border-neutral-200 bg-neutral-50 text-neutral-900 *:data-[slot=alert-description]:text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100 dark:*:data-[slot=alert-description]:text-neutral-400',
        neutral:
          'border-neutral-200 bg-neutral-50 text-neutral-900 *:data-[slot=alert-description]:text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-100 dark:*:data-[slot=alert-description]:text-neutral-400',
        info:
          'border-sky-300 bg-sky-50 text-sky-950 *:data-[slot=alert-description]:text-sky-900/80 dark:border-sky-700 dark:bg-sky-950/35 dark:text-sky-50 dark:*:data-[slot=alert-description]:text-sky-200/85',
        success:
          'border-emerald-300 bg-emerald-50 text-emerald-950 *:data-[slot=alert-description]:text-emerald-900/80 dark:border-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-50 dark:*:data-[slot=alert-description]:text-emerald-200/85',
        purple:
          'border-purple-300 bg-purple-50 text-purple-950 *:data-[slot=alert-description]:text-purple-900/80 dark:border-purple-700 dark:bg-purple-950/35 dark:text-purple-50 dark:*:data-[slot=alert-description]:text-purple-200/85',
        warning:
          'border-amber-300 bg-amber-50 text-amber-950 *:data-[slot=alert-description]:text-amber-900/80 dark:border-amber-700 dark:bg-amber-950/35 dark:text-amber-50 dark:*:data-[slot=alert-description]:text-amber-200/85',
        danger:
          'border-red-300 bg-red-50 text-red-950 *:data-[slot=alert-description]:text-red-900/80 dark:border-red-800 dark:bg-red-950/35 dark:text-red-50 dark:*:data-[slot=alert-description]:text-red-200/85',
        destructive:
          'border-red-300 bg-red-50 text-red-950 *:data-[slot=alert-description]:text-red-900/80 dark:border-red-800 dark:bg-red-950/35 dark:text-red-50 dark:*:data-[slot=alert-description]:text-red-200/85',
        dark:
          'border-slate-500 bg-slate-100 text-neutral-950 *:data-[slot=alert-description]:text-neutral-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50 dark:*:data-[slot=alert-description]:text-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const alertIconVariants = cva('size-5 shrink-0 translate-y-0.5', {
  variants: {
    variant: {
      default: 'text-neutral-500 dark:text-neutral-400',
      neutral: 'text-neutral-500 dark:text-neutral-400',
      info: 'text-sky-500 dark:text-sky-400',
      success: 'text-emerald-500 dark:text-emerald-400',
      purple: 'text-purple-500 dark:text-purple-400',
      warning: 'text-amber-500 dark:text-amber-400',
      danger: 'text-red-500 dark:text-red-400',
      destructive: 'text-red-500 dark:text-red-400',
      dark: 'text-slate-600 dark:text-slate-300',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

type AlertProps = Omit<React.ComponentProps<'div'>, 'onAnimationEnd'> &
  VariantProps<typeof alertVariants> & {
    /** Ícone à esquerda. Omitir = ícone padrão da variante; `null` = sem ícone. */
    icon?: LucideIcon | null
    /** Exibe o botão fechar e chama ao clicar ou ao fim do timer. */
    onClose?: () => void
    /** Fecha automaticamente após N ms (chama `onClose`). Requer `onClose`. */
    autoCloseMs?: number
  }

function Alert({
  className,
  variant,
  icon,
  children,
  onClose,
  autoCloseMs,
  ...props
}: AlertProps) {
  const v = variant ?? 'default'
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCloseRef = React.useRef(onClose)
  onCloseRef.current = onClose

  const clearTimer = React.useCallback(() => {
    if (timeoutRef.current != null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const handleClose = React.useCallback(() => {
    clearTimer()
    onCloseRef.current?.()
  }, [clearTimer])

  React.useEffect(() => {
    if (!onClose || autoCloseMs == null || autoCloseMs <= 0) return
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      onCloseRef.current?.()
    }, autoCloseMs)
    return clearTimer
  }, [autoCloseMs, onClose, clearTimer])

  const ResolvedIcon =
    icon === null ? null : icon === undefined ? VARIANT_DEFAULT_ICONS[v] : icon

  const showTimerBar =
    Boolean(onClose) && autoCloseMs != null && autoCloseMs > 0

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        alertVariants({ variant: v }),
        onClose && 'pr-11',
        className,
      )}
      {...props}
    >
      {showTimerBar ? (
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-0.5 bg-current opacity-20"
          aria-hidden
        >
          <div
            className="h-full w-full origin-left scale-x-100 bg-current opacity-50"
            style={{
              animation: `alert-auto-close-bar ${autoCloseMs}ms linear forwards`,
            }}
          />
        </div>
      ) : null}
      {ResolvedIcon !== null ? (
        <ResolvedIcon
          className={cn(alertIconVariants({ variant: v }))}
          aria-hidden
        />
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">{children}</div>
      {onClose ? (
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-2 top-2 rounded-md p-1 text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Fechar aviso"
        >
          <X className="size-4 shrink-0" aria-hidden />
        </button>
      ) : null}
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('font-semibold leading-tight tracking-tight', className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-sm leading-relaxed [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
