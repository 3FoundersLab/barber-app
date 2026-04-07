'use client'

import { cn } from '@/lib/utils'
import {
  PLANOS_PERIODICIDADE,
  type PlanoPeriodicidade,
} from '@/lib/plano-periodicidade'

type Props = {
  value: PlanoPeriodicidade
  onChange: (next: PlanoPeriodicidade) => void
  disabled?: boolean
  className?: string
  /** id prefix para acessibilidade */
  idPrefix?: string
  size?: 'default' | 'compact'
}

export function PlanoPeriodicidadeToggle({
  value,
  onChange,
  disabled,
  className,
  idPrefix = 'periodicidade',
  size = 'default',
}: Props) {
  return (
    <div
      role="group"
      aria-label="Período de cobrança"
      className={cn(
        'grid w-full grid-cols-2 gap-2 sm:grid-cols-4',
        size === 'compact' && 'gap-1.5',
        className,
      )}
    >
      {PLANOS_PERIODICIDADE.map((opt) => {
        const selected = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            id={`${idPrefix}-${opt.id}`}
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={cn(
              'rounded-lg border-2 text-center font-medium transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              size === 'default' ? 'px-2 py-2.5 text-xs sm:text-sm' : 'px-1.5 py-2 text-[11px] sm:text-xs',
              selected
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 shadow-sm dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-100'
                : 'border-border bg-card text-muted-foreground hover:border-emerald-500/35 hover:bg-muted/50',
              disabled && 'pointer-events-none opacity-50',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
