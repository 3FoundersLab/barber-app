'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Ban, Check, ChevronLeft, ChevronRight, Monitor, Smartphone, UserX } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ServicoAgendaIcon } from '@/lib/agenda-service-icons'
import type { AgendaUnavailableBlock } from '@/lib/agenda-unavailable'
import { HORARIOS_PADRAO } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Agendamento, Barbeiro } from '@/types'

const SLOT_MINUTES = 10
const ROW_PX = 24
const MIN_BLOCK_PX = 80
/** Altura do cabeçalho (foto + nome) — deve bater com a célula vazia da coluna de horas. */
const HEADER_ROW_PX = 72

const PASTEL_BLOCK = [
  'bg-emerald-100/95 text-emerald-950 border-emerald-200/70',
  'bg-orange-100/95 text-orange-950 border-orange-200/70',
  'bg-violet-100/95 text-violet-950 border-violet-200/70',
  'bg-amber-100/95 text-amber-950 border-amber-200/70',
  'bg-sky-100/95 text-sky-950 border-sky-200/70',
  'bg-rose-100/95 text-rose-950 border-rose-200/70',
  'bg-teal-100/95 text-teal-950 border-teal-200/70',
] as const

export type AppointmentUnavailableBlock = AgendaUnavailableBlock

function timeToMinutes(t: string): number {
  if (!t || typeof t !== 'string') return 9 * 60
  let s = t.trim()
  const tIdx = s.indexOf('T')
  if (tIdx !== -1) s = s.slice(tIdx + 1)
  const match = s.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return 9 * 60
  const h = Number(match[1])
  const m = Number(match[2])
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 9 * 60
  return h * 60 + m
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

export interface AppointmentDayGridProps {
  barbeiros: Barbeiro[]
  appointments: Agendamento[]
  onBlockClick?: (agendamento: Agendamento) => void
  className?: string
  /** Sobrescreve horário de início/fim do eixo (ex.: 09:00–18:00). */
  timeRange?: { start: string; end: string }
  /** Faixas cinzas “Não atende” por profissional. */
  unavailableBlocks?: AppointmentUnavailableBlock[]
}

export function AppointmentDayGrid({
  barbeiros,
  appointments,
  onBlockClick,
  className,
  timeRange,
  unavailableBlocks,
}: AppointmentDayGridProps) {
  const dayStartMin = timeToMinutes(timeRange?.start ?? HORARIOS_PADRAO.inicio)
  const dayEndMin = timeToMinutes(timeRange?.end ?? HORARIOS_PADRAO.fim)
  const totalMinutes = dayEndMin - dayStartMin
  const slotCount = Math.ceil(totalMinutes / SLOT_MINUTES)
  const gridHeight = slotCount * ROW_PX

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
          'overflow-x-auto overflow-y-auto rounded-xl border bg-card shadow-sm',
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
            className="sticky left-0 z-30 flex w-[3.25rem] shrink-0 flex-col border-r border-border bg-background sm:w-14"
          >
            <div
              className="box-border flex w-full shrink-0 items-center justify-end border-b border-border bg-background px-1 py-1 sm:px-2"
              style={{ height: HEADER_ROW_PX }}
              aria-hidden
            />
            <div className="relative w-full bg-background" style={{ height: gridHeight }}>
              {timeLabels.map((min) => {
                const slot = (min - dayStartMin) / SLOT_MINUTES
                return (
                  <div
                    key={min}
                    className="absolute right-0 box-border flex w-full items-start justify-end pr-1 pt-0.5 text-[10px] tabular-nums leading-none text-muted-foreground sm:text-[11px] sm:pr-2"
                    style={{ top: slot * ROW_PX, height: ROW_PX }}
                  >
                    {minutesToLabel(min)}
                  </div>
                )
              })}
            </div>
          </div>

          {barbeiros.map((barbeiro) => {
            const colApts = byBarbeiro.get(barbeiro.id) ?? []
            const prepared = colApts.map((a) => {
              const start = timeToMinutes(a.horario)
              const rawDur = a.servico?.duracao
              const dur = Math.max(
                10,
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
                  'relative box-border border-r border-border last:border-r-0',
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
                  className="sticky top-0 z-20 box-border flex flex-col items-center justify-center gap-1 border-b border-border bg-background/95 px-2 py-1.5 backdrop-blur-sm"
                  style={{ minHeight: HEADER_ROW_PX, height: HEADER_ROW_PX }}
                >
                  <Avatar className="h-9 w-9 border border-border/80 shadow-sm">
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
                    className="max-w-full truncate text-center text-[11px] font-semibold leading-tight sm:text-xs"
                    title={barbeiro.nome}
                  >
                    {barbeiro.nome}
                  </span>
                </div>

                <div className="relative box-border" style={{ height: gridHeight }}>
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      backgroundImage: `repeating-linear-gradient(to bottom, hsl(var(--border) / 0.35) 0px, hsl(var(--border) / 0.35) 1px, transparent 1px, transparent ${ROW_PX}px)`,
                    }}
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
                        className="pointer-events-none absolute inset-x-0.5 z-[1] flex items-start justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/70 px-1 pt-0.5 text-center text-[10px] font-medium leading-tight text-muted-foreground"
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
                    const slotSpanMin = Math.max(visEnd - visStart, SLOT_MINUTES)
                    const fromGrid = (slotSpanMin / SLOT_MINUTES) * ROW_PX
                    const height = Math.max(
                      Number.isFinite(fromGrid) ? fromGrid : MIN_BLOCK_PX,
                      MIN_BLOCK_PX,
                    )

                    const lane = laneById.get(a.id) ?? 0
                    const gapPct = 1.5
                    const w = (100 - gapPct * (laneCount - 1)) / laneCount
                    const left = lane * (w + gapPct)

                    const pastel = PASTEL_BLOCK[hashId(a.cliente_id || a.id) % PASTEL_BLOCK.length]
                    const done = a.status === 'concluido'
                    const cancelled = a.status === 'cancelado' || a.status === 'faltou'
                    const payAlert =
                      a.status_pagamento === 'pendente' &&
                      (a.status === 'agendado' || a.status === 'concluido')

                    const startLbl = minutesToLabel(start)
                    const endLbl = minutesToLabel(fullEnd)

                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => onBlockClick?.(a)}
                        className={cn(
                          'absolute z-[2] box-border flex flex-col gap-0.5 overflow-hidden rounded-xl border px-2 py-1.5 text-left shadow-sm transition',
                          'hover:z-[3] hover:shadow-md hover:brightness-[0.99] active:scale-[0.99]',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          done && 'bg-muted/90 text-foreground border-border',
                          cancelled && 'opacity-55 line-through decoration-muted-foreground/80',
                          !done && !cancelled && pastel,
                          payAlert && 'ring-2 ring-red-400/80 ring-offset-1 ring-offset-background',
                        )}
                        style={{
                          top,
                          height,
                          left: `calc(${left}% + 1px)`,
                          width: `calc(${w}% - 2px)`,
                        }}
                      >
                        <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                          {a.status === 'concluido' ? (
                            <Check className="h-3 w-3 text-emerald-600" aria-hidden />
                          ) : a.status === 'cancelado' ? (
                            <Ban className="h-3 w-3" aria-hidden />
                          ) : a.status === 'faltou' ? (
                            <UserX className="h-3 w-3" aria-hidden />
                          ) : (
                            <>
                              <ServicoAgendaIcon nome={a.servico?.nome} />
                              <Smartphone className="h-3 w-3 opacity-80" aria-hidden />
                              <Monitor className="h-3 w-3 opacity-60" aria-hidden />
                            </>
                          )}
                        </span>
                        <span className="truncate text-[11px] font-semibold leading-tight">
                          {a.cliente?.nome ?? 'Cliente'}
                        </span>
                        <span className="truncate text-[10px] leading-tight opacity-90">
                          {a.servico?.nome ?? 'Serviço'}
                        </span>
                        <span className="truncate text-[10px] tabular-nums text-muted-foreground">
                          {startLbl} – {endLbl}
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
}
