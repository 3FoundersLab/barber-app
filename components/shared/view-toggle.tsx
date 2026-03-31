'use client'

import { List, CalendarDays } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

export type ViewMode = 'list' | 'calendar'

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
      className={cn('', className)}
    >
      <ToggleGroupItem
        value="list"
        aria-label="Visualização em lista"
        className="px-3"
      >
        <List className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="calendar"
        aria-label="Visualização em calendário"
        className="px-3"
      >
        <CalendarDays className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
