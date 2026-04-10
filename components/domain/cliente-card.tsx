'use client'

import { Phone, Mail, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Cliente } from '@/types'

interface ClienteCardProps {
  cliente: Cliente
  onEdit?: (cliente: Cliente) => void
  onDelete?: (id: string) => void
  onClick?: (cliente: Cliente) => void
  showActions?: boolean
  className?: string
}

export function ClienteCard({
  cliente,
  onEdit,
  onDelete,
  onClick,
  showActions = true,
  className,
}: ClienteCardProps) {
  const showMenu = showActions && Boolean(onEdit || onDelete)

  return (
    <Card
      className={cn(
        'relative flex min-w-0 gap-0 overflow-hidden py-0 transition-colors',
        'max-md:aspect-auto max-md:min-h-[4.75rem] max-md:flex-row max-md:items-center',
        'md:max-lg:flex-col md:max-lg:aspect-auto',
        'lg:aspect-square lg:flex-col',
        onClick && 'cursor-pointer hover:bg-accent/50',
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
      {showMenu && (
        <div className="absolute right-1 top-1 z-10 max-md:top-1/2 max-md:-translate-y-1/2 md:top-2 md:translate-y-0 md:right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 w-9 shrink-0 p-0 shadow-sm md:h-11 md:w-11 lg:h-8 lg:w-8"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(cliente)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(cliente.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <CardContent
        className={cn(
          'flex w-full min-w-0 flex-1 flex-col',
          'max-md:flex-row max-md:items-center max-md:gap-3 max-md:p-3 max-md:pt-3 max-md:text-left',
          showMenu && 'max-md:pr-12',
          'md:max-lg:items-center md:max-lg:gap-3 md:max-lg:p-4 md:max-lg:px-4 md:max-lg:pb-5 md:max-lg:text-center',
          showMenu ? 'md:max-lg:pt-12' : 'md:max-lg:pt-4',
          'lg:h-full lg:min-h-0 lg:items-center lg:gap-2 lg:p-4 lg:text-center',
          showMenu ? 'lg:pt-10 xl:pt-10' : 'lg:pt-4 xl:pt-4',
          'xl:gap-2 xl:p-4',
        )}
      >
        <Avatar
          className={cn(
            'h-11 w-11 shrink-0 border-2 border-border/60',
            'md:max-lg:h-16 md:max-lg:w-16',
            'lg:h-14 lg:w-14 xl:h-[4.5rem] xl:w-[4.5rem]',
          )}
        >
          <AvatarImage src={cliente.profile?.avatar} className="object-cover" />
          <AvatarFallback className="text-base md:text-lg lg:text-xl">
            {cliente.nome.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div
          className={cn(
            'flex min-h-0 w-full min-w-0 flex-col gap-2',
            'max-md:flex-1 max-md:justify-center max-md:gap-1.5',
            'md:max-lg:items-center md:max-lg:gap-2.5',
            'lg:min-h-0 lg:flex-1 lg:justify-between lg:gap-1',
          )}
        >
          <span
            className={cn(
              'w-full min-w-0 text-xs font-medium leading-snug text-foreground sm:text-sm',
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
              'lg:mt-auto lg:pt-0.5',
            )}
          >
            {cliente.telefone ? (
              <span
                className={cn(
                  'flex min-w-0 items-center gap-1',
                  'max-md:justify-start',
                  'md:max-lg:justify-center',
                  'lg:justify-center',
                )}
              >
                <Phone className="h-3 w-3 shrink-0" />
                <span className="min-w-0 truncate">{cliente.telefone}</span>
              </span>
            ) : null}
            {cliente.email ? (
              <span
                className={cn(
                  'flex min-w-0 items-center gap-1',
                  'max-md:justify-start',
                  'md:max-lg:justify-center',
                  'lg:justify-center',
                )}
              >
                <Mail className="h-3 w-3 shrink-0" />
                <span className="min-w-0 truncate">{cliente.email}</span>
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
