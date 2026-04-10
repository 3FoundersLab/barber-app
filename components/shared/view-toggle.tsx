'use client'

import { CalendarDays, LayoutGrid, List } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

/** `grade` = calendário diário por coluna de profissional; `calendar` = visão mensal. */
export type ViewMode = 'list' | 'grade' | 'calendar'

interface ViewToggleProps {
  value: ViewMode
  onChange: (value: ViewMode) => void
  className?: string
}

export function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ViewMode)}
      className={cn('w-full min-w-0 justify-end sm:w-fit', className)}
    >
      <ToggleGroupItem
        value="list"
        aria-label="Lista de agendamentos"
        title="Lista"
        className="gap-1.5 px-2 sm:px-3"
      >
        <List className="h-4 w-4 shrink-0" />
        <span className="hidden text-xs font-medium sm:inline">Lista</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="grade"
        aria-label="Calendário por profissional — grade do dia"
        title="Calendário (grade)"
        className="gap-1.5 px-2 sm:px-3"
      >
        <LayoutGrid className="h-4 w-4 shrink-0" />
        <span className="hidden max-w-[9rem] truncate text-xs font-medium sm:inline">
          Calendário
        </span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="calendar"
        aria-label="Calendário mensal"
        title="Mês"
        className="gap-1.5 px-2 sm:px-3"
      >
        <CalendarDays className="h-4 w-4 shrink-0" />
        <span className="hidden text-xs font-medium sm:inline">Mês</span>
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
