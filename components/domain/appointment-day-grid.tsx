'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  UserX,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  AgendaNowLineMarker,
  AGENDA_NOW_LINE_CLASS,
} from '@/components/domain/agenda-current-time-line'
import { ServicoAgendaIcon } from '@/lib/agenda-service-icons'
import { agendaLocalDayKey, getAgendaNowLineTopPx } from '@/lib/agenda-now-line'
import type { AgendaUnavailableBlock } from '@/lib/agenda-unavailable'
import { HORARIOS_PADRAO, parseAgendaClockToMinutes } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Agendamento, Barbeiro } from '@/types'

/** No dia de hoje (referência = hoje local), o scroll inicial alinha o horário atual, não o topo da grade. */
const SLOT_MINUTES = HORARIOS_PADRAO.intervalo
const ROW_PX = 24
const MIN_BLOCK_PX = 80
/** Duração mínima realista do bloco no eixo (não confundir com o passo da grade em minutos). */
const MIN_APPOINTMENT_DURATION_MIN = 10
/** Altura do cabeçalho (foto + nome) — deve bater com a célula vazia da coluna de horas. */
const HEADER_ROW_PX = 72

/** Cartões com barra lateral colorida + fundo neutro (calendário estilo Teams). */
const TEAM_EVENT_ACCENTS = [
  'border-l-[3px] border-l-[#5b5fc7] bg-card text-foreground border-y border-r border-border/70 dark:border-l-[#7f85f4] dark:bg-card',
  'border-l-[3px] border-l-sky-600 bg-card text-foreground border-y border-r border-border/70 dark:border-l-sky-400 dark:bg-card',
  'border-l-[3px] border-l-violet-600 bg-card text-foreground border-y border-r border-border/70 dark:border-l-violet-400 dark:bg-card',
  'border-l-[3px] border-l-teal-600 bg-card text-foreground border-y border-r border-border/70 dark:border-l-teal-400 dark:bg-card',
  'border-l-[3px] border-l-amber-600 bg-card text-foreground border-y border-r border-border/70 dark:border-l-amber-400 dark:bg-card',
  'border-l-[3px] border-l-rose-600 bg-card text-foreground border-y border-r border-border/70 dark:border-l-rose-400 dark:bg-card',
  'border-l-[3px] border-l-cyan-600 bg-card text-foreground border-y border-r border-border/70 dark:border-l-cyan-400 dark:bg-card',
] as const

export type AppointmentUnavailableBlock = AgendaUnavailableBlock

function timeToMinutes(t: string): number {
  return parseAgendaClockToMinutes(t) ?? 9 * 60
}

function minutesToLabel(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

function assignLanes(
  items: { id: string; start: number; end: number }[],
): { laneById: Map<string, number>; laneCount: number } {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end)
  const ends: number[] = []
  const laneById = new Map<string, number>()

  for (const item of sorted) {
    let lane = ends.findIndex((end) => end <= item.start)
    if (lane === -1) {
      ends.push(item.end)
      lane = ends.length - 1
    } else {
      ends[lane] = item.end
    }
    laneById.set(item.id, lane)
  }

  return { laneById, laneCount: Math.max(1, ends.length) }
}

const IR_PARA_AGORA_VIEWPORT_MARGIN_PX = 80

/** Scroll vertical que posiciona ~1h antes do horário atual (mesma regra do mount). */
function computeScrollTopForNowAnchor(
  el: HTMLElement,
  options: {
    viewingToday: boolean
    dayStartMin: number
    dayEndMin: number
    slotMinutes: number
    rowPx: number
    headerRowPx: number
    scrollToNowContextMinutes: number
    now: Date
  },
): number {
  const TOP_PAD = 8
  const {
    viewingToday,
    dayStartMin,
    dayEndMin,
    slotMinutes,
    rowPx,
    headerRowPx,
    scrollToNowContextMinutes,
    now,
  } = options
  if (!viewingToday) return 0
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const ctx = Math.max(0, scrollToNowContextMinutes)
  if (nowMin < dayStartMin) return 0
  if (nowMin >= dayEndMin) {
    return Math.max(0, el.scrollHeight - el.clientHeight)
  }
  const anchorMin = Math.max(dayStartMin, nowMin - ctx)
  const y = headerRowPx + ((anchorMin - dayStartMin) / slotMinutes) * rowPx
  const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
  return Math.min(Math.max(0, y - TOP_PAD), maxScroll)
}

