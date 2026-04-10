'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Clock, Scissors, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DIAS_SEMANA_ABREV } from '@/lib/constants'
import { cn } from '@/lib/utils'

type CalendarView = 'month' | 'week' | 'day'

const VIEW_LABELS: Record<CalendarView, string> = {
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
}

interface DateNavigatorCalendarProps {
  value?: Date
  onChange: (date: Date) => void
  disabled?: (date: Date) => boolean
  appointments?: Array<{
    id: string
    data: string
    horario?: string
    clienteNome?: string
    barbeiroNome?: string
    servicoNome?: string
  }>
  onMoveAppointment?: (appointmentId: string, nextDate: Date) => Promise<void> | void
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatMonthTitle(date: Date) {
  const raw = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function formatDayTitlePt(date: Date) {
  const raw = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

export function DateNavigatorCalendar({
  value,
  onChange,
  disabled,
  appointments = [],
  onMoveAppointment,
}: DateNavigatorCalendarProps) {
  const appointmentsByDay = useMemo(() => {
    const grouped = new Map<string, typeof appointments>()
    for (const appointment of appointments) {
      const list = grouped.get(appointment.data) ?? []
      list.push(appointment)
      grouped.set(appointment.data, list)
    }

    for (const [, list] of grouped) {
      list.sort((a, b) => (a.horario ?? '').localeCompare(b.horario ?? ''))
    }

    return grouped
  }, [appointments])

  const toDateKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const selected = value ?? new Date()
  const [view, setView] = useState<CalendarView>('month')
  const [anchorDate, setAnchorDate] = useState<Date>(selected)
  const [moreDayModal, setMoreDayModal] = useState<Date | null>(null)
  const today = new Date()

  const monthDays = useMemo(() => {
    const firstDay = startOfMonth(anchorDate)
    const gridStart = addDays(firstDay, -firstDay.getDay())
    return Array.from({ length: 42 }, (_, idx) => addDays(gridStart, idx))
  }, [anchorDate])

  const weekDays = useMemo(() => {
    const start = addDays(selected, -selected.getDay())
    return Array.from({ length: 7 }, (_, idx) => addDays(start, idx))
  }, [selected])

  const handleNavigate = (direction: 'prev' | 'next') => {
    const factor = direction === 'prev' ? -1 : 1

    if (view === 'month') {
      setAnchorDate((prev) => addMonths(prev, factor))
      return
    }

    if (view === 'week') {
      onChange(addDays(selected, 7 * factor))
      return
    }

    onChange(addDays(selected, factor))
  }

  const handlePickDate = (date: Date) => {
    if (disabled?.(date)) return
    onChange(date)
    setAnchorDate(date)
  }

  const handleDragStart = (event: React.DragEvent<HTMLElement>, appointmentId: string) => {
    event.dataTransfer.setData('text/appointment-id', appointmentId)
    event.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (event: React.DragEvent<HTMLElement>, date: Date) => {
    event.preventDefault()
    const appointmentId = event.dataTransfer.getData('text/appointment-id')
    if (!appointmentId || !onMoveAppointment) return
    if (disabled?.(date)) return

    await onMoveAppointment(appointmentId, date)
    onChange(date)
    setAnchorDate(date)
  }

  const moreModalDateKey = moreDayModal ? toDateKey(moreDayModal) : null
  const moreModalAppointments = moreModalDateKey
    ? (appointmentsByDay.get(moreModalDateKey) ?? [])
    : []

  const selectedDayKey = toDateKey(selected)
  const dayViewAppointments = appointmentsByDay.get(selectedDayKey) ?? []

  return (
    <div className="rounded-md border bg-background">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePickDate(today)}
            aria-label="Ir para hoje"
          >
            Hoje
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigate('prev')}
            aria-label={
              view === 'month'
                ? 'Mês anterior'
                : view === 'week'
                  ? 'Semana anterior'
                  : 'Dia anterior'
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigate('next')}
            aria-label={
              view === 'month'
                ? 'Próximo mês'
                : view === 'week'
                  ? 'Próxima semana'
                  : 'Próximo dia'
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <p className="text-sm font-medium">{formatMonthTitle(anchorDate)}</p>
        </div>

        <div className="flex items-center overflow-hidden rounded-md border">
          {(['month', 'week', 'day'] as CalendarView[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              aria-label={`Visualização: ${VIEW_LABELS[item]}`}
              aria-pressed={view === item}
              className={cn(
                'px-3 py-1 text-sm transition-colors',
                view === item
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              {VIEW_LABELS[item]}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' && (
        <div>
          <div className="grid grid-cols-7 border-b">
            {DIAS_SEMANA_ABREV.map((day) => (
              <div key={day} className="px-3 py-2 text-center text-sm text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((date) => {
              const isCurrentMonth = date.getMonth() === anchorDate.getMonth()
              const isSelected = isSameDay(date, selected)
              const isToday = isSameDay(date, today)
              const isDisabled = !!disabled?.(date)
              const dayList = appointmentsByDay.get(toDateKey(date)) ?? []
              const hiddenCount = dayList.length > 2 ? dayList.length - 2 : 0

              const hasOverflow = dayList.length > 2

              return (
                <div
                  key={date.toISOString()}
                  role="button"
                  tabIndex={isDisabled ? -1 : 0}
                  title={
                    hasOverflow
                      ? `Clique na célula para ver os ${dayList.length} agendamentos`
                      : undefined
                  }
                  onClick={(event) => {
                    if (isDisabled) return
                    const target = event.target as HTMLElement
                    if (target.closest('[data-appointment-chip]')) return
                    if (hasOverflow) {
                      setMoreDayModal(date)
                      return
                    }
                    handlePickDate(date)
                  }}
                  onKeyDown={(event) => {
                    if (isDisabled) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      if (hasOverflow) setMoreDayModal(date)
                      else handlePickDate(date)
                    }
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => void handleDrop(event, date)}
                  className={cn(
                    'min-h-[9.25rem] border-r border-b px-1.5 pb-1.5 pt-1 text-right text-sm transition-colors sm:min-h-[9.75rem] sm:px-2 sm:pb-2',
                    !isCurrentMonth && 'text-muted-foreground/60',
                    isDisabled && 'cursor-not-allowed opacity-40',
                    hasOverflow && !isDisabled && 'cursor-pointer',
                    isSelected && 'bg-primary/10 font-semibold text-primary',
                    !isSelected && 'hover:bg-muted/60'
                  )}
                >
                  <div className="flex flex-col gap-1 text-left">
                    <span
                      className={cn(
                        'ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm',
                        isToday && 'bg-accent font-semibold'
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <div className="flex flex-col gap-1">
                      {dayList.slice(0, 2).map((appointment) => (
                        <button
                          key={appointment.id}
                          type="button"
                          data-appointment-chip
                          draggable={Boolean(onMoveAppointment)}
                          onDragStart={(event) => handleDragStart(event, appointment.id)}
                          className={cn(
                            'w-full shrink-0 truncate rounded bg-primary px-1.5 py-0.5 text-left text-[10px] leading-tight text-primary-foreground sm:text-[11px]',
                            onMoveAppointment && 'cursor-grab active:cursor-grabbing'
                          )}
                          onClick={(event) => {
                            event.stopPropagation()
                            handlePickDate(date)
                          }}
                          title={`${appointment.horario ?? ''} ${appointment.clienteNome ?? ''}`.trim()}
                        >
                          {appointment.horario ? `${appointment.horario} ` : ''}
                          {appointment.clienteNome ?? appointment.servicoNome ?? 'Agendamento'}
                        </button>
                      ))}
                      {hiddenCount > 0 && (
                        <div
                          className="flex w-full flex-col items-center justify-center rounded-md border border-primary/35 bg-primary/12 px-1.5 py-2 text-center shadow-sm ring-1 ring-primary/10 sm:py-2.5"
                          aria-hidden
                        >
                          <span className="text-sm font-bold tabular-nums leading-none text-primary">
                            +{hiddenCount}
                          </span>
                          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-primary/90">
                            mais
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div>
          <div className="grid grid-cols-7 border-b">
            {DIAS_SEMANA_ABREV.map((day) => (
              <div key={day} className="px-3 py-2 text-center text-sm text-muted-foreground">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {weekDays.map((date) => {
              const isSelected = isSameDay(date, selected)
              const isToday = isSameDay(date, today)
              const isDisabled = !!disabled?.(date)
              const dayList = appointmentsByDay.get(toDateKey(date)) ?? []
              const hiddenCount = dayList.length > 2 ? dayList.length - 2 : 0
              const hasOverflow = dayList.length > 2

              return (
                <div
                  key={date.toISOString()}
                  role="button"
                  tabIndex={isDisabled ? -1 : 0}
                  title={
                    hasOverflow
                      ? `Clique na célula para ver os ${dayList.length} agendamentos`
                      : undefined
                  }
                  onClick={(event) => {
                    if (isDisabled) return
                    const target = event.target as HTMLElement
                    if (target.closest('[data-appointment-chip]')) return
                    if (hasOverflow) {
                      setMoreDayModal(date)
                      return
                    }
                    handlePickDate(date)
                  }}
                  onKeyDown={(event) => {
                    if (isDisabled) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      if (hasOverflow) setMoreDayModal(date)
                      else handlePickDate(date)
                    }
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => void handleDrop(event, date)}
                  className={cn(
                    'min-h-[9rem] border-r px-1.5 py-1 text-center text-sm transition-colors last:border-r-0 sm:min-h-[9.5rem] sm:px-2',
                    isDisabled && 'cursor-not-allowed opacity-40',
                    hasOverflow && !isDisabled && 'cursor-pointer',
                    isSelected && 'bg-primary/10 font-semibold text-primary',
                    !isSelected && 'hover:bg-muted/60'
                  )}
                >
                  <div className="flex h-full flex-col gap-1">
                    <span
                      className={cn(
                        'mx-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm',
                        isToday && 'bg-accent font-semibold'
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <div className="flex flex-col gap-1 text-left">
                      {dayList.slice(0, 2).map((appointment) => (
                        <button
                          key={appointment.id}
                          type="button"
                          data-appointment-chip
                          draggable={Boolean(onMoveAppointment)}
                          onDragStart={(event) => handleDragStart(event, appointment.id)}
                          className={cn(
                            'w-full shrink-0 truncate rounded bg-primary px-1.5 py-0.5 text-left text-[10px] leading-tight text-primary-foreground sm:px-2 sm:py-1 sm:text-[11px]',
                            onMoveAppointment && 'cursor-grab active:cursor-grabbing'
                          )}
                          onClick={(event) => {
                            event.stopPropagation()
                            handlePickDate(date)
                          }}
                          title={`${appointment.horario ?? ''} ${appointment.clienteNome ?? ''}`.trim()}
                        >
                          {appointment.horario ? `${appointment.horario} ` : ''}
                          {appointment.clienteNome ?? appointment.servicoNome ?? 'Agendamento'}
                        </button>
                      ))}
                      {hiddenCount > 0 && (
                        <div
                          className="mt-auto flex w-full flex-col items-center justify-center rounded-md border border-primary/35 bg-primary/12 px-1.5 py-2 text-center shadow-sm ring-1 ring-primary/10 sm:py-2.5"
                          aria-hidden
                        >
                          <span className="text-sm font-bold tabular-nums leading-none text-primary">
                            +{hiddenCount}
                          </span>
                          <span className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-primary/90">
                            mais
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'day' && (
        <div className="border-t px-4 py-4 sm:px-6">
          <div className="mb-4 text-center">
            <p className="text-base font-semibold leading-snug">{formatDayTitlePt(selected)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {dayViewAppointments.length === 0
                ? 'Nenhum agendamento'
                : dayViewAppointments.length === 1
                  ? '1 agendamento'
                  : `${dayViewAppointments.length} agendamentos`}
            </p>
          </div>
          {dayViewAppointments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum agendamento neste dia.
            </p>
          ) : (
            <ul className="mx-auto max-w-xl list-none space-y-0 divide-y divide-border/60 rounded-lg border border-border/80 bg-muted/20">
              {dayViewAppointments.map((a) => (
                <li
                  key={a.id}
                  draggable={Boolean(onMoveAppointment)}
                  onDragStart={(e) => onMoveAppointment && handleDragStart(e, a.id)}
                  className={cn(
                    'px-3 py-3 sm:px-4',
                    onMoveAppointment && 'cursor-grab active:cursor-grabbing',
                  )}
                >
                  <div className="grid min-w-0 gap-2 sm:grid-cols-[4.5rem_1fr] sm:items-start sm:gap-3">
                    <div className="flex items-center gap-1.5 text-sm font-semibold tabular-nums sm:flex-col sm:items-start sm:gap-0 sm:pt-0.5">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:hidden" aria-hidden />
                      <span>{a.horario?.slice(0, 5) ?? '—'}</span>
                    </div>
                    <div className="flex min-w-0 flex-col gap-1.5 text-sm">
                      <div className="flex items-start gap-2">
                        <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="min-w-0 font-medium leading-snug">
                          {a.clienteNome ?? 'Cliente'}
                        </span>
                      </div>
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <Scissors className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                        <span className="min-w-0 leading-snug">
                          <span className="sr-only">Barbeiro: </span>
                          {a.barbeiroNome ?? 'Profissional'}
                        </span>
                      </div>
                      {a.servicoNome && (
                        <p className="pl-[1.375rem] text-xs leading-snug text-muted-foreground">
                          {a.servicoNome}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Dialog open={moreDayModal !== null} onOpenChange={(open) => !open && setMoreDayModal(null)}>
        <DialogContent
          className="flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
          showCloseButton
        >
          <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-14 text-left">
            <DialogTitle className="text-base leading-snug">
              {moreDayModal ? formatDayTitlePt(moreDayModal) : ''}
            </DialogTitle>
            <p className="text-sm font-normal text-muted-foreground">
              {moreModalAppointments.length === 1
                ? '1 agendamento'
                : `${moreModalAppointments.length} agendamentos`}
            </p>
          </DialogHeader>
          <ul className="min-h-0 flex-1 list-none overflow-y-auto overscroll-contain px-4 py-2">
            {moreModalAppointments.map((a) => (
              <li
                key={a.id}
                className="border-b border-border/60 py-3 last:border-b-0"
              >
                <div className="grid min-w-0 gap-2 sm:grid-cols-[4.5rem_1fr] sm:items-start sm:gap-3">
                  <div className="flex items-center gap-1.5 text-sm font-semibold tabular-nums sm:flex-col sm:items-start sm:gap-0 sm:pt-0.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground sm:hidden" aria-hidden />
                    <span>{a.horario?.slice(0, 5) ?? '—'}</span>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5 text-sm">
                    <div className="flex items-start gap-2">
                      <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="min-w-0 font-medium leading-snug">
                        {a.clienteNome ?? 'Cliente'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <Scissors className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                      <span className="min-w-0 leading-snug">
                        <span className="sr-only">Barbeiro: </span>
                        {a.barbeiroNome ?? 'Profissional'}
                      </span>
                    </div>
                    {a.servicoNome && (
                      <p className="pl-[1.375rem] text-xs leading-snug text-muted-foreground">
                        {a.servicoNome}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  )
}
