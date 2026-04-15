'use client'

import { History, Mail, Pencil, Phone, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { telefoneDigits, whatsappChatHref } from '@/lib/format-contato'
import type { Cliente } from '@/types'

function mensagemBoasVindasWhatsApp(clienteNome: string, nomeBarbearia?: string | null) {
  const primeiro = clienteNome.trim().split(/\s+/)[0] || clienteNome.trim()
  const unidade = nomeBarbearia?.trim()
  const trechoUnidade = unidade ? ` Somos da ${unidade}.` : ''
  return `Olá, ${primeiro}! Tudo bem?${trechoUnidade}\n\nPassando para dar boas-vindas e ficar à disposição. Quando precisar, é só chamar.`
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

const actionIconBtnClass =
  'h-10 w-10 shrink-0 rounded-xl text-muted-foreground transition-colors hover:bg-background hover:text-foreground hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring/60 dark:hover:bg-background/60'

interface ClienteCardProps {
  cliente: Cliente
  /** Nome da unidade (aparece na mensagem pré-preenchida do WhatsApp). */
  nomeBarbearia?: string | null
  onEdit?: (cliente: Cliente) => void
  onDelete?: (id: string) => void
  onHistorico?: (cliente: Cliente) => void
  onClick?: (cliente: Cliente) => void
  showActions?: boolean
  className?: string
}

export function ClienteCard({
  cliente,
  nomeBarbearia,
  onEdit,
  onDelete,
  onHistorico,
  onClick,
  showActions = true,
  className,
}: ClienteCardProps) {
  const hrefWhatsApp = whatsappChatHref(
    cliente.telefone,
    mensagemBoasVindasWhatsApp(cliente.nome, nomeBarbearia),
  )
  const hrefTelefone = (() => {
    const digits = telefoneDigits(cliente.telefone ?? '')
    return digits ? `tel:${digits}` : null
  })()
  const hasWhatsAppAction = Boolean(hrefWhatsApp)
  const showQuickActions = Boolean(onEdit || hasWhatsAppAction)
  const showOverflowMenu = Boolean(onDelete)
  const showMenu = showActions && Boolean(showQuickActions || showOverflowMenu)

  return (
    <Card
      className={cn(
        'relative flex min-w-0 flex-col gap-0 overflow-hidden py-0 shadow-sm transition-[box-shadow,background-color]',
        'xl:aspect-square',
        onClick && 'cursor-pointer hover:bg-muted/25 hover:shadow-md',
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
      <CardContent className="flex min-h-0 flex-1 flex-col gap-0 p-0">
        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            'max-md:flex-row max-md:items-center max-md:gap-3 max-md:p-3 max-md:pb-3',
            'md:max-lg:flex-col md:max-lg:items-center md:max-lg:gap-3 md:max-lg:p-4 md:max-lg:pb-4',
            'lg:flex lg:flex-1 lg:flex-col lg:items-center lg:justify-center lg:gap-2 lg:p-4 lg:pt-5',
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
            <AvatarImage src={cliente.profile?.avatar} className="object-cover" />
            <AvatarFallback className="text-base font-semibold md:text-lg lg:text-xl">
              {cliente.nome.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div
            className={cn(
              'flex min-h-0 w-full min-w-0 flex-col gap-2',
              'max-md:flex-1 max-md:justify-center max-md:gap-1.5 max-md:text-left',
              'md:max-lg:items-center md:max-lg:gap-2 md:max-lg:text-center',
              'lg:min-h-0 lg:shrink-0 lg:justify-start lg:gap-2 lg:text-center',
            )}
          >
            <span
              className={cn(
                'w-full min-w-0 text-xs font-semibold leading-snug tracking-tight text-foreground sm:text-sm',
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
                'lg:pt-0.5',
              )}
            >
              {cliente.telefone ? (
                <span
                  className={cn(
                    'flex min-w-0 items-center gap-1.5',
                    'max-md:justify-start',
                    'md:max-lg:justify-center',
                    'lg:justify-center',
                  )}
                >
                  <Phone className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  {hrefTelefone ? (
                    <a
                      href={hrefTelefone}
                      className="min-w-0 truncate hover:underline"
                      aria-label={`Ligar para ${cliente.nome}`}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {cliente.telefone}
                    </a>
                  ) : (
                    <span className="min-w-0 truncate">{cliente.telefone}</span>
                  )}
                </span>
              ) : null}
              {cliente.email ? (
                <span
                  className={cn(
                    'flex min-w-0 items-center gap-1.5',
                    'max-md:justify-start',
                    'md:max-lg:justify-center',
                    'lg:justify-center',
                  )}
                >
                  <Mail className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  <span className="min-w-0 truncate">{cliente.email}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {showMenu ? (
          <div
            role="toolbar"
            aria-label={`Ações para ${cliente.nome}`}
            className="flex shrink-0 items-center justify-center gap-0.5 border-t border-border/70 bg-gradient-to-b from-muted/35 to-muted/20 px-2 py-2.5 dark:from-muted/25 dark:to-muted/10"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {onHistorico ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={actionIconBtnClass}
                    aria-label={`Ver histórico de agendamentos de ${cliente.nome}`}
                    onClick={() => onHistorico(cliente)}
                  >
                    <History className="size-[1.125rem]" strokeWidth={2} aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  Histórico de agendamentos
                </TooltipContent>
              </Tooltip>
            ) : null}

            {onEdit ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={actionIconBtnClass}
                    aria-label={`Editar ${cliente.nome}`}
                    onClick={() => onEdit(cliente)}
                  >
                    <Pencil className="size-[1.125rem]" strokeWidth={2} aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  Editar cadastro
                </TooltipContent>
              </Tooltip>
            ) : null}

            {hrefWhatsApp ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={hrefWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      actionIconBtnClass,
                      'inline-flex items-center justify-center text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300',
                    )}
                    aria-label={`Conversar com ${cliente.nome} no WhatsApp`}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <WhatsAppGlyph className="size-[1.125rem]" />
                  </a>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  Abrir WhatsApp com mensagem de boas-vindas
                </TooltipContent>
              </Tooltip>
            ) : null}

            {showQuickActions && showOverflowMenu ? (
              <div
                className="mx-1 h-6 w-px shrink-0 bg-border/80"
                aria-hidden
                role="separator"
              />
            ) : null}

            {showOverflowMenu ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      actionIconBtnClass,
                      'text-muted-foreground hover:text-destructive dark:hover:text-destructive',
                    )}
                    aria-label={`Excluir ${cliente.nome}`}
                    onClick={() => onDelete!(cliente.id)}
                  >
                    <Trash2 className="size-[1.125rem]" strokeWidth={2} aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={6}>
                  Excluir cliente
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
