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
import { labelEquipeFuncao } from '@/lib/equipe-funcao'
import type { Barbeiro } from '@/types'

interface TeamMemberCardProps {
  barbeiro: Barbeiro
  onEdit?: (barbeiro: Barbeiro) => void
  onDelete?: (id: string) => void
  className?: string
}

function equipeFuncaoBadgeClass(funcao: Barbeiro['funcao_equipe']) {
  if (funcao === 'moderador') {
    return 'border-violet-200/80 bg-violet-50 text-violet-800 dark:border-violet-800/50 dark:bg-violet-950/40 dark:text-violet-200'
  }
  if (funcao === 'barbeiro_lider') {
    return 'border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200'
  }
  return 'border-sky-200/80 bg-sky-50 text-sky-900 dark:border-sky-800/50 dark:bg-sky-950/40 dark:text-sky-200'
}

export function TeamMemberCard({ barbeiro, onEdit, onDelete, className }: TeamMemberCardProps) {
  return (
    <Card
      className={cn(
        'relative flex aspect-square flex-col overflow-hidden transition-colors',
        !barbeiro.ativo && 'opacity-60',
        className,
      )}
    >
      {(onEdit || onDelete) && (
        <div className="absolute right-1 top-1 z-10 sm:right-2 sm:top-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="h-8 w-8 shrink-0 p-0 shadow-sm">
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
        </div>
      )}

      <CardContent className="flex h-full min-h-0 flex-col items-center justify-center gap-2 p-3 pt-9 text-center sm:gap-2.5 sm:p-4 sm:pt-10">
        <Avatar className="h-14 w-14 shrink-0 border-2 border-border/60 sm:h-[4.5rem] sm:w-[4.5rem]">
          <AvatarImage src={barbeiro.avatar} className="object-cover" />
          <AvatarFallback className="text-lg sm:text-xl">
            {barbeiro.nome.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-h-0 w-full flex-col items-center gap-1.5">
          <span className="line-clamp-2 w-full text-xs font-medium leading-tight sm:text-sm">
            {barbeiro.nome}
          </span>
          <div className="flex flex-wrap justify-center gap-1">
            <Badge
              variant="outline"
              className={cn(
                'px-1.5 py-0 text-[10px] font-normal shadow-none sm:text-xs',
                equipeFuncaoBadgeClass(barbeiro.funcao_equipe),
              )}
            >
              {labelEquipeFuncao(barbeiro.funcao_equipe)}
            </Badge>
            {!barbeiro.ativo && (
              <Badge
                variant="outline"
                className="border-border/70 bg-muted/45 px-1.5 py-0 text-[10px] font-normal text-muted-foreground shadow-none dark:bg-muted/25 sm:text-xs"
              >
                Inativo
              </Badge>
            )}
          </div>
          <div className="mt-0.5 w-full space-y-0.5 text-[10px] text-muted-foreground sm:text-xs">
            {barbeiro.telefone ? (
              <span className="flex items-center justify-center gap-1">
                <Phone className="h-3 w-3 shrink-0" />
                <span className="truncate">{barbeiro.telefone}</span>
              </span>
            ) : null}
            {barbeiro.email ? (
              <span className="flex items-center justify-center gap-1">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{barbeiro.email}</span>
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
