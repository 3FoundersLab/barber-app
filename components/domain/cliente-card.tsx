'use client'

import { History, Mail, Pencil, Phone, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Cliente } from '@/types'

const actionIconBtnClass =
  'h-10 w-10 shrink-0 rounded-xl text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/60 dark:hover:bg-background/60'

interface ClienteCardProps {
  cliente: Cliente
  onEdit?: (cliente: Cliente) => void
  onDelete?: (id: string) => void
  onHistorico?: (cliente: Cliente) => void
  onClick?: (cliente: Cliente) => void
  showActions?: boolean
  className?: string
}

export function ClienteCard({
  cliente,
  onEdit,
  onDelete,
  onHistorico,
  onClick,
  showActions = true,
  className,
}: ClienteCardProps) {
  const showMenu = showActions && Boolean(onEdit || onDelete || onHistorico)
  const showQuickActions = Boolean(onHistorico || onEdit)
  const showOverflowMenu = Boolean(onDelete)

  return (
    <Card
      className={cn(
        'relative flex min-w-0 flex-col gap-0 overflow-hidden py-0 shadow-sm transition-[box-shadow,background-color]',
        'xl:aspect-square',
        onClick && 'cursor-pointer hover:bg-muted/25 hover:shadow-md',
        className,
      )}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={() => onClick?.(cliente)}
      onKeyDown={(e) => {
        if (!onClick) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(cliente)
        }
      }}
    >
      <CardContent className="flex min-h-0 flex-1 flex-col gap-0 p-0">
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            'max-md:flex-row max-md:items-center max-md:gap-3 max-md:p-3 max-md:pb-3',
            'md:max-lg:flex-col md:max-lg:items-center md:max-lg:gap-3 md:max-lg:p-4 md:max-lg:pb-4',
            'lg:flex lg:flex-1 lg:flex-col lg:items-center lg:justify-center lg:gap-2 lg:p-4 lg:pt-5',
          )}
        >
          <Avatar
            className={cn(
              'shrink-0 border-2 border-border/50 shadow-sm',
              'h-11 w-11 max-md:shrink-0',
              'md:max-lg:h-16 md:max-lg:w-16',
              'lg:h-14 lg:w-14 xl:h-[4.5rem] xl:w-[4.5rem]',
            )}
          >
            <AvatarImage src={cliente.profile?.avatar} className="object-cover" />
            <AvatarFallback className="text-base font-semibold md:text-lg lg:text-xl">
              {cliente.nome.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div
            className={cn(
              'flex min-h-0 w-full min-w-0 flex-col gap-2',
              'max-md:flex-1 max-md:justify-center max-md:gap-1.5 max-md:text-left',
              'md:max-lg:items-center md:max-lg:gap-2 md:max-lg:text-center',
              'lg:min-h-0 lg:shrink-0 lg:justify-start lg:gap-2 lg:text-center',
            )}
          >
            <span
              className={cn(
                'w-full min-w-0 text-xs font-semibold leading-snug tracking-tight text-foreground sm:text-sm',
                'max-md:line-clamp-2 max-md:text-left',
                'md:max-lg:line-clamp-3 md:max-lg:text-center',
                'lg:line-clamp-4 lg:text-center',
              )}
              title={cliente.nome}
            >
              {cliente.nome}
            </span>

            <div
              className={cn(
                'w-full min-w-0 space-y-0.5 text-[10px] text-muted-foreground sm:text-xs',
                'lg:pt-0.5',
              )}
            >
              {cliente.telefone ? (
                <span
                  className={cn(
                    'flex min-w-0 items-center gap-1.5',
                    'max-md:justify-start',
                    'md:max-lg:justify-center',
                    'lg:justify-center',
                  )}
                >
                  <Phone className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="min-w-0 truncate">{cliente.telefone}</span>
                </span>
              ) : null}
              {cliente.email ? (
                <span
                  className={cn(
                    'flex min-w-0 items-center gap-1.5',
                    'max-md:justify-start',
                    'md:max-lg:justify-center',
                    'lg:justify-center',
                  )}
                >
                  <Mail className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="min-w-0 truncate">{cliente.email}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {showMenu ? (
          <div
            role="toolbar"
            aria-label={`Ações para ${cliente.nome}`}
            className="flex shrink-0 items-center justify-center gap-0.5 border-t border-border/70 bg-gradient-to-b from-muted/35 to-muted/20 px-2 py-2.5 dark:from-muted/25 dark:to-muted/10"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {onHistorico ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={actionIconBtnClass}
                    aria-label={`Ver histórico de agendamentos de ${cliente.nome}`}
                    onClick={() => onHistorico(cliente)}
                  >
                    <History className="size-[1.125rem]" strokeWidth={2} aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  Histórico de agendamentos
                </TooltipContent>
              </Tooltip>
            ) : null}

            {onEdit ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={actionIconBtnClass}
                    aria-label={`Editar ${cliente.nome}`}
                    onClick={() => onEdit(cliente)}
                  >
                    <Pencil className="size-[1.125rem]" strokeWidth={2} aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  Editar cadastro
                </TooltipContent>
              </Tooltip>
            ) : null}

            {showQuickActions && showOverflowMenu ? (
              <div
                className="mx-1 h-6 w-px shrink-0 bg-border/80"
                aria-hidden
                role="separator"
              />
            ) : null}

            {showOverflowMenu ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      actionIconBtnClass,
                      'text-muted-foreground hover:text-destructive dark:hover:text-destructive',
                    )}
                    aria-label={`Excluir ${cliente.nome}`}
                    onClick={() => onDelete!(cliente.id)}
                  >
                    <Trash2 className="size-[1.125rem]" strokeWidth={2} aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  Excluir cliente
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
