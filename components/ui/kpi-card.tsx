'use client'

import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
  color?: 'amber' | 'green' | 'blue' | 'purple'
  onClick?: () => void
  /**
   * Quando a métrica é “quanto menor melhor” (ex.: cancelamentos), inverta cores e setas
   * em relação ao sinal de `change`.
   */
  invertChangeSemantics?: boolean
  className?: string
}

const colorSurface: Record<NonNullable<KPICardProps['color']>, string> = {
  amber:
    'from-amber-500/12 via-amber-500/5 to-transparent dark:from-amber-500/18 dark:via-amber-500/8',
  green:
    'from-emerald-500/12 via-emerald-500/5 to-transparent dark:from-emerald-500/18 dark:via-emerald-500/8',
  blue: 'from-blue-500/12 via-blue-500/5 to-transparent dark:from-blue-500/18 dark:via-blue-500/8',
  purple:
    'from-violet-500/12 via-violet-500/5 to-transparent dark:from-violet-500/18 dark:via-violet-500/8',
}

const colorIconRing: Record<NonNullable<KPICardProps['color']>, string> = {
  amber: 'bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-400',
  green: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-400',
  blue: 'bg-blue-500/15 text-blue-700 ring-blue-500/25 dark:text-blue-400',
  purple: 'bg-violet-500/15 text-violet-700 ring-violet-500/25 dark:text-violet-400',
}

function effectiveTrend(change: number | undefined, explicit: KPICardProps['trend']): 'up' | 'down' | 'neutral' {
  if (explicit && explicit !== 'neutral') return explicit
  if (change === undefined || Number.isNaN(change)) return 'neutral'
  if (change > 0) return 'up'
  if (change < 0) return 'down'
  return 'neutral'
}

export function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend: trendProp,
  color = 'amber',
  onClick,
  invertChangeSemantics = false,
  className,
}: KPICardProps) {
  const trend = effectiveTrend(change, trendProp)
  const showDelta = change !== undefined && !Number.isNaN(change)
  const posGood = !invertChangeSemantics
  let deltaClass = 'text-muted-foreground'
  let DeltaIcon: typeof ArrowUpRight = Minus

  if (showDelta && trend !== 'neutral') {
    const isUp = trend === 'up'
    const good = posGood ? isUp : !isUp
    deltaClass = good
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400'
    DeltaIcon = isUp ? ArrowUpRight : ArrowDownRight
  }

  const inner = (
    <>
      <div
        className={cn(
          'pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br opacity-90',
          colorSurface[color],
        )}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-3xl">{value}</p>
          {showDelta || changeLabel ? (
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs">
              {showDelta ? (
                <span className={cn('inline-flex items-center gap-0.5 font-medium tabular-nums', deltaClass)}>
                  <DeltaIcon className="size-3.5 shrink-0" aria-hidden />
                  <span>
                    {change !== undefined && change > 0 ? '+' : ''}
                    {typeof change === 'number' ? change.toFixed(1) : change}%
                  </span>
                </span>
              ) : null}
              {changeLabel ? (
                <span className="text-muted-foreground">{changeLabel}</span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-full ring-2 ring-inset',
            colorIconRing[color],
          )}
          aria-hidden
        >
          <Icon className="size-5" strokeWidth={2} />
        </div>
      </div>
    </>
  )

  const sharedClass = cn(
    'relative overflow-hidden rounded-xl border border-border/70 bg-card/80 p-4 text-left shadow-sm transition-shadow',
    onClick && 'cursor-pointer hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    className,
  )

  if (onClick) {
    return (
      <button type="button" className={sharedClass} onClick={onClick}>
        {inner}
      </button>
    )
  }

  return <div className={sharedClass}>{inner}</div>
}
