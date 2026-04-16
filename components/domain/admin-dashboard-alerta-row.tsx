'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, MoreVertical, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { AlertaDashboard } from '@/types/admin-dashboard'

export function alertaTipoClasses(tipo: AlertaDashboard['tipo']) {
  switch (tipo) {
    case 'urgente':
      return 'border-l-red-500 bg-red-500/[0.08] dark:bg-red-500/15'
    case 'atencao':
      return 'border-l-amber-500 bg-amber-500/[0.08] dark:bg-amber-500/15'
    case 'especial':
      return 'border-l-violet-500 bg-violet-500/[0.08] dark:bg-violet-500/15'
    case 'sucesso':
      return 'border-l-emerald-500 bg-emerald-500/[0.08] dark:bg-emerald-500/15'
    default:
      return 'border-l-sky-500 bg-sky-500/[0.08] dark:bg-sky-500/15'
  }
}

/** Botão de ação alinhado ao tom do tipo de alerta. */
export function alertaAcaoButtonClasses(tipo: AlertaDashboard['tipo']) {
  switch (tipo) {
    case 'urgente':
      return 'border-red-500 text-red-700 hover:bg-red-500/10 dark:text-red-300'
    case 'atencao':
      return 'border-amber-500 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300'
    case 'especial':
      return 'border-violet-500 text-violet-700 hover:bg-violet-500/10 dark:text-violet-300'
    case 'sucesso':
      return 'border-emerald-500 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300'
    default:
      return 'border-sky-500 text-sky-700 hover:bg-sky-500/10 dark:text-sky-300'
  }
}

function alertaIconClasses(tipo: AlertaDashboard['tipo']) {
  switch (tipo) {
    case 'urgente':
      return 'bg-red-500 text-white'
    case 'atencao':
      return 'bg-amber-500 text-white'
    case 'especial':
      return 'bg-violet-500 text-white'
    case 'sucesso':
      return 'bg-emerald-500 text-white'
    default:
      return 'bg-sky-500 text-white'
  }
}

function alertaBadgeClasses(tipo: AlertaDashboard['tipo']) {
  switch (tipo) {
    case 'urgente':
      return 'bg-red-500'
    case 'atencao':
      return 'bg-amber-500'
    case 'especial':
      return 'bg-violet-500'
    case 'sucesso':
      return 'bg-emerald-500'
    default:
      return 'bg-sky-500'
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
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
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
  lidoInfo,
  isMarkingAsRead,
  onMarkAsRead,
  onMarkAsUnread,
  onAction,
  onArchive,
  onUnarchive,
  onMuteType,
  arquivada,
}: {
  alerta: AlertaDashboard
  /** Na faixa do dashboard: fecha e marca como lida (continua no sheet, opaca). */
  onDismiss?: () => void
  /** No sheet: alerta já marcado como lido. */
  lido?: boolean
  /** Texto no estado lido. Ex.: "Lida • há 2 min". */
  lidoInfo?: string
  /** Estado de animação de marcação como lida. */
  isMarkingAsRead?: boolean
  /** Clique no card (fora do botão): marca como lida. */
  onMarkAsRead?: () => void
  /** No menu: desfaz estado de lida. */
  onMarkAsUnread?: () => void
  /** Clique no botão: executa ação e marca como lida. */
  onAction?: () => void
  /** Ações do menu de contexto do card. */
  onArchive?: () => void
  onUnarchive?: () => void
  onMuteType?: () => void
  arquivada?: boolean
}) {
  const Icon = alerta.icone
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div
      data-alerta-id={alerta.id}
      className={cn(
        'group relative flex cursor-default flex-col gap-2 overflow-hidden rounded-lg border border-border/60 border-l-4 p-3 transition-all duration-200 ease-out sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        lido
          ? 'border-l-[#E5E7EB] bg-white opacity-70 dark:bg-zinc-900/50'
          : [alertaTipoClasses(alerta.tipo), 'hover:brightness-[0.98]'],
        lido && 'sm:pb-7',
        isMarkingAsRead && 'translate-x-5 opacity-0',
        !lido && alerta.className,
      )}
    >
      {!lido ? <span className={cn('absolute right-2 top-2 h-2 w-2 rounded-full', alertaBadgeClasses(alerta.tipo))} /> : null}
      <div className="flex min-w-0 flex-1 gap-3">
        <DashboardAlertaIconWrap className={lido ? 'bg-gray-200 text-gray-400' : alertaIconClasses(alerta.tipo)}>
          <Icon className="h-4 w-4" aria-hidden />
        </DashboardAlertaIconWrap>
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm leading-snug', lido ? 'font-normal text-[#6B7280]' : 'text-foreground font-semibold')}>
            {alerta.titulo}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{alerta.descricao}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'shrink-0 gap-1 border-2 bg-transparent shadow-none',
            lido ? 'border-[#E5E7EB] text-[#9CA3AF] hover:bg-transparent' : alerta.acaoButtonClassName ?? alertaAcaoButtonClasses(alerta.tipo),
          )}
          asChild
        >
          {alerta.linkTarget === '_blank' ? (
            <a
              href={alerta.link}
              target="_blank"
              rel="noopener noreferrer"
              data-stop-card-click="true"
              onClick={(e) => {
                e.stopPropagation()
                onAction?.()
              }}
            >
              {alerta.acao}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <Link
              href={alerta.link}
              data-stop-card-click="true"
              onClick={(e) => {
                e.stopPropagation()
                onAction?.()
              }}
            >
              {alerta.acao}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </Button>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-stop-card-click="true"
              className={cn(
                'h-8 w-8 shrink-0 rounded-md opacity-100 transition-opacity',
              )}
              aria-label="Mais ações da notificação"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="relative size-4">
                <MoreVertical
                  className={cn(
                    'absolute inset-0 size-4 text-muted-foreground transition-all duration-200 ease-out',
                    menuOpen ? 'scale-75 rotate-45 opacity-0' : 'scale-100 rotate-0 opacity-100',
                  )}
                  aria-hidden
                />
                <X
                  className={cn(
                    'absolute inset-0 size-4 text-muted-foreground transition-all duration-200 ease-out',
                    menuOpen ? 'scale-100 rotate-0 opacity-100' : 'scale-75 -rotate-45 opacity-0',
                  )}
                  aria-hidden
                />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!arquivada ? (
              <>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    if (lido) {
                      onMarkAsUnread?.()
                    } else {
                      onMarkAsRead?.()
                    }
                  }}
                >
                  {lido ? 'Desmarcar como lida' : 'Marcar como lida'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onArchive?.()
                  }}
                >
                  Arquivar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onMuteType?.()
                  }}
                >
                  Não mostrar mais este tipo
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onUnarchive?.()
                }}
              >
                Restaurar para principais
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {onDismiss ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground h-9 w-9 shrink-0 rounded-lg"
            aria-label="Marcar como lida e ocultar da lista do dashboard"
            data-stop-card-click="true"
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
      {lido ? (
        <p className="text-xs text-[#6B7280] sm:absolute sm:bottom-2 sm:left-[3.75rem] sm:pr-24">{lidoInfo ?? 'Lida'}</p>
      ) : null}
    </div>
  )
}
