'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CalendarView = 'month' | 'week' | 'day'

interface DateNavigatorCalendarProps {
  value?: Date
  onChange: (date: Date) => void
  disabled?: (date: Date) => boolean
  appointments?: Array<{
    id: string
    data: string
    horario?: string
    clienteNome?: string
    servicoNome?: string
  }>
  onMoveAppointment?: (appointmentId: string, nextDate: Date) => Promise<void> | void
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
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

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>, appointmentId: string) => {
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

  return (
    <div className="overflow-hidden rounded-md border bg-background">
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handlePickDate(today)}>
            today
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleNavigate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleNavigate('next')}>
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
              className={cn(
                'px-3 py-1 text-sm capitalize transition-colors',
                view === item
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' && (
        <div>
          <div className="grid grid-cols-7 border-b">
            {WEEKDAY_LABELS.map((day) => (
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

              return (
                <div
                  key={date.toISOString()}
                  role="button"
                  tabIndex={isDisabled ? -1 : 0}
                  onClick={() => {
                    if (!isDisabled) handlePickDate(date)
                  }}
                  onKeyDown={(event) => {
                    if (isDisabled) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handlePickDate(date)
                    }
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => void handleDrop(event, date)}
                  className={cn(
                    'h-24 border-r border-b px-2 py-1 text-right text-sm transition-colors',
                    !isCurrentMonth && 'text-muted-foreground/60',
                    isDisabled && 'cursor-not-allowed opacity-40',
                    isSelected && 'bg-primary/10 font-semibold text-primary',
                    !isSelected && 'hover:bg-muted/60'
                  )}
                >
                  <div className="flex h-full flex-col">
                    <span
                      className={cn(
                        'ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full',
                        isToday && 'bg-accent'
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <div className="mt-1 space-y-1 overflow-hidden text-left">
                      {(appointmentsByDay.get(toDateKey(date)) ?? []).slice(0, 2).map((appointment) => (
                        <button
                          key={appointment.id}
                          type="button"
                          draggable={Boolean(onMoveAppointment)}
                          onDragStart={(event) => handleDragStart(event, appointment.id)}
                          className={cn(
                            'w-full truncate rounded bg-primary px-1.5 py-0.5 text-left text-[10px] text-primary-foreground',
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
                      {(appointmentsByDay.get(toDateKey(date)) ?? []).length > 2 && (
                        <p className="truncate text-[10px] text-muted-foreground">
                          +{(appointmentsByDay.get(toDateKey(date)) ?? []).length - 2} mais
                        </p>
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
            {WEEKDAY_LABELS.map((day) => (
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

              return (
                <div
                  key={date.toISOString()}
                  role="button"
                  tabIndex={isDisabled ? -1 : 0}
                  onClick={() => {
                    if (!isDisabled) handlePickDate(date)
                  }}
                  onKeyDown={(event) => {
                    if (isDisabled) return
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      handlePickDate(date)
                    }
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => void handleDrop(event, date)}
                  className={cn(
                    'h-28 border-r px-2 py-1 text-center text-sm transition-colors last:border-r-0',
                    isDisabled && 'cursor-not-allowed opacity-40',
                    isSelected && 'bg-primary/10 font-semibold text-primary',
                    !isSelected && 'hover:bg-muted/60'
                  )}
                >
                  <div className="flex h-full flex-col">
                    <span
                      className={cn(
                        'mx-auto inline-flex h-8 w-8 items-center justify-center rounded-full',
                        isToday && 'bg-accent'
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <div className="mt-2 space-y-1 overflow-hidden text-left">
                      {(appointmentsByDay.get(toDateKey(date)) ?? []).slice(0, 3).map((appointment) => (
                        <button
                          key={appointment.id}
                          type="button"
                          draggable={Boolean(onMoveAppointment)}
                          onDragStart={(event) => handleDragStart(event, appointment.id)}
                          className={cn(
                            'w-full truncate rounded bg-primary px-2 py-1 text-left text-[11px] text-primary-foreground',
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
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {view === 'day' && (
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {selected.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      )}
    </div>
  )
}
