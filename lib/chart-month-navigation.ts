'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export const CHART_MONTH_SWIPE_THRESHOLD = 48
export const CHART_MONTH_DRAG_THRESHOLD = 42

export type MonthWindowBreakpointRule = { maxWidth: number; count: number }

/** Comportamento original do gráfico Barbearias (preservado). */
export const BARBEARIAS_MONTH_WINDOW_RULES: MonthWindowBreakpointRule[] = [
  { maxWidth: 480, count: 2 },
  { maxWidth: 768, count: 3 },
  { maxWidth: 1024, count: 4 },
  { maxWidth: Number.POSITIVE_INFINITY, count: 5 },
]

/** MRR: mais meses no mobile/tablet; desktop mostra a série inteira. */
export const MRR_MONTH_WINDOW_RULES: MonthWindowBreakpointRule[] = [
  { maxWidth: 480, count: 3 },
  { maxWidth: 768, count: 4 },
  { maxWidth: 1024, count: 6 },
  { maxWidth: Number.POSITIVE_INFINITY, count: 12 },
]

export function resolveVisibleMonthCount(
  innerWidth: number,
  rules: readonly MonthWindowBreakpointRule[],
): number {
  for (const r of rules) {
    if (innerWidth < r.maxWidth) return r.count
  }
  return rules[rules.length - 1]?.count ?? 5
}

export function useVisibleMonthCount(rules: readonly MonthWindowBreakpointRule[]): number {
  const fallback = rules[rules.length - 1]?.count ?? 5
  const [count, setCount] = useState(fallback)

  useEffect(() => {
    const update = () => setCount(resolveVisibleMonthCount(window.innerWidth, rules))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [rules])

  return count
}

export function useMonthWindowState(length: number, visibleCount: number) {
  const maxStart = Math.max(0, length - visibleCount)
  const [windowStart, setWindowStart] = useState(0)

  useEffect(() => {
    setWindowStart((s) => Math.min(s, maxStart))
  }, [maxStart, length])

  const canPrev = windowStart > 0
  const canNext = windowStart < maxStart

  const goPrev = useCallback(() => {
    setWindowStart((s) => Math.max(0, s - 1))
  }, [])

  const goNext = useCallback(() => {
    setWindowStart((s) => Math.min(maxStart, s + 1))
  }, [maxStart])

  const sliceVisible = useCallback(
    <T,>(items: readonly T[]) => items.slice(windowStart, windowStart + visibleCount),
    [windowStart, visibleCount],
  )

  return {
    windowStart,
    visibleCount,
    maxStart,
    canPrev,
    canNext,
    goPrev,
    goNext,
    sliceVisible,
  }
}

export function useMonthSwipeHandlers(goPrev: () => void, goNext: () => void) {
  const touchStartX = useRef<number | null>(null)
  const dragStartX = useRef<number | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current == null) return
      const dx = e.changedTouches[0].clientX - touchStartX.current
      touchStartX.current = null
      if (dx > CHART_MONTH_SWIPE_THRESHOLD) goPrev()
      else if (dx < -CHART_MONTH_SWIPE_THRESHOLD) goNext()
    },
    [goNext, goPrev],
  )

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragStartX.current = e.clientX
      const handleUp = (ev: MouseEvent) => {
        window.removeEventListener('mouseup', handleUp)
        if (dragStartX.current == null) return
        const dx = ev.clientX - dragStartX.current
        dragStartX.current = null
        if (Math.abs(dx) < CHART_MONTH_DRAG_THRESHOLD) return
        if (dx > 0) goPrev()
        else goNext()
      }
      window.addEventListener('mouseup', handleUp)
    },
    [goNext, goPrev],
  )

  return { onTouchStart, onTouchEnd, onMouseDown }
}

export const chartMonthNavButtonClassName = cn(
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-card/95 text-muted-foreground shadow-md',
  'transition-colors duration-200 hover:border-border hover:bg-muted/80 hover:text-foreground',
  'active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
)