export interface AppointmentDayGridProps {
  barbeiros: Barbeiro[]
  appointments: Agendamento[]
  /** Número da comanda por id do agendamento (ex.: após check-in). */
  comandaByAgendamentoId?: Record<string, number>
  onBlockClick?: (agendamento: Agendamento) => void
  className?: string
  /** Sobrescreve horário de início/fim do eixo (ex.: 09:00–18:00). */
  timeRange?: { start: string; end: string }
  /** Faixas cinzas “Não atende” por profissional. */
  unavailableBlocks?: AppointmentUnavailableBlock[]
  /**
   * Dia exibido na grade (data local). Se for o dia atual do usuário, o scroll vertical
   * posiciona ~1h antes do horário local; em outros dias, volta ao topo da timeline.
   */
  referenceDate?: Date
  /** Minutos de contexto antes do “agora” ao alinhar o scroll (padrão 60). */
  scrollToNowContextMinutes?: number
  /**
   * Quando a linha “agora” sai da área visível (scroll), recebe `true` para exibir FAB “Ir para agora”.
   */
  onIrParaAgoraFabChange?: (visible: boolean) => void
}

export type AppointmentDayGridHandle = {
  scrollToNow: (opts?: { behavior?: ScrollBehavior }) => void
}

export const AppointmentDayGrid = forwardRef<AppointmentDayGridHandle, AppointmentDayGridProps>(
  function AppointmentDayGrid(
    {
      barbeiros,
      appointments,
      comandaByAgendamentoId,
      onBlockClick,
      className,
      timeRange,
      unavailableBlocks,
      referenceDate,
      scrollToNowContextMinutes = 60,
      onIrParaAgoraFabChange,
    },
    ref,
  ) {
  const dayStartMin =
    parseAgendaClockToMinutes(timeRange?.start ?? HORARIOS_PADRAO.inicio) ?? 0
  const dayEndMin =
    parseAgendaClockToMinutes(timeRange?.end ?? HORARIOS_PADRAO.fim) ?? 24 * 60
  const totalMinutes = Math.max(0, dayEndMin - dayStartMin)
  const slotCount = Math.ceil(totalMinutes / SLOT_MINUTES)
  const gridHeight = slotCount * ROW_PX

  const referenceDayKey = useMemo(() => {
    if (!referenceDate) return null
    return agendaLocalDayKey(referenceDate)
  }, [referenceDate])

  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    if (!referenceDayKey) return
    if (agendaLocalDayKey(new Date()) !== referenceDayKey) return
    const tick = () => setNowMs(Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    const onVis = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [referenceDayKey])

  const nowLineOffsetPx = useMemo(
    () =>
      getAgendaNowLineTopPx(
        new Date(nowMs),
        referenceDayKey,
        dayStartMin,
        dayEndMin,
        SLOT_MINUTES,
        ROW_PX,
      ),
    [referenceDayKey, nowMs, dayStartMin, dayEndMin],
  )

  /** “Agora” em minutos no dia local — para esmaecer blocos já passados (só no dia de hoje na grade). */
  const nowMinuteAnchor = useMemo(() => {
    if (!referenceDayKey) return null
    const d = new Date(nowMs)
    if (agendaLocalDayKey(d) !== referenceDayKey) return null
    return (
      d.getHours() * 60 +
      d.getMinutes() +
      d.getSeconds() / 60 +
      d.getMilliseconds() / 60000
    )
  }, [referenceDayKey, nowMs])

  const gridBackgroundStyle = useMemo(() => {
    const hourPx = (60 / SLOT_MINUTES) * ROW_PX
    return {
      backgroundImage: [
        `repeating-linear-gradient(to bottom, hsl(var(--border) / 0.14) 0, hsl(var(--border) / 0.14) 1px, transparent 1px, transparent ${ROW_PX}px)`,
        `repeating-linear-gradient(to bottom, hsl(var(--border) / 0.42) 0, hsl(var(--border) / 0.42) 1px, transparent 1px, transparent ${hourPx}px)`,
      ].join(', '),
    }
  }, [SLOT_MINUTES])

  const scrollerRef = useRef<HTMLDivElement>(null)
  const colRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [scrollEdge, setScrollEdge] = useState({ left: true, right: true })

  const setColRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) colRefs.current.set(id, el)
    else colRefs.current.delete(id)
  }, [])

  const updateScrollEdges = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    const max = scrollWidth - clientWidth
    setScrollEdge({
      left: scrollLeft <= 2,
      right: max <= 2 || scrollLeft >= max - 2,
    })
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    updateScrollEdges()
    el.addEventListener('scroll', updateScrollEdges, { passive: true })
    const ro = new ResizeObserver(() => updateScrollEdges())
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateScrollEdges)
      ro.disconnect()
    }
  }, [barbeiros.length, updateScrollEdges])

  useImperativeHandle(
    ref,
    () => ({
      scrollToNow: (opts) => {
        const el = scrollerRef.current
        if (!el || referenceDayKey == null) return
        const today = new Date()
        const viewingToday = referenceDayKey === agendaLocalDayKey(today)
        const top = computeScrollTopForNowAnchor(el, {
          viewingToday,
          dayStartMin,
          dayEndMin,
          slotMinutes: SLOT_MINUTES,
          rowPx: ROW_PX,
          headerRowPx: HEADER_ROW_PX,
          scrollToNowContextMinutes,
          now: today,
        })
        el.scrollTo({ top, behavior: opts?.behavior ?? 'smooth' })
      },
    }),
    [referenceDayKey, dayStartMin, dayEndMin, scrollToNowContextMinutes],
  )

  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (!el || referenceDayKey == null) return

    const applyVerticalScroll = () => {
      const clock = new Date()
      const viewingToday = referenceDayKey === agendaLocalDayKey(clock)
      el.scrollTop = computeScrollTopForNowAnchor(el, {
        viewingToday,
        dayStartMin,
        dayEndMin,
        slotMinutes: SLOT_MINUTES,
        rowPx: ROW_PX,
        headerRowPx: HEADER_ROW_PX,
        scrollToNowContextMinutes,
        now: clock,
      })
    }

    applyVerticalScroll()
    let raf1 = 0
    let raf2 = 0
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(applyVerticalScroll)
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [
    referenceDayKey,
    dayStartMin,
    dayEndMin,
    slotCount,
    scrollToNowContextMinutes,
    barbeiros.length,
    appointments.length,
  ])

  const fabCallbackRef = useRef(onIrParaAgoraFabChange)
  fabCallbackRef.current = onIrParaAgoraFabChange

  useEffect(() => {
    const cb = fabCallbackRef.current
    if (!cb) return
    const el = scrollerRef.current
    if (!el) return

    const updateFab = () => {
      const onFab = fabCallbackRef.current
      if (!onFab) return
      const todayKey = agendaLocalDayKey(new Date())
      const viewingToday = referenceDayKey != null && referenceDayKey === todayKey
      if (!viewingToday || nowLineOffsetPx == null) {
        onFab(false)
        return
      }
      const lineY = HEADER_ROW_PX + nowLineOffsetPx
      const top = el.scrollTop
      const bottom = top + el.clientHeight
      const margin = IR_PARA_AGORA_VIEWPORT_MARGIN_PX
      const away = lineY < top + margin || lineY > bottom - margin
      onFab(away)
    }

    updateFab()
    el.addEventListener('scroll', updateFab, { passive: true })
    const ro = new ResizeObserver(updateFab)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', updateFab)
      ro.disconnect()
    }
  }, [referenceDayKey, nowLineOffsetPx, nowMs, onIrParaAgoraFabChange])

  const scrollByOneColumn = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el || barbeiros.length < 2) return
    const a = colRefs.current.get(barbeiros[0].id)
    const b = colRefs.current.get(barbeiros[1].id)
    const step =
      a && b ? Math.max(120, b.offsetLeft - a.offsetLeft) : colRefs.current.get(barbeiros[0].id)?.offsetWidth ?? 160
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }, [barbeiros])

  const timeLabels = useMemo(() => {
    const labels: number[] = []
    for (let i = 0; i < slotCount; i++) {
      labels.push(dayStartMin + i * SLOT_MINUTES)
    }
    return labels
  }, [dayStartMin, slotCount])

  const byBarbeiro = useMemo(() => {
    const map = new Map<string, Agendamento[]>()
    for (const b of barbeiros) map.set(b.id, [])
    for (const a of appointments) {
      const list = map.get(a.barbeiro_id)
      if (list) list.push(a)
    }
    return map
  }, [barbeiros, appointments])

  const unavailableByBarbeiro = useMemo(() => {
    const map = new Map<string, AppointmentUnavailableBlock[]>()
    for (const b of barbeiros) map.set(b.id, [])
    for (const u of unavailableBlocks ?? []) {
      const list = map.get(u.barbeiroId)
      if (list) list.push(u)
    }
    return map
  }, [barbeiros, unavailableBlocks])

  if (barbeiros.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border border-dashed bg-muted/20 px-4 py-5 text-center text-sm text-muted-foreground',
          className,
        )}
      >
        Nenhum profissional na equipe para exibir na grade. Cadastre barbeiros em Equipe.
      </div>
    )
  }

  const manyBarbers = barbeiros.length > 5
  const crowded = barbeiros.length > 4
  const singleBarber = barbeiros.length === 1

  return (
    <div className={cn('space-y-3', className)}>
      {barbeiros.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {manyBarbers ? (
            <p className="text-xs text-muted-foreground">
              {barbeiros.length} profissionais — use as setas ou o scroll horizontal.
            </p>
          ) : (
            <span className="text-xs text-muted-foreground">
              {barbeiros.length} profissionais
            </span>
          )}
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={scrollEdge.left}
              aria-label="Profissionais anteriores"
              onClick={() => scrollByOneColumn(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={scrollEdge.right}
              aria-label="Próximos profissionais"
              onClick={() => scrollByOneColumn(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div
        ref={scrollerRef}
        className={cn(
          'overflow-x-auto overflow-y-auto rounded-lg border border-border/80 bg-muted/15 shadow-sm dark:bg-card/40',
          'max-h-[min(72vh,calc(100dvh-13rem))] md:max-h-[min(78vh,calc(100dvh-11rem))]',
        )}
      >
        <div
          className={cn(
            'flex min-w-0 w-full',
            'snap-x snap-mandatory md:snap-none',
          )}
        >
          <div
            data-agenda-time-gutter
            className={cn(
              'sticky left-0 z-30 flex w-[3.25rem] shrink-0 flex-col border-r border-border/80 bg-muted/25 sm:w-[4.25rem]',
              'shadow-[6px_0_16px_-10px_rgba(0,0,0,0.12)] dark:bg-muted/20 dark:shadow-[6px_0_20px_-12px_rgba(0,0,0,0.45)]',
            )}
          >
            <div
              className="box-border flex w-full shrink-0 items-center justify-end border-b border-border/80 bg-muted/30 px-1 py-1 sm:px-2 dark:bg-muted/25"
              style={{ height: HEADER_ROW_PX }}
              aria-hidden
            />
            <div className="relative w-full bg-muted/10 dark:bg-transparent" style={{ height: gridHeight }}>
              {timeLabels.map((min) => {
                const slot = (min - dayStartMin) / SLOT_MINUTES
                const mod = min % 60
                const isHour = mod === 0
                const isHalf = mod === 30
                const isQuarter = mod === 15 || mod === 45
                return (
                  <div
                    key={min}
                    className="absolute right-0 box-border flex w-full items-start justify-end pr-1 sm:pr-2"
                    style={{ top: slot * ROW_PX, height: ROW_PX }}
                  >
                    {isHour ? (
                      <span className="pt-0.5 text-[11px] font-semibold tabular-nums leading-none text-foreground sm:text-xs">
                        {minutesToLabel(min)}
                      </span>
                    ) : isHalf ? (
                      <span className="pt-0.5 text-[10px] tabular-nums leading-none text-muted-foreground">
                        {minutesToLabel(min)}
                      </span>
                    ) : isQuarter ? (
                      <span className="pt-0.5 text-[10px] tabular-nums leading-none text-muted-foreground/85">
                        {minutesToLabel(min)}
                      </span>
                    ) : (
                      <span className="pt-1 text-[9px] tabular-nums leading-none text-muted-foreground/35">
                        ·
                      </span>
                    )}
                  </div>
                )
              })}
              {nowLineOffsetPx != null && (
                <div
                  className="pointer-events-none absolute right-0 z-[6] flex items-center pr-0.5 sm:pr-1"
                  style={{ top: nowLineOffsetPx - 6, height: 12 }}
                  aria-hidden
                >
                  <span
                    className={cn(
                      'h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-muted/60 dark:ring-background/80',
                      AGENDA_NOW_LINE_CLASS,
                    )}
                  />
                </div>
              )}
            </div>
          </div>

          {barbeiros.map((barbeiro, colIndex) => {
            const colApts = byBarbeiro.get(barbeiro.id) ?? []
            const prepared = colApts.map((a) => {
              const start = timeToMinutes(a.horario)
              const rawDur = a.servico?.duracao
              const dur = Math.max(
                MIN_APPOINTMENT_DURATION_MIN,
                typeof rawDur === 'number' && Number.isFinite(rawDur) ? rawDur : 30,
              )
              const end = start + dur
              return { a, start, end: Math.min(end, dayEndMin), fullEnd: end }
            })

            const laneInput = prepared
              .filter((p) => p.start < dayEndMin && p.end > dayStartMin)
              .map((p) => ({
                id: p.a.id,
                start: Math.max(p.start, dayStartMin),
                end: Math.min(p.end, dayEndMin),
              }))

            const { laneById, laneCount } = assignLanes(laneInput)

            const unavail = unavailableByBarbeiro.get(barbeiro.id) ?? []

            return (
              <div
                key={barbeiro.id}
                ref={(el) => setColRef(barbeiro.id, el)}
                className={cn(
                  'relative box-border border-r border-border/70 last:border-r-0',
                  colIndex % 2 === 1 && 'bg-muted/[0.08] dark:bg-muted/5',
                  'snap-center snap-always',
                  /* 1 profissional: ocupa toda a largura útil (sem faixa vazia) */
                  singleBarber && 'min-w-0 flex-1',
                  /* 2–4: dividem o espaço igualmente no desktop; no mobile mantém snap/swipe */
                  !singleBarber &&
                    !crowded &&
                    'min-w-[min(100%,85vw)] shrink-0 md:min-w-0 md:flex-1 md:max-w-none',
                  /* 5+: colunas com largura mínima + scroll/setas */
                  crowded &&
                    'min-w-[min(100%,85vw)] shrink-0 md:min-w-[148px] md:max-w-[220px] md:flex-1 md:basis-[148px]',
                )}
              >
                <div
                  className={cn(
                    'sticky top-0 z-20 box-border flex flex-col items-center justify-center gap-1 border-b border-border/80 px-2 py-1.5 backdrop-blur-sm',
                    colIndex % 2 === 1 ? 'bg-muted/35 dark:bg-muted/25' : 'bg-muted/25 dark:bg-muted/15',
                  )}
                  style={{ minHeight: HEADER_ROW_PX, height: HEADER_ROW_PX }}
                >
                  <Avatar className="h-8 w-8 border border-border/60 shadow-none ring-1 ring-border/40">
                    <AvatarImage
                      src={barbeiro.avatar || barbeiro.profile?.avatar}
                      alt=""
                      className="object-cover"
                    />
                    <AvatarFallback className="text-xs font-medium">
                      {barbeiro.nome
                        .split(/\s+/)
                        .map((w) => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="max-w-full truncate text-center text-[11px] font-medium leading-tight text-foreground sm:text-xs"
                    title={barbeiro.nome}
                  >
                    {barbeiro.nome}
                  </span>
                </div>

                <div className="relative box-border" style={{ height: gridHeight }}>
                  {/* Fundo da grelha. Overlays decorativos na timeline: z ≤ 1 e pointer-events-none, para não bloquear cartões (z-[3]+). */}
                  <div className="pointer-events-none absolute inset-0" style={gridBackgroundStyle} />
                  <AgendaNowLineMarker
                    topPx={nowLineOffsetPx}
                    now={new Date(nowMs)}
                    showClockLabel={colIndex === 0}
                  />

                  {unavail.map((block, idx) => {
                    const uStart = timeToMinutes(block.start)
                    const uEnd = timeToMinutes(block.end)
                    if (uStart >= dayEndMin || uEnd <= dayStartMin) return null
                    const visStart = Math.max(uStart, dayStartMin)
                    const visEnd = Math.min(uEnd, dayEndMin)
                    const top = ((visStart - dayStartMin) / SLOT_MINUTES) * ROW_PX
                    const h = Math.max(
                      ((visEnd - visStart) / SLOT_MINUTES) * ROW_PX,
                      ROW_PX,
                    )
                    return (
                      <div
                        key={`${barbeiro.id}-na-${idx}`}
                        className="pointer-events-none absolute inset-x-1 z-[1] flex items-start justify-center rounded-md border border-dashed border-border/80 bg-muted/40 px-1 pt-0.5 text-center text-[10px] font-medium leading-tight text-muted-foreground dark:bg-muted/25"
                        style={{ top, height: h }}
                        title={block.label ?? 'Não atende'}
                      >
                        <span className="line-clamp-2">{block.label ?? 'Não atende'}</span>
                      </div>
                    )
                  })}

                  {prepared.map(({ a, start, end, fullEnd }) => {
                    if (start >= dayEndMin || end <= dayStartMin) return null

                    const visStart = Math.max(start, dayStartMin)
                    const visEnd = Math.min(end, dayEndMin)
                    const top = ((visStart - dayStartMin) / SLOT_MINUTES) * ROW_PX
                    const slotSpanMin = Math.max(visEnd - visStart, MIN_APPOINTMENT_DURATION_MIN)
                    const fromGrid = (slotSpanMin / SLOT_MINUTES) * ROW_PX
                    const height = Math.max(
                      Number.isFinite(fromGrid) ? fromGrid : MIN_BLOCK_PX,
                      MIN_BLOCK_PX,
                    )

                    const lane = laneById.get(a.id) ?? 0
                    const gapPct = 1.5
                    const w = (100 - gapPct * (laneCount - 1)) / laneCount
                    const left = lane * (w + gapPct)

                    const accent = TEAM_EVENT_ACCENTS[hashId(a.cliente_id || a.id) % TEAM_EVENT_ACCENTS.length]
                    const done = a.status === 'concluido'
                    const cancelled = a.status === 'cancelado' || a.status === 'faltou'
                    const inProgress = a.status === 'em_atendimento'
                    const comandaNo = comandaByAgendamentoId?.[a.id]
                    const payAlert =
                      a.status_pagamento === 'pendente' &&
                      (a.status === 'agendado' || a.status === 'em_atendimento' || a.status === 'concluido')

                    const startLbl = minutesToLabel(start)
                    const endLbl = minutesToLabel(fullEnd)

                    const isPastBlock =
                      nowMinuteAnchor != null &&
                      end <= nowMinuteAnchor &&
                      !inProgress &&
                      !done &&
                      !cancelled

                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onBlockClick?.(a)}
                        className={cn(
                          'absolute z-[3] box-border flex flex-col gap-0.5 overflow-hidden rounded-md border-l-[3px] px-2 py-1.5 text-left transition',
                          'border-y border-r border-border/60 shadow-sm dark:border-border/50',
                          'hover:z-[4] hover:shadow-md hover:brightness-[1.01] active:scale-[0.995]',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          isPastBlock && 'opacity-[0.68] saturate-[0.88]',
                          done &&
                            'border-l-muted-foreground/50 bg-muted/80 text-foreground dark:border-l-muted-foreground/40',
                          cancelled &&
                            'border-l-zinc-400 bg-zinc-100/95 text-zinc-600 opacity-[0.75] line-through decoration-zinc-500/90 dark:border-l-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400 dark:decoration-zinc-500',
                          inProgress &&
                            'z-[4] border-l-emerald-600 bg-emerald-50/95 text-emerald-950 dark:border-l-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-50 motion-safe:agenda-em-atendimento-pulse',
                          !done && !cancelled && !inProgress && accent,
                          payAlert && 'ring-2 ring-red-400/70 ring-offset-1 ring-offset-background',
                        )}
                        style={{
                          top,
                          height,
                          left: `calc(${left}% + 2px)`,
                          width: `calc(${w}% - 4px)`,
                        }}
                      >
                        <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                          {a.status === 'concluido' ? (
                            <Check className="h-3 w-3 text-emerald-600" aria-hidden />
                          ) : a.status === 'em_atendimento' ? (
                            <>
                              <span
                                className="relative flex h-3 w-3 shrink-0 items-center justify-center"
                                aria-hidden
                              >
                                <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-500 opacity-75 motion-safe:animate-ping" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                              </span>
                              <ClipboardCheck
                                className="h-3 w-3 text-emerald-800 dark:text-emerald-200"
                                aria-hidden
                              />
                            </>
                          ) : a.status === 'cancelado' ? (
                            <Ban className="h-3 w-3" aria-hidden />
                          ) : a.status === 'faltou' ? (
                            <UserX className="h-3 w-3" aria-hidden />
                          ) : (
                            <ServicoAgendaIcon nome={a.servico?.nome} />
                          )}
                        </span>
                        <span className="truncate text-[11px] font-semibold leading-tight">
                          {a.cliente?.nome ?? 'Cliente'}
                        </span>
                        <span className="truncate text-[10px] leading-tight opacity-90">
                          {a.servico?.nome ?? 'Serviço'}
                        </span>
                        <span
                          className={cn(
                            'truncate text-[10px] tabular-nums',
                            inProgress
                              ? 'font-semibold text-emerald-900 dark:text-emerald-100'
                              : 'text-muted-foreground',
                          )}
                        >
                          {startLbl} – {endLbl}
                          {inProgress && comandaNo != null ? ` · Comanda #${comandaNo}` : ''}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
})
