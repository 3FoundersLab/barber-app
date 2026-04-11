'use client'

import { useCallback, useLayoutEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const EASE = { duration: 0.2, ease: 'easeInOut' } as const

function readExpandedFromStorage(key: string): boolean | null {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem(key)
    if (v === '0') return false
    if (v === '1') return true
  } catch {
    /* ignore */
  }
  return null
}

export interface ResumoComandaProps {
  subtotalServicos: number
  subtotalProdutos: number
  desconto: number
  taxaServico: number
  total: number
  /** Exibe “Salvando alterações…” sob o total. */
  isSaving?: boolean
  /** Texto opcional após salvar (ex.: auto-save). */
  autoSaveState?: 'idle' | 'saving' | 'saved'
  persistExpandedStorageKey?: string
  className?: string
}

export function ResumoComanda({
  subtotalServicos,
  subtotalProdutos,
  desconto,
  taxaServico,
  total,
  isSaving = false,
  autoSaveState = 'idle',
  persistExpandedStorageKey,
  className,
}: ResumoComandaProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  useLayoutEffect(() => {
    if (!persistExpandedStorageKey) return
    const stored = readExpandedFromStorage(persistExpandedStorageKey)
    if (stored !== null) setIsExpanded(stored)
  }, [persistExpandedStorageKey])

  const toggle = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev
      if (persistExpandedStorageKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(persistExpandedStorageKey, next ? '1' : '0')
        } catch {
          /* ignore */
        }
      }
      return next
    })
  }, [persistExpandedStorageKey])

  const tooltip = isExpanded ? 'Minimizar resumo' : 'Expandir resumo'
  const aria = isExpanded ? 'Minimizar detalhes dos valores' : 'Expandir detalhes dos valores'

  const showSavingLine = isSaving || autoSaveState === 'saving'
  const showSavedLine = autoSaveState === 'saved' && !showSavingLine

  return (
    <div
      className={cn(
        'relative rounded-xl border border-primary/30 bg-primary/5 text-sm shadow-sm',
        className,
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggle}
            className={cn(
              'absolute right-2 top-2 z-10 inline-flex touch-manipulation items-center justify-center rounded-lg md:right-3 md:top-3',
              'text-muted-foreground transition-colors',
              'hover:bg-background/60 hover:text-foreground active:bg-background/80',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-muted-foreground/30 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/5',
              'h-11 w-11 md:h-8 md:w-8',
            )}
            aria-expanded={isExpanded}
            aria-label={aria}
            title={tooltip}
          >
            <span className="relative flex h-5 w-5 items-center justify-center" aria-hidden>
              <AnimatePresence mode="wait" initial={false}>
                {isExpanded ? (
                  <motion.span
                    key="minus"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={EASE}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Minus className="h-5 w-5" strokeWidth={2} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="plus"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={EASE}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Plus className="h-5 w-5" strokeWidth={2} />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6} className="max-w-[220px]">
          {tooltip}
        </TooltipContent>
      </Tooltip>

      <AnimatePresence initial={false} mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={EASE}
            className="overflow-hidden"
          >
            <div className="space-y-2 p-4 pb-4 pt-3 pr-11 md:pr-10">
              <p className="text-xs font-medium text-muted-foreground">Resumo dos valores</p>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Subtotal serviços</span>
                <span className="tabular-nums">{formatCurrency(subtotalServicos)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Subtotal produtos</span>
                <span className="tabular-nums">{formatCurrency(subtotalProdutos)}</span>
              </div>
              <div className="flex justify-between gap-2 text-amber-700 dark:text-amber-400">
                <span>Desconto</span>
                <span className="tabular-nums">− {formatCurrency(desconto)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Taxa de serviço</span>
                <span className="tabular-nums">+ {formatCurrency(taxaServico)}</span>
              </div>
              <Separator />
              <div className="flex items-baseline justify-between gap-2 pt-0.5">
                <span className="text-base font-semibold">Total</span>
                <span className="text-2xl font-bold tabular-nums text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
              {showSavingLine ? (
                <p className="animate-pulse text-center text-[11px] font-medium text-muted-foreground">
                  Salvando alterações…
                </p>
              ) : null}
              {showSavedLine ? (
                <p className="text-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Alterações salvas
                </p>
              ) : null}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={EASE}
            className="space-y-2 p-3 pr-11 md:pr-10"
          >
            <p className="text-base font-semibold tabular-nums text-foreground">
              Total:{' '}
              <span className="text-primary">{formatCurrency(total)}</span>
            </p>
            {showSavingLine ? (
              <p className="animate-pulse text-center text-[11px] font-medium text-muted-foreground">
                Salvando alterações…
              </p>
            ) : null}
            {showSavedLine ? (
              <p className="text-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                Alterações salvas
              </p>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
