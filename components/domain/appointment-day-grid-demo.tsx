'use client'

import { useMemo } from 'react'
import { getAgendaDemoForDate } from '@/lib/agenda-demo-data'
import { AppointmentDayGrid } from '@/components/domain/appointment-day-grid'
import type { Agendamento } from '@/types'

/** Grade com dados de exemplo (Gabriel, Fernando, Pedro, Lucas). */
export function AppointmentDayGridDemo({
  selectedDate,
  className,
  onBlockClick,
}: {
  selectedDate: Date
  className?: string
  onBlockClick?: (agendamento: Agendamento) => void
}) {
  const key = useMemo(() => {
    const y = selectedDate.getFullYear()
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const d = String(selectedDate.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [selectedDate])

  const { barbeiros, agendamentos, unavailable } = useMemo(
    () => getAgendaDemoForDate(key),
    [key],
  )

  return (
    <AppointmentDayGrid
      className={className}
      barbeiros={barbeiros}
      appointments={agendamentos}
      referenceDate={selectedDate}
      unavailableBlocks={unavailable}
      onBlockClick={onBlockClick}
    />
  )
}
