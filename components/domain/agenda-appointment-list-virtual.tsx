'use client'

import type { ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

/** Acima deste tamanho, a lista usa virtualização vertical (performance). */
export const AGENDA_LIST_VIRTUAL_THRESHOLD = 100

const ESTIMATE_ROW_PX = 168

type AgendaAppointmentListVirtualProps<T> = {
  items: T[]
  className?: string
  children: (item: T, index: number) => ReactNode
}

/**
 * Lista virtualizada para muitos agendamentos (modo lista).
 * Mantém só ~uma viewport de linhas no DOM.
 */
export function AgendaAppointmentListVirtual<T>({
  items,
  className,
  children,
}: AgendaAppointmentListVirtualProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATE_ROW_PX,
    overscan: 8,
  })

  return (
    <div
      ref={parentRef}
      className={cn('max-h-[min(72vh,560px)] overflow-y-auto rounded-lg border border-border/80', className)}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((vi) => {
          const item = items[vi.index]
          return (
            <div
              key={vi.key}
              className="absolute left-0 top-0 w-full px-0 py-2"
              style={{
                height: `${vi.size}px`,
                transform: `translateY(${vi.start}px)`,
              }}
            >
              {children(item, vi.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
