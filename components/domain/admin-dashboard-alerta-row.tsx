'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AlertaDashboard } from '@/types/admin-dashboard'

export function alertaTipoClasses(tipo: AlertaDashboard['tipo']) {
  switch (tipo) {
    case 'urgente':
      return 'border-l-red-500 bg-red-500/[0.06] dark:bg-red-500/10'
    case 'atencao':
      return 'border-l-amber-500 bg-amber-500/[0.07] dark:bg-amber-500/10'
    case 'oportunidade':
      return 'border-l-emerald-500 bg-emerald-500/[0.06] dark:bg-emerald-500/10'
    default:
      return 'border-l-sky-500 bg-sky-500/[0.06] dark:bg-sky-500/10'
  }
}

/** Botão de ação alinhado ao tom do tipo de alerta. */
export function alertaAcaoButtonClasses(tipo: AlertaDashboard['tipo']) {
  switch (tipo) {
    case 'urgente':
      return 'border-red-500/55 bg-red-500/15 text-red-950 hover:bg-red-500/25 dark:text-red-50 dark:hover:bg-red-500/25'
    case 'atencao':
      return 'border-amber-500/55 bg-amber-500/15 text-amber-950 hover:bg-amber-500/25 dark:text-amber-50 dark:hover:bg-amber-500/25'
    case 'oportunidade':
      return 'border-emerald-500/55 bg-emerald-500/15 text-emerald-950 hover:bg-emerald-500/25 dark:text-emerald-50 dark:hover:bg-emerald-500/25'
    default:
      return 'border-sky-500/55 bg-sky-500/15 text-sky-950 hover:bg-sky-500/25 dark:text-sky-50 dark:hover:bg-sky-500/25'
  }
}

export function DashboardAlertaIconWrap({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/80 shadow-sm',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function DashboardAlertaRow({
  alerta,
  onDismiss,
  lido,
}: {
  alerta: AlertaDashboard
  /** Na faixa do dashboard: fecha e marca como lida (continua no sheet, opaca). */
  onDismiss?: () => void
  /** No sheet: alerta já marcado como lido. */
  lido?: boolean
}) {
  const Icon = alerta.icone
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-border/60 border-l-4 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        alertaTipoClasses(alerta.tipo),
        alerta.className,
        lido && 'opacity-50 saturate-75',
      )}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <DashboardAlertaIconWrap>
          <Icon className="text-foreground h-4 w-4" aria-hidden />
        </DashboardAlertaIconWrap>
        <div className="min-w-0 flex-1">
          <p className="text-foreground text-sm font-semibold leading-snug">{alerta.titulo}</p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{alerta.descricao}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'shrink-0 gap-1 border-2 shadow-none',
            alerta.acaoButtonClassName ?? alertaAcaoButtonClasses(alerta.tipo),
          )}
          asChild
        >
          {alerta.linkTarget === '_blank' ? (
            <a href={alerta.link} target="_blank" rel="noopener noreferrer">
              {alerta.acao}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <Link href={alerta.link}>
              {alerta.acao}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </Button>
        {onDismiss ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-9 w-9 shrink-0 rounded-lg"
            aria-label="Marcar como lida e ocultar da lista do dashboard"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDismiss()
            }}
          >
            <X className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
