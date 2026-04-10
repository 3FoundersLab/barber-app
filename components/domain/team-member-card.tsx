'use client'

import { Mail, Pencil, Phone, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { labelEquipeFuncao } from '@/lib/equipe-funcao'
import type { Barbeiro } from '@/types'

const actionIconBtnClass =
  'h-10 w-10 shrink-0 rounded-xl text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/60 dark:hover:bg-background/60'

const trashBtnClass =
  'h-10 w-10 shrink-0 rounded-xl text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive hover:shadow-sm focus-visible:ring-2 focus-visible:ring-destructive/40 dark:hover:bg-destructive/15'

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
  const showMenu = Boolean(onEdit || onDelete)
  const showRemove = Boolean(onDelete)

  return (
    <Card
      className={cn(
        'relative flex min-w-0 flex-col gap-0 overflow-hidden py-0 shadow-sm transition-[box-shadow,background-color]',
        /* Com ações: altura livre para infos ficarem claramente fora da barra inferior */
        showMenu ? 'lg:aspect-auto' : 'lg:aspect-square',
        !barbeiro.ativo && 'opacity-60',
        className,
      )}
    >
      <CardContent
        className={cn(
          'flex min-h-0 flex-1 flex-col p-0',
          /* Faixa vazia do próprio card entre conteúdo e footer */
          showMenu && 'gap-5 max-md:gap-4',
        )}
      >
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            'max-md:flex-row max-md:items-center max-md:gap-3 max-md:p-3 max-md:pb-3',
            'md:max-lg:flex-col md:max-lg:items-center md:max-lg:gap-3 md:max-lg:p-4 md:max-lg:pb-4',
            'lg:flex lg:flex-1 lg:flex-col lg:items-center lg:justify-center lg:gap-2 lg:p-4 lg:pt-5 lg:pb-4',
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
            <AvatarImage src={barbeiro.avatar} className="object-cover" />
            <AvatarFallback className="text-base font-semibold md:text-lg lg:text-xl">
              {nome.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div
            className={cn(
              'flex min-h-0 w-full min-w-0 flex-col gap-2',
              'max-md:flex-1 max-md:justify-center max-md:gap-1.5 max-md:text-left',
              'md:max-lg:items-center md:max-lg:gap-2 md:max-lg:text-center',
              'lg:min-h-0 lg:flex-1 lg:justify-start lg:gap-2 lg:text-center',
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
                  'w-full min-w-0 text-xs font-semibold leading-snug tracking-tight text-foreground sm:text-sm',
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
                    'max-w-full truncate px-1.5 py-0 text-[10px] font-medium shadow-none sm:text-xs',
                    equipeFuncaoBadgeClass(barbeiro.funcao_equipe),
                  )}
                >
                  {labelEquipeFuncao(barbeiro.funcao_equipe)}
                </Badge>
                {!barbeiro.ativo && (
                  <Badge
                    variant="outline"
                    className="max-w-full truncate border-border/70 bg-muted/45 px-1.5 py-0 text-[10px] font-medium text-muted-foreground shadow-none dark:bg-muted/25 sm:text-xs"
                  >
                    Inativo
                  </Badge>
                )}
              </div>
            </div>

            <div
              className={cn(
                'flex w-full min-w-0 shrink-0 flex-col space-y-1 text-[10px] text-muted-foreground sm:text-xs',
                'lg:pt-0.5',
              )}
            >
              {barbeiro.telefone ? (
                <span
                  className={cn(
                    'flex min-w-0 items-center gap-1.5',
                    'max-md:justify-start',
                    'md:max-lg:justify-center',
                    'lg:justify-center',
                  )}
                >
                  <Phone className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="min-w-0 truncate">{barbeiro.telefone}</span>
                </span>
              ) : null}
              {barbeiro.email ? (
                <span
                  className={cn(
                    'flex min-w-0 items-center gap-1.5',
                    'max-md:justify-start',
                    'md:max-lg:justify-center',
                    'lg:justify-center',
                  )}
                >
                  <Mail className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="min-w-0 truncate">{barbeiro.email}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {showMenu ? (
          <div
            role="toolbar"
            aria-label={`Ações para ${nome}`}
            className="flex shrink-0 items-center justify-center gap-0.5 rounded-b-xl border-t border-border/70 bg-gradient-to-b from-muted/35 to-muted/20 px-2 py-3 dark:from-muted/25 dark:to-muted/10"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {onEdit ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={actionIconBtnClass}
                    aria-label={`Editar ${nome}`}
                    onClick={() => onEdit(barbeiro)}
                  >
                    <Pencil className="size-[1.125rem]" strokeWidth={2} aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  Editar membro
                </TooltipContent>
              </Tooltip>
            ) : null}

            {onEdit && showRemove ? (
              <div
                className="mx-1 h-6 w-px shrink-0 bg-border/80"
                aria-hidden
                role="separator"
              />
            ) : null}

            {showRemove ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={trashBtnClass}
                    aria-label={`Remover ${nome} da equipe`}
                    onClick={() => onDelete?.(barbeiro.id)}
                  >
                    <Trash2 className="size-[1.125rem]" strokeWidth={2} aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  Remover da equipe
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
