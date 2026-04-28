'use client'

import { memo, useState } from 'react'
import {
  Banknote,
  Check,
  ClipboardCheck,
  Clock,
  History,
  MessageCircle,
  Loader2,
  MoreHorizontal,
  Pencil,
  Scissors,
  UserCircle,
  UserX,
  X,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PAYMENT_STATUS_LABELS } from '@/lib/constants'
import { formatCurrency, formatDate, formatTime } from '@/lib/constants'
import { whatsappChatHref } from '@/lib/format-contato'
import { cn } from '@/lib/utils'
import type { Agendamento, AppointmentStatus } from '@/types'

function clienteInitials(nome: string | undefined): string {
  if (!nome?.trim()) return 'C'
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return nome.slice(0, 2).toUpperCase()
}

function statusAvatarRing(status: AppointmentStatus, isCancelado: boolean): string {
  if (isCancelado) return 'ring-2 ring-zinc-400 ring-offset-2 ring-offset-background dark:ring-zinc-500'
  switch (status) {
    case 'em_atendimento':
      return 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background dark:ring-emerald-400'
    case 'concluido':
      return 'ring-2 ring-emerald-600/50 ring-offset-2 ring-offset-background dark:ring-emerald-500/50'
    case 'cancelado':
    case 'faltou':
      return 'ring-2 ring-zinc-400 ring-offset-2 ring-offset-background'
    default:
      return 'ring-2 ring-primary/55 ring-offset-2 ring-offset-background'
  }
}

function parseHorarioMinutes(horario: string): number {
  const [h, m] = horario.slice(0, 5).split(':').map(Number)
  return h * 60 + (m || 0)
}

/** Minutos até o início do agendamento (negativo = já passou). */
function minutesUntilStart(dataYmd: string, horario: string): number {
  const [y, mo, d] = dataYmd.split('-').map(Number)
  const mins = parseHorarioMinutes(horario)
  const start = new Date(y, mo - 1, d, Math.floor(mins / 60), mins % 60, 0, 0)
  return (start.getTime() - Date.now()) / 60000
}

interface AppointmentCardProps {
  appointment: Agendamento
  confirmationHref?: string | null
  /** Número da comanda após check-in (carregado separadamente). */
  comandaNumero?: number | null
  onCheckIn?: (id: string) => void | Promise<void>
  onComplete?: (id: string) => void
  onCancel?: (id: string, motivo?: string) => void
  onNoShow?: (id: string) => void
  onMarkPaid?: (id: string) => void | Promise<void>
  onCardClick?: (id: string) => void
  onEdit?: (id: string) => void
  onViewHistory?: (id: string) => void
  /** Destaca como o próximo horário do dia (tag visual). */
  isNext?: boolean
  showActions?: boolean
  /** Painel lateral / sheet: menos sombra e contraste com o fundo do painel. */
  inSheet?: boolean
  /** Modo grade em lista: um pouco mais de espaço acima do bloco de serviço. */
  listLayout?: boolean
  className?: string
}

