'use client'

import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { getAgendaNowLineTopPx } from '@/lib/agenda-now-line'
import { cn } from '@/lib/utils'

/** Mesma cor da linha na grade principal (Teams / Outlook). */
export const AGENDA_NOW_LINE_CLASS = 'bg-[#e81123] dark:bg-[#ff6b6b]'

export interface AgendaNowLineMarkerProps {
  /** `null` oculta a linha. */
  topPx: number | null
  now: Date
  showClockLabel?: boolean
  /** Tokens `date-fns` (ex.: `HH:mm:ss` para relógio ao vivo na grade). */
  clockFormat?: string
  /** Pulso suave no traço (estilo do snippet de referência). */
  pulse?: boolean
  className?: string
}

/**
 * Só a marcação visual: use quando o horário já vem do pai (ex.: uma única fonte `nowMs` na grade).
 */
export function AgendaNowLineMarker({
  topPx,
  now,
  showClockLabel = false,
  clockFormat = 'HH:mm',
  pulse = false,
  className,
}: AgendaNowLineMarkerProps) {
  if (topPx == null) return null

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 z-[6]',
        pulse && 'animate-pulse',
        className,
      )}
      style={{ top: topPx - 1 }}
      aria-hidden
    >
      <div className={cn('h-0.5 w-full rounded-full opacity-95 shadow-sm', AGENDA_NOW_LINE_CLASS)} />
      {showClockLabel ? (
        <span
          className={cn(
            'absolute -top-3 left-0 rounded-r px-2 py-1 font-mono text-xs text-white',
            AGENDA_NOW_LINE_CLASS,
          )}
        >
          {format(now, clockFormat)}
        </span>
      ) : null}
    </div>
  )
}

export interface AgendaCurrentTimeLineProps {
  referenceDayKey: string | null
  dayStartMin: number
  dayEndMin: number
  slotMinutes: number
  rowHeightPx: number
  /** Atualização do relógio; padrão 60s como no snippet. Use 1000 para alinhar à grade principal. */
  tickMs?: number
  showClockLabel?: boolean
  pulse?: boolean
  className?: string
}

/**
 * Linha do horário atual com estado interno (timer). Útil em uma única coluna ou protótipo.
 * Na grade com várias colunas, prefira `AgendaNowLineMarker` + `now` vindo do pai para um só timer.
 */
export function AgendaCurrentTimeLine({
  referenceDayKey,
  dayStartMin,
  dayEndMin,
  slotMinutes,
  rowHeightPx,
  tickMs = 60_000,
  showClockLabel = true,
  pulse = true,
  className,
}: AgendaCurrentTimeLineProps) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const timer = window.setInterval(() => setNow(new Date()), tickMs)
    return () => window.clearInterval(timer)
  }, [tickMs])

  if (!now) return null

  const topPx = getAgendaNowLineTopPx(
    now,
    referenceDayKey,
    dayStartMin,
    dayEndMin,
    slotMinutes,
    rowHeightPx,
  )

  return (
    <AgendaNowLineMarker
      topPx={topPx}
      now={now}
      showClockLabel={showClockLabel}
      pulse={pulse}
      className={className}
    />
  )
}
