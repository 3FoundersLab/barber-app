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
  return (
    <Card
      className={cn(
        'relative flex aspect-square flex-col overflow-hidden transition-colors',
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
      {showActions && (onEdit || onDelete) && (
        <div className="absolute right-1 top-1 z-10 sm:right-2 sm:top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="secondary" size="sm" className="h-8 w-8 shrink-0 p-0 shadow-sm">
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

      <CardContent className="flex h-full min-h-0 flex-col items-center gap-2 p-3 pt-9 text-center sm:gap-2.5 sm:p-4 sm:pt-10">
        <Avatar className="h-12 w-12 shrink-0 border-2 border-border/60 sm:h-14 sm:w-14 md:h-[4.5rem] md:w-[4.5rem]">
          <AvatarImage src={cliente.profile?.avatar} className="object-cover" />
          <AvatarFallback className="text-base sm:text-lg md:text-xl">
            {cliente.nome.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-1">
          <span
            className="line-clamp-4 w-full min-w-0 break-words text-xs font-medium leading-snug sm:text-sm sm:leading-snug"
            title={cliente.nome}
          >
            {cliente.nome}
          </span>
          <div className="mt-0.5 w-full space-y-0.5 text-[10px] text-muted-foreground sm:text-xs">
            {cliente.telefone ? (
              <span className="flex items-center justify-center gap-1">
                <Phone className="h-3 w-3 shrink-0" />
                <span className="truncate">{cliente.telefone}</span>
              </span>
            ) : null}
            {cliente.email ? (
              <span className="flex items-center justify-center gap-1">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{cliente.email}</span>
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