function AppointmentCardComponent({
  appointment,
  confirmationHref,
  comandaNumero,
  onCheckIn,
  onComplete,
  onCancel,
  onNoShow,
  onMarkPaid,
  onCardClick,
  onEdit,
  onViewHistory,
  isNext = false,
  showActions = true,
  inSheet = false,
  listLayout = false,
  className,
}: AppointmentCardProps) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelMotivo, setCancelMotivo] = useState('')
  const [noShowOpen, setNoShowOpen] = useState(false)
  const [checkInBusy, setCheckInBusy] = useState(false)
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [markPaidBusy, setMarkPaidBusy] = useState(false)

  const isAgendado = appointment.status === 'agendado'
  const isEmAtendimento = appointment.status === 'em_atendimento'
  const isCancelado =
    appointment.status === 'cancelado' || appointment.status === 'faltou'
  const canMarkPaid =
    appointment.status === 'concluido' && appointment.status_pagamento === 'pendente'
  const showCheckIn = Boolean(onCheckIn && isAgendado)
  const showCompleteButton =
    Boolean(onComplete) &&
    (isEmAtendimento || (isAgendado && !onCheckIn))
  const showNoShowButton = Boolean(onNoShow) && isAgendado
  const showCancelMenu = Boolean(onCancel)
  const primaryFooterAction =
    showCheckIn ? 'checkin' : showCompleteButton ? 'complete' : null

  const hasDropdownItems =
    Boolean(onEdit) || Boolean(onViewHistory) || showCancelMenu
  /** Menu ⋮ fica junto de “Marcar como pago”; não repetir no rodapé principal. */
  const showDropdownInPrimaryFooter =
    hasDropdownItems && !(canMarkPaid && onMarkPaid)
  /** Rodapé com ações principais (não inclui só ⋮ quando ele vai para “Marcar como pago”). */
  const showPrimaryFooterStrip =
    showActions &&
    (primaryFooterAction !== null ||
      showNoShowButton ||
      (hasDropdownItems && showDropdownInPrimaryFooter))

  const clienteNome = appointment.cliente?.nome || 'Cliente'
  const clienteAvatar = appointment.cliente?.profile?.avatar
  const timeStr = formatTime(appointment.horario)
  const paid = appointment.status_pagamento === 'pago'
  const barbeiroNome = appointment.barbeiro?.nome?.trim()
  const barbeiroLabel = barbeiroNome || 'Sem preferência'

  const untilMin = minutesUntilStart(appointment.data, appointment.horario)
  const showUrgencyBar =
    !isCancelado &&
    isAgendado &&
    untilMin > 0 &&
    untilMin <= 120 &&
    Number.isFinite(untilMin)

  const urgencyPercent = showUrgencyBar ? Math.min(100, Math.max(4, (untilMin / 120) * 100)) : 0
  const confirmationMessage = (() => {
    const nome = appointment.cliente?.nome?.trim() || 'cliente'
    const primeiroNome = nome.split(/\s+/)[0] || nome
    const data = formatDate(appointment.data)
    const hora = formatTime(appointment.horario)
    const link = confirmationHref?.trim()
    const linkTexto = link
      ? `\n\nConfirme seu horário aqui: ${link}`
      : ''
    return `Oi, ${primeiroNome}!\n\nSeu horario ta quase chegando! Temos agendamento marcado para *${data}* as *${hora}*.\n\nPode confirmar pra gente rapidinho?${linkTexto}\n\nValeu!`
  })()
  const confirmationWhatsAppHref = whatsappChatHref(
    appointment.cliente?.telefone,
    confirmationMessage,
  )

  const handleConfirmCancel = () => {
    const m = cancelMotivo.trim()
    onCancel?.(appointment.id, m || undefined)
    setCancelMotivo('')
    setCancelOpen(false)
  }

  const handleCheckIn = async () => {
    if (!onCheckIn || checkInBusy) return
    setCheckInBusy(true)
    try {
      await onCheckIn(appointment.id)
    } finally {
      setCheckInBusy(false)
    }
  }

  const handleConfirmMarkPaid = async () => {
    if (!onMarkPaid || markPaidBusy) return
    setMarkPaidBusy(true)
    try {
      await Promise.resolve(onMarkPaid(appointment.id))
      setMarkPaidOpen(false)
    } finally {
      setMarkPaidBusy(false)
    }
  }

  const handleCardClick = () => {
    if (!onCardClick || isCancelado) return
    onCardClick(appointment.id)
  }

  const stopActivate = (e: React.SyntheticEvent) => {
    e.stopPropagation()
  }

  const renderMoreOptionsDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="min-h-9 min-w-9 shrink-0"
          aria-label="Mais opções do agendamento"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {confirmationWhatsAppHref ? (
          <DropdownMenuItem asChild>
            <a href={confirmationWhatsAppHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="size-4" />
              Enviar confirmação
            </a>
          </DropdownMenuItem>
        ) : null}
        {onEdit ? (
          <DropdownMenuItem
            onSelect={() => {
              onEdit(appointment.id)
            }}
          >
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
        ) : null}
        {onViewHistory ? (
          <DropdownMenuItem
            onSelect={() => {
              onViewHistory(appointment.id)
            }}
          >
            <History className="size-4" />
            Ver histórico
          </DropdownMenuItem>
        ) : null}
        {showCancelMenu ? (
          <>
            {(confirmationWhatsAppHref || onEdit || onViewHistory) && <DropdownMenuSeparator />}
            <DropdownMenuItem variant="destructive" onSelect={() => setCancelOpen(true)}>
              <X className="size-4" />
              Cancelar
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <>
      <Card
        role={onCardClick && !isCancelado ? 'button' : undefined}
        tabIndex={onCardClick && !isCancelado ? 0 : undefined}
        onClick={onCardClick && !isCancelado ? handleCardClick : undefined}
        onKeyDown={
          onCardClick && !isCancelado
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCardClick()
                }
              }
            : undefined
        }
        className={cn(
          '@container/appt-card flex h-full flex-col gap-0 overflow-hidden rounded-2xl border border-border/80 py-0 shadow-none',
          !inSheet &&
            'shadow-[0_4px_20px_rgba(0,0,0,0.08)] motion-safe:transition-[transform,box-shadow] motion-safe:duration-500 motion-safe:ease-out motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_6px_24px_rgba(0,0,0,0.095)]',
          inSheet && 'shadow-none',
          inSheet &&
            !isCancelado &&
            !isEmAtendimento &&
            'ring-1 ring-border/60 border-border/70 bg-muted/25 dark:bg-muted/15 dark:ring-border/50',
          isCancelado &&
            'border-zinc-300/80 bg-zinc-100/85 opacity-[0.88] dark:border-zinc-600 dark:bg-zinc-900/40',
          isEmAtendimento &&
            'border-2 border-emerald-600/85 bg-emerald-50/40 dark:border-emerald-500 dark:bg-emerald-950/35 motion-safe:agenda-em-atendimento-pulse',
          onCardClick && !isCancelado && 'cursor-pointer',
          className,
        )}
      >
        {showUrgencyBar ? (
          <div
            className="h-1 w-full bg-muted/80 dark:bg-muted/50"
            title={`Em aproximadamente ${Math.round(untilMin)} min`}
          >
            <div
              className="h-full rounded-r-full bg-primary/70 transition-all duration-500 dark:bg-primary/60"
              style={{ width: `${urgencyPercent}%` }}
            />
          </div>
        ) : null}

        <CardContent
          className={cn(
            'flex flex-1 flex-col gap-0 p-0 pb-5',
            inSheet && 'pb-4 sm:pb-5',
          )}
        >
          {/* Header — colado ao topo do card (sem padding do Card base nem do content) */}
          <div
            className={cn(
              'relative w-full bg-gradient-to-br from-primary/[0.07] via-muted/50 to-transparent px-5 pb-4 pt-4 dark:from-primary/[0.12] dark:via-muted/30',
              inSheet && 'px-4 pt-3 sm:px-5 sm:pt-4',
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn('shrink-0 rounded-full', statusAvatarRing(appointment.status, isCancelado))}>
                <Avatar className="size-10">
                  {clienteAvatar ? (
                    <AvatarImage src={clienteAvatar} alt="" className="object-cover" />
                  ) : null}
                  <AvatarFallback
                    className={cn(
                      'text-sm font-semibold',
                      isCancelado ? 'bg-zinc-300 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100' : 'bg-primary/15 text-primary',
                    )}
                  >
                    {clienteInitials(appointment.cliente?.nome)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className={cn(
                      'truncate text-base font-semibold leading-tight tracking-tight',
                      isCancelado && 'text-muted-foreground line-through decoration-muted-foreground/80',
                    )}
                  >
                    {clienteNome}
                  </h3>
                  {isNext ? (
                    <span className="shrink-0 rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 ring-1 ring-amber-500/30 dark:bg-amber-500/20 dark:text-amber-100 dark:ring-amber-400/35">
                      Próximo
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-lg bg-zinc-900 px-2.5 py-1 text-sm font-semibold tabular-nums text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                    {timeStr}
                  </span>
                  {isEmAtendimento ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-600/25 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-400/30">
                      <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
                        <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-emerald-500 opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      </span>
                      Em atendimento
                    </span>
                  ) : null}
                </div>
              </div>

              <div
                className="flex shrink-0 flex-col items-end gap-1 text-right"
                onClick={stopActivate}
                onKeyDown={stopActivate}
              >
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-medium',
                    paid ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground',
                  )}
                >
                  <Banknote className="size-3.5 shrink-0 opacity-80" aria-hidden />
                  {PAYMENT_STATUS_LABELS[appointment.status_pagamento]}
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div
            className={cn(
              'mb-4 flex flex-1 flex-col gap-3 px-5',
              listLayout ? 'pt-2.5' : 'pt-1',
              inSheet && 'px-4 sm:px-5',
            )}
          >
            <div
              className={cn(
                'flex items-start gap-2 text-sm font-medium text-primary',
                isCancelado && 'text-muted-foreground line-through',
              )}
            >
              <Scissors className="mt-0.5 size-4 shrink-0 opacity-80" aria-hidden />
              <span>{appointment.servico?.nome || 'Serviço'}</span>
            </div>
            <div
              className={cn(
                'flex items-center gap-2 text-sm text-muted-foreground',
                isCancelado && 'line-through opacity-80',
              )}
            >
              <UserCircle className="size-4 shrink-0 opacity-70" aria-hidden />
              <span>
                <span className="sr-only">Profissional: </span>
                {barbeiroLabel}
              </span>
            </div>
            <div
              className={cn(
                'flex items-center gap-2 text-sm text-muted-foreground',
                isCancelado && 'line-through opacity-80',
              )}
            >
              <Clock className="size-4 shrink-0 opacity-70" aria-hidden />
              <span>{appointment.servico?.duracao ?? 30} min estimados</span>
            </div>
            {isEmAtendimento && comandaNumero != null ? (
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                Comanda nº {comandaNumero}
              </p>
            ) : null}
            <p
              className={cn(
                'text-lg font-semibold tabular-nums tracking-tight',
                paid && !isCancelado ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                isCancelado && 'text-muted-foreground line-through',
              )}
            >
              {formatCurrency(appointment.valor)}
            </p>
          </div>

          {/* Footer ações — primário + ⋮ na mesma linha; “Marcar como pago” idem */}
          {showPrimaryFooterStrip ? (
            <div
              className={cn(
                'mt-0 border-t border-border/60 px-5 pt-4 dark:border-border/50',
                inSheet && 'px-4 sm:px-5',
              )}
              onClick={stopActivate}
              onKeyDown={stopActivate}
            >
              <div
                className={cn(
                  'flex w-full min-w-0 flex-wrap items-stretch gap-2',
                  !primaryFooterAction &&
                    !showNoShowButton &&
                    hasDropdownItems &&
                    showDropdownInPrimaryFooter &&
                    'justify-end',
                )}
              >
                {primaryFooterAction === 'checkin' ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={checkInBusy}
                    onClick={() => void handleCheckIn()}
                    className="min-h-9 min-w-0 flex-1 basis-[7.5rem] bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    <ClipboardCheck className="mr-1.5 size-4 shrink-0" />
                    Check-in
                  </Button>
                ) : null}
                {primaryFooterAction === 'complete' ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onComplete!(appointment.id)}
                    className="min-h-9 min-w-0 flex-1 basis-[7.5rem] bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    <Check className="mr-1.5 size-4 shrink-0" />
                    Concluir
                  </Button>
                ) : null}
                {showNoShowButton ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setNoShowOpen(true)}
                    className="min-h-9 min-w-0 flex-1 basis-[6.5rem] border-red-300/80 bg-transparent text-red-700 hover:bg-red-50 dark:border-red-500/50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <UserX className="mr-1.5 size-4 shrink-0" />
                    Faltou
                  </Button>
                ) : null}
                {hasDropdownItems && showDropdownInPrimaryFooter ? renderMoreOptionsDropdown() : null}
              </div>
            </div>
          ) : null}

          {showActions && canMarkPaid && onMarkPaid ? (
            <div
              className={cn(
                'mt-0 border-t border-border/60 px-5 pt-4 dark:border-border/50',
                inSheet && 'px-4 sm:px-5',
              )}
              onClick={stopActivate}
              onKeyDown={stopActivate}
            >
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Pagamento pendente
              </p>
              <div className="flex w-full min-w-0 items-stretch gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="min-h-9 min-w-0 flex-1 border-amber-500/45 bg-amber-50 text-amber-950 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/45 dark:text-amber-50 dark:hover:bg-amber-900/55"
                  onClick={() => setMarkPaidOpen(true)}
                >
                  <Banknote className="mr-1.5 size-4 shrink-0" />
                  Marcar como pago
                </Button>
                {hasDropdownItems ? renderMoreOptionsDropdown() : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={markPaidOpen}
        onOpenChange={(open) => {
          if (!open && markPaidBusy) return
          setMarkPaidOpen(open)
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          showCloseButton={!markPaidBusy}
          onPointerDownOutside={(e) => markPaidBusy && e.preventDefault()}
          onEscapeKeyDown={(e) => markPaidBusy && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Confirmar pagamento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Registrar{' '}
            <span className="font-semibold text-foreground">
              {formatCurrency(appointment.valor)}
            </span>{' '}
            como pago
            {appointment.cliente?.nome ? (
              <>
                {' '}
                para{' '}
                <span className="font-medium text-foreground">
                  {appointment.cliente.nome}
                </span>
              </>
            ) : null}
            ?
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={markPaidBusy}
              onClick={() => setMarkPaidOpen(false)}
            >
              Voltar
            </Button>
            <Button
              type="button"
              className="bg-success text-success-foreground hover:bg-success/90"
              disabled={markPaidBusy}
              onClick={() => void handleConfirmMarkPaid()}
            >
              {markPaidBusy ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : null}
              Sim, registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelOpen}
        onOpenChange={(open) => {
          setCancelOpen(open)
          if (!open) setCancelMotivo('')
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Cancelar agendamento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja realmente cancelar este agendamento?
          </p>
          <div className="space-y-2">
            <Label htmlFor={`cancel-motivo-${appointment.id}`} className="text-xs">
              Motivo do cancelamento (opcional)
            </Label>
            <Textarea
              id={`cancel-motivo-${appointment.id}`}
              value={cancelMotivo}
              onChange={(e) => setCancelMotivo(e.target.value)}
              placeholder="Ex.: cliente desistiu, imprevisto…"
              rows={3}
              className="resize-none text-sm"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              Não, voltar
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmCancel}>
              Sim, cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noShowOpen} onOpenChange={setNoShowOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Marcar falta</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Confirmar que <span className="font-medium text-foreground">{clienteNome}</span> não compareceu
            ao horário {timeStr}? O agendamento será marcado como falta.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setNoShowOpen(false)}>
              Voltar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onNoShow?.(appointment.id)
                setNoShowOpen(false)
              }}
            >
              Sim, marcar falta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function appointmentCardPropsAreEqual(
  prev: AppointmentCardProps,
  next: AppointmentCardProps,
): boolean {
  const a = prev.appointment
  const b = next.appointment
  return (
    a.id === b.id &&
    a.status === b.status &&
    a.status_pagamento === b.status_pagamento &&
    a.horario === b.horario &&
    a.data === b.data &&
    (a.servico?.nome ?? '') === (b.servico?.nome ?? '') &&
    (a.cliente?.nome ?? '') === (b.cliente?.nome ?? '') &&
    (a.barbeiro?.nome ?? '') === (b.barbeiro?.nome ?? '') &&
    prev.comandaNumero === next.comandaNumero &&
    prev.confirmationHref === next.confirmationHref &&
    prev.isNext === next.isNext &&
    prev.listLayout === next.listLayout &&
    prev.inSheet === next.inSheet &&
    prev.showActions === next.showActions
  )
}

export const AppointmentCard = memo(AppointmentCardComponent, appointmentCardPropsAreEqual)
