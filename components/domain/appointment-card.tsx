'use client'

import { useState } from 'react'
import { Clock, User, Scissors, Check, X, UserX, ClipboardCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AppointmentStatusBadge, PaymentStatusBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatTime } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Agendamento } from '@/types'

interface AppointmentCardProps {
  appointment: Agendamento
  /** Número da comanda após check-in (carregado separadamente). */
  comandaNumero?: number | null
  onCheckIn?: (id: string) => void | Promise<void>
  onComplete?: (id: string) => void
  onCancel?: (id: string, motivo?: string) => void
  onNoShow?: (id: string) => void
  onMarkPaid?: (id: string) => void
  showActions?: boolean
  className?: string
}

export function AppointmentCard({
  appointment,
  comandaNumero,
  onCheckIn,
  onComplete,
  onCancel,
  onNoShow,
  onMarkPaid,
  showActions = true,
  className,
}: AppointmentCardProps) {
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelMotivo, setCancelMotivo] = useState('')
  const [checkInBusy, setCheckInBusy] = useState(false)

  const isAgendado = appointment.status === 'agendado'
  const isEmAtendimento = appointment.status === 'em_atendimento'
  const isCancelado =
    appointment.status === 'cancelado' || appointment.status === 'faltou'
  const canMarkPaid =
    appointment.status === 'concluido' && appointment.status_pagamento === 'pendente'
  const hasFlowActions = Boolean(onComplete || onCancel || onNoShow)
  const showCheckIn = Boolean(onCheckIn && isAgendado)
  const showFlowRow = (isAgendado || isEmAtendimento) && hasFlowActions

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

  return (
    <>
      <Card
        className={cn(
          'flex h-full flex-col overflow-hidden',
          isCancelado &&
            'border-zinc-300/80 bg-zinc-100/85 opacity-[0.82] dark:border-zinc-600 dark:bg-zinc-900/40',
          isEmAtendimento &&
            'border-2 border-emerald-600/85 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/35 motion-safe:agenda-em-atendimento-pulse',
          className,
        )}
      >
        <CardContent className="flex flex-1 flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'flex h-12 w-12 flex-col items-center justify-center rounded-lg text-primary-foreground',
                  isCancelado && 'bg-zinc-400 text-zinc-950 dark:bg-zinc-600 dark:text-zinc-50',
                  !isCancelado && isEmAtendimento && 'bg-emerald-600 text-white dark:bg-emerald-600',
                  !isCancelado && !isEmAtendimento && 'bg-primary',
                )}
              >
                <span className="text-lg font-bold leading-none">
                  {formatTime(appointment.horario).split(':')[0]}
                </span>
                <span className="text-xs leading-none">
                  :{formatTime(appointment.horario).split(':')[1]}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <div
                    className={cn(
                      'flex items-center gap-1.5 text-sm font-medium',
                      isCancelado && 'text-muted-foreground line-through decoration-muted-foreground/80',
                    )}
                  >
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    {appointment.cliente?.nome || 'Cliente'}
                  </div>
                  {isEmAtendimento && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-600/25 dark:bg-emerald-500/20 dark:text-emerald-100 dark:ring-emerald-400/30">
                      <span
                        className="relative flex h-1.5 w-1.5 shrink-0"
                        aria-hidden
                      >
                        <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-emerald-500 opacity-60" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      </span>
                      Check-in
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1.5 text-xs text-muted-foreground',
                    isCancelado && 'line-through decoration-muted-foreground/70',
                  )}
                >
                  <Scissors className="h-3 w-3" />
                  {appointment.servico?.nome || 'Serviço'}
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1.5 text-xs text-muted-foreground',
                    isCancelado && 'line-through decoration-muted-foreground/70',
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {appointment.servico?.duracao || 30} min
                </div>
                {isEmAtendimento && comandaNumero != null && (
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                    Comanda nº {comandaNumero}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <AppointmentStatusBadge status={appointment.status} />
              <PaymentStatusBadge status={appointment.status_pagamento} />
              <span
                className={cn(
                  'text-sm font-semibold',
                  isCancelado && 'text-muted-foreground line-through decoration-muted-foreground/80',
                )}
              >
                {formatCurrency(appointment.valor)}
              </span>
            </div>
          </div>

          {showActions && showCheckIn && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="secondary"
                className="w-full border-emerald-400/70 bg-emerald-50 text-emerald-950 hover:bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-50 dark:hover:bg-emerald-900/55"
                disabled={checkInBusy}
                onClick={() => void handleCheckIn()}
              >
                <ClipboardCheck className="mr-1.5 h-4 w-4" />
                Check-in
              </Button>
            </div>
          )}

          {showActions && showFlowRow && (
            <div className="mt-3 flex flex-wrap gap-2">
              {onComplete && (
                <Button
                  size="sm"
                  variant="default"
                  className="min-w-0 flex-1 bg-success text-success-foreground hover:bg-success/90"
                  onClick={() => onComplete(appointment.id)}
                >
                  <Check className="mr-1.5 h-4 w-4" />
                  Concluir
                </Button>
              )}
              {onNoShow && isAgendado && (
                <Button
                  size="sm"
                  variant="outline"
                  className="min-w-0 flex-1"
                  onClick={() => onNoShow(appointment.id)}
                >
                  <UserX className="mr-1.5 h-4 w-4" />
                  Faltou
                </Button>
              )}
              {onCancel && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="min-w-0 flex-1"
                  onClick={() => setCancelOpen(true)}
                >
                  <X className="mr-1.5 h-4 w-4" />
                  Cancelar
                </Button>
              )}
            </div>
          )}

          {showActions && canMarkPaid && onMarkPaid && (
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => onMarkPaid(appointment.id)}
              >
                Marcar como pago
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
    </>
  )
}
