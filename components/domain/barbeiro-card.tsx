'use client'

import { Phone, Mail, MoreVertical, Pencil, Trash2, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Barbeiro } from '@/types'

interface BarbeiroCardProps {
  barbeiro: Barbeiro
  onEdit?: (barbeiro: Barbeiro) => void
  onDelete?: (id: string) => void
  onClick?: (barbeiro: Barbeiro) => void
  showActions?: boolean
  selected?: boolean
  className?: string
}

export function BarbeiroCard({
  barbeiro,
  onEdit,
  onDelete,
  onClick,
  showActions = true,
  selected = false,
  className,
}: BarbeiroCardProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden transition-colors',
        onClick && 'cursor-pointer hover:bg-accent/50',
        selected && 'border-primary bg-primary/5',
        !barbeiro.ativo && 'opacity-60',
        className
      )}
      onClick={() => onClick?.(barbeiro)}
    >
      <CardContent className="flex items-center gap-3 p-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={barbeiro.avatar || barbeiro.profile?.avatar} />
          <AvatarFallback>
            {barbeiro.nome.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{barbeiro.nome}</p>
            {!barbeiro.ativo && (
              <Badge variant="secondary" className="text-xs">
                Inativo
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            {barbeiro.telefone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {barbeiro.telefone}
              </span>
            )}
            {barbeiro.email && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="h-3 w-3" />
                {barbeiro.email}
              </span>
            )}
          </div>
        </div>

        {selected && (
          <Check className="h-5 w-5 text-primary" />
        )}

        {showActions && !selected && (onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(barbeiro)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(barbeiro.id)}
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
