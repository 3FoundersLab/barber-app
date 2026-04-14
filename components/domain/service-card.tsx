'use client'

import { Clock, Copy, MoreVertical, Pencil, Power, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { pickServicoAgendaIcon } from '@/lib/agenda-service-icons'
import { formatCurrency, formatDuration } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Servico } from '@/types'

interface ServiceCardProps {
  service: Servico
  onEdit?: (service: Servico) => void
  onDelete?: (id: string) => void
  onDuplicate?: (service: Servico) => void
  onToggleStatus?: (service: Servico) => void
  onClick?: (service: Servico) => void
  showActions?: boolean
  selected?: boolean
  className?: string
}

export function ServiceCard({
  service,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  onClick,
  showActions = true,
  selected = false,
  className,
}: ServiceCardProps) {
  const Icon = pickServicoAgendaIcon(service.nome)

  return (
    <Card
      className={cn(
        'flex h-full flex-col overflow-hidden border transition-all duration-200',
        'hover:scale-[1.02] hover:shadow-lg hover:border-[#E05A2A]/40',
        onClick && 'cursor-pointer',
        selected && 'border-primary bg-primary/5',
        !service.ativo && 'opacity-60',
        className,
      )}
      onClick={() => onClick?.(service)}
    >
      <CardContent className="flex flex-1 items-start gap-3 p-4">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E05A2A]/10 text-[#E05A2A]">
          <Icon className="h-5 w-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{service.nome}</span>
            <Badge
              variant={service.ativo ? 'default' : 'secondary'}
              className={cn(service.ativo && 'bg-emerald-600 hover:bg-emerald-600')}
            >
              {service.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          {service.descricao ? (
            <p className="text-sm leading-snug text-muted-foreground line-clamp-2">
              {service.descricao}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {formatDuration(service.duracao)}
            </span>
            <span className="text-base font-bold tabular-nums text-[#E05A2A]">{formatCurrency(service.preco)}</span>
          </div>
        </div>

        <div className="ml-auto">
          {showActions && (onEdit || onDelete || onDuplicate || onToggleStatus) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
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
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(service)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicar
                  </DropdownMenuItem>
                )}
                {onToggleStatus && (
                  <DropdownMenuItem onClick={() => onToggleStatus(service)}>
                    <Power className="mr-2 h-4 w-4" />
                    {service.ativo ? 'Desativar' : 'Ativar'}
                  </DropdownMenuItem>
                )}
                {(onDuplicate || onToggleStatus) && onDelete ? <DropdownMenuSeparator /> : null}
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
