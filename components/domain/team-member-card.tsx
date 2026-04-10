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

function displayNome(barbeiro: Barbeiro) {
  const n = barbeiro.nome?.trim()
  if (n) return n
  const fromProfile = barbeiro.profile?.nome?.trim()
  if (fromProfile) return fromProfile
  const mail = barbeiro.email?.trim()
  if (mail) return mail.split('@')[0] || mail
  return 'Sem nome'
}

export function TeamMemberCard({ barbeiro, onEdit, onDelete, className }: TeamMemberCardProps) {
  const nome = displayNome(barbeiro)

  return (
    <Card
      className={cn(
        'relative flex min-w-0 gap-0 overflow-hidden py-0 transition-colors',
        /* Mobile (abaixo de md): lista em linha; na grade da página, 1 card por linha */
        'max-md:aspect-auto max-md:min-h-[4.75rem] max-md:flex-row max-md:items-center',
        /* Tablet (md–lg): coluna com altura automática — evita texto encavalado no quadrado */
        'md:max-lg:flex-col md:max-lg:aspect-auto',
        /* Desktop denso: cartão quadrado */
        'lg:aspect-square lg:flex-col',
        !barbeiro.ativo && 'opacity-60',
        className,
      )}
    >
      {(onEdit || onDelete) && (
        <div className="absolute right-1 top-1 z-10 max-md:top-1/2 max-md:-translate-y-1/2 md:top-2 md:translate-y-0 md:right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
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

      <CardContent
        className={cn(
          'flex w-full min-w-0 flex-1 flex-col',
          /* Mobile: linha */
          'max-md:flex-row max-md:items-center max-md:gap-3 max-md:p-3 max-md:pr-12 max-md:pt-3 max-md:text-left',
          /* Tablet */
          'md:max-lg:items-center md:max-lg:gap-3 md:max-lg:p-4 md:max-lg:px-4 md:max-lg:pb-5 md:max-lg:pt-12 md:max-lg:text-center',
          /* Desktop quadrado */
          'lg:h-full lg:min-h-0 lg:items-center lg:gap-2 lg:p-4 lg:pt-10 lg:text-center xl:gap-2 xl:p-4 xl:pt-10',
        )}
      >
        <Avatar
          className={cn(
            'h-11 w-11 shrink-0 border-2 border-border/60',
            'md:max-lg:h-16 md:max-lg:w-16',
            'lg:h-14 lg:w-14 xl:h-[4.5rem] xl:w-[4.5rem]',
          )}
        >
          <AvatarImage src={barbeiro.avatar} className="object-cover" />
          <AvatarFallback className="text-base md:text-lg lg:text-xl">
            {nome.charAt(0).toUpperCase()}
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
          <div
            className={cn(
              'flex w-full min-w-0 shrink-0 flex-col gap-1',
              'max-md:items-start',
              'md:max-lg:items-center',
              'lg:items-center',
            )}
          >
            <span
              className={cn(
                'w-full min-w-0 text-xs font-medium leading-snug text-foreground sm:text-sm',
                'max-md:line-clamp-2 max-md:text-left',
                'md:max-lg:line-clamp-3 md:max-lg:text-center',
                'lg:line-clamp-4 lg:text-center',
              )}
              title={nome}
            >
              {nome}
            </span>
            <div
              className={cn(
                'flex max-w-full flex-wrap gap-1',
                'max-md:justify-start',
                'md:max-lg:justify-center',
                'lg:justify-center',
              )}
            >
              <Badge
                variant="outline"
                className={cn(
                  'max-w-full truncate px-1.5 py-0 text-[10px] font-normal shadow-none sm:text-xs',
                  equipeFuncaoBadgeClass(barbeiro.funcao_equipe),
                )}
              >
                {labelEquipeFuncao(barbeiro.funcao_equipe)}
              </Badge>
              {!barbeiro.ativo && (
                <Badge
                  variant="outline"
                  className="max-w-full truncate border-border/70 bg-muted/45 px-1.5 py-0 text-[10px] font-normal text-muted-foreground shadow-none dark:bg-muted/25 sm:text-xs"
                >
                  Inativo
                </Badge>
              )}
            </div>
          </div>

          <div
            className={cn(
              'flex w-full min-w-0 shrink-0 flex-col space-y-0.5 text-[10px] text-muted-foreground sm:text-xs',
              'max-md:pt-0',
              'lg:mt-auto lg:pt-0.5',
            )}
          >
            {barbeiro.telefone ? (
              <span
                className={cn(
                  'flex min-w-0 items-center gap-1',
                  'max-md:justify-start',
                  'md:max-lg:justify-center',
                  'lg:justify-center',
                )}
              >
                <Phone className="h-3 w-3 shrink-0" />
                <span className="min-w-0 truncate">{barbeiro.telefone}</span>
              </span>
            ) : null}
            {barbeiro.email ? (
              <span
                className={cn(
                  'flex min-w-0 items-center gap-1',
                  'max-md:justify-start',
                  'md:max-lg:justify-center',
                  'lg:justify-center',
                )}
              >
                <Mail className="h-3 w-3 shrink-0" />
                <span className="min-w-0 truncate">{barbeiro.email}</span>
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
