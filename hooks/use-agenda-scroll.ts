'use client'

import * as React from 'react'

/**
 * Configuração alinhada ao brief da agenda (faixa comercial, slots de 10 min, linha alta).
 * Para a grade principal do app, veja também `HORARIOS_PADRAO` em `@/lib/constants`.
 */
export const AGENDA_SCROLL_CONFIG = {
  startHour: 8,
  endHour: 22,
  intervalMinutes: 10,
  rowHeight: 60,
} as const

export type AgendaScrollConfig = typeof AGENDA_SCROLL_CONFIG

/** Minutos desde meia-noite no fuso local. */
function nowToMinutesPrecise(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
}

/**
 * Calcula `scrollTop` desejado (antes de limitar ao `scrollHeight` do container).
 * Equivale a: intervalos desde o início × altura da linha, ancorando ~`contextMinutes` antes do agora.
 */
export function getAgendaScrollTopPixels(params: {
  now: Date
  startHour: number
  endHour: number
  intervalMinutes: number
  rowHeight: number
  /** Cabeçalho fixo acima da timeline (ex.: faixa de horas). */
  headerOffsetPx?: number
  /** Contexto antes do horário atual (padrão 60 = 6 intervalos de 10 min). */
  contextMinutes?: number
}): number {
  const {
    now,
    startHour,
    endHour,
    intervalMinutes,
    rowHeight,
    headerOffsetPx = 0,
    contextMinutes = 60,
  } = params

  const step = Math.max(1, intervalMinutes)
  const dayStartMin = startHour * 60
  const dayEndMin = endHour * 60
  const nowMin = nowToMinutesPrecise(now)
  const slotsTotal = (dayEndMin - dayStartMin) / step

  if (nowMin < dayStartMin) return 0
  if (nowMin >= dayEndMin) return headerOffsetPx + slotsTotal * rowHeight

  const anchorMin = Math.max(dayStartMin, nowMin - Math.max(0, contextMinutes))
  const intervalsFromStart = (anchorMin - dayStartMin) / step
  return headerOffsetPx + intervalsFromStart * rowHeight
}

export interface UseAgendaScrollOptions extends Partial<AgendaScrollConfig> {
  behavior?: ScrollBehavior
  headerOffsetPx?: number
  contextMinutes?: number
  /**
   * Se informado, só alinha ao “agora” quando for o dia atual (`YYYY-MM-DD` local).
   * Caso contrário, posiciona no topo.
   */
  referenceDayKey?: string | null
  /** Chamar `scrollToCurrentTime` uma vez ao montar (padrão: true). */
  runOnMount?: boolean
}

/**
 * Scroll vertical da timeline da agenda no **elemento** indicado (não usa `window`).
 * Útil quando a grade está dentro de um div com `overflow-auto` (como em `AppointmentDayGrid`).
 */
export function useAgendaScroll(
  containerRef: React.RefObject<HTMLElement | null>,
  options?: UseAgendaScrollOptions,
) {
  const {
    startHour = AGENDA_SCROLL_CONFIG.startHour,
    endHour = AGENDA_SCROLL_CONFIG.endHour,
    intervalMinutes = AGENDA_SCROLL_CONFIG.intervalMinutes,
    rowHeight = AGENDA_SCROLL_CONFIG.rowHeight,
    behavior = 'smooth',
    headerOffsetPx = 0,
    contextMinutes = 60,
    referenceDayKey,
    runOnMount = true,
  } = options ?? {}

  const scrollToCurrentTime = React.useCallback(() => {
    const el = containerRef.current
    if (!el || typeof window === 'undefined') return

    const now = new Date()

    if (referenceDayKey) {
      const y = now.getFullYear()
      const mo = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      const todayKey = `${y}-${mo}-${d}`
      if (todayKey !== referenceDayKey) {
        el.scrollTop = 0
        return
      }
    }

    const rawTop = getAgendaScrollTopPixels({
      now,
      startHour,
      endHour,
      intervalMinutes,
      rowHeight,
      headerOffsetPx,
      contextMinutes,
    })
    const TOP_PAD = 8
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
    el.scrollTo({
      top: Math.min(Math.max(0, rawTop - TOP_PAD), maxScroll),
      behavior,
    })
  }, [
    containerRef,
    startHour,
    endHour,
    intervalMinutes,
    rowHeight,
    behavior,
    headerOffsetPx,
    contextMinutes,
    referenceDayKey,
  ])

  React.useEffect(() => {
    if (!runOnMount) return
    scrollToCurrentTime()
  }, [runOnMount, scrollToCurrentTime])

  return { scrollToCurrentTime }
}
