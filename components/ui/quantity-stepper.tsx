'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface QuantityStepperProps {
  value: number
  max: number
  onChange: (val: number) => void
  /** Ao diminuir de 1 unidade (botão esquerdo com lixeira) ou equivalente. */
  onRemove: () => void
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

/**
 * Stepper − / valor / + para itens no “carrinho”.
 * Com quantidade 1, o botão esquerdo vira lixeira e chama `onRemove` em vez de `onChange(0)`.
 */
export function QuantityStepper({
  value,
  max,
  onChange,
  onRemove,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: QuantityStepperProps) {
  const atMax = value >= max
  const removeMode = value <= 1

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'flex items-center gap-1 rounded-lg border border-border/60 bg-muted/80 p-1 dark:bg-muted/50',
        className,
      )}
    >
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className={cn(
          'h-11 min-h-11 w-11 min-w-11 border border-border/70 bg-background shadow-sm hover:bg-muted/80 sm:h-10 sm:min-h-10 sm:w-10 sm:min-w-10',
          removeMode && 'text-destructive hover:bg-destructive/10 hover:text-destructive',
        )}
        disabled={disabled}
        aria-label={removeMode ? 'Remover item' : 'Diminuir quantidade'}
        onClick={() => (removeMode ? onRemove() : onChange(value - 1))}
      >
        {removeMode ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
      </Button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums">{value}</span>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="h-11 min-h-11 w-11 min-w-11 border border-border/70 bg-background shadow-sm hover:bg-muted/80 disabled:opacity-50 sm:h-10 sm:min-h-10 sm:w-10 sm:min-w-10"
        disabled={disabled || atMax}
        aria-label="Aumentar quantidade"
        onClick={() => {
          if (value < max) onChange(value + 1)
        }}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
