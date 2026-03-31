'use client'

import { Clock, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDuration } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Servico } from '@/types'

interface ServiceCardProps {
  service: Servico
  onEdit?: (service: Servico) => void
  onDelete?: (id: string) => void
  onClick?: (service: Servico) => void
  showActions?: boolean
  selected?: boolean
  className?: string
}

export function ServiceCard({
  service,
  onEdit,
  onDelete,
  onClick,
  showActions = true,
  selected = false,
  className,
}: ServiceCardProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden transition-colors',
        onClick && 'cursor-pointer hover:bg-accent/50',
        selected && 'border-primary bg-primary/5',
        !service.ativo && 'opacity-60',
        className
      )}
      onClick={() => onClick?.(service)}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{service.nome}</span>
            {!service.ativo && (
              <Badge variant="secondary" className="text-xs">
                Inativo
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDuration(service.duracao)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">
            {formatCurrency(service.preco)}
          </span>
          
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
                  <DropdownMenuItem onClick={() => onEdit(service)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(service.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
