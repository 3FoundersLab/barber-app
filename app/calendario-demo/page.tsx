'use client'

import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { AppointmentCard } from '@/components/domain/appointment-card'
import { AppointmentDayGridDemo } from '@/components/domain/appointment-day-grid-demo'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDateWeekdayLong } from '@/lib/constants'
import type { Agendamento } from '@/types'

export default function CalendarioBarbeariaDemoPage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [detail, setDetail] = useState<Agendamento | null>(null)

  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 1)
      return d
    })
  }

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 1)
      return d
    })
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Calendário de agendamento (demo)
            </h1>
            <p className="text-lg font-medium leading-snug text-foreground sm:text-xl">
              {formatDateWeekdayLong(selectedDate)}
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Grade por profissional · 09:00–18:00 · intervalos de 10 minutos · dados fictícios
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday} className="shrink-0">
              <Calendar className="mr-1.5 h-4 w-4" />
              Hoje
            </Button>
            <div className="flex rounded-lg border border-border bg-card shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none rounded-l-lg"
                onClick={handlePrevDay}
                aria-label="Dia anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none rounded-r-lg border-l"
                onClick={handleNextDay}
                aria-label="Próximo dia"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <AppointmentDayGridDemo
          selectedDate={selectedDate}
          onBlockClick={setDetail}
        />
      </div>

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-md sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>Detalhes do agendamento</DialogTitle>
          </DialogHeader>
          {detail && (
            <AppointmentCard appointment={detail} showActions={false} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
