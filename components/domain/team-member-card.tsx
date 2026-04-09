'use client'

import { Phone, Mail, MoreVertical, Pencil, Trash2 } from 'lucide-react'
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

interface TeamMemberCardProps {
  barbeiro: Barbeiro
  onEdit?: (barbeiro: Barbeiro) => void
  onDelete?: (id: string) => void
  className?: string
}

export function TeamMemberCard({ barbeiro, onEdit, onDelete, className }: TeamMemberCardProps) {
  return (
    <Card
      className={cn(
        'flex h-full flex-col overflow-hidden transition-colors',
        !barbeiro.ativo && 'opacity-60',
        className,
      )}
    >
      <CardContent className="flex flex-1 items-center gap-3 p-4">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarImage src={barbeiro.avatar} />
          <AvatarFallback>{barbeiro.nome.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{barbeiro.nome}</span>
            {!barbeiro.ativo && (
              <Badge variant="secondary" className="text-xs">
                Inativo
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
            {barbeiro.telefone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3 shrink-0" />
                <span className="truncate">{barbeiro.telefone}</span>
              </span>
            )}
            {barbeiro.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{barbeiro.email}</span>
              </span>
            )}
          </div>
        </div>
        {(onEdit || onDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
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
