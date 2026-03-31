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
        'overflow-hidden transition-colors',
        onClick && 'cursor-pointer hover:bg-accent/50',
        className
      )}
      onClick={() => onClick?.(cliente)}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={cliente.profile?.avatar} />
          <AvatarFallback>
            {cliente.nome.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="font-medium truncate">{cliente.nome}</p>
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {cliente.telefone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {cliente.telefone}
              </span>
            )}
            {cliente.email && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="h-3 w-3" />
                {cliente.email}
              </span>
            )}
          </div>
        </div>

        {showActions && (onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
        )}
      </CardContent>
    </Card>
  )
}
