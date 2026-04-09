'use client'

import { Clock, User, Scissors, Check, X, UserX } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppointmentStatusBadge, PaymentStatusBadge } from '@/components/shared/status-badge'
import { formatCurrency, formatTime } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Agendamento } from '@/types'

interface AppointmentCardProps {
  appointment: Agendamento
  onComplete?: (id: string) => void
  onCancel?: (id: string) => void
  onNoShow?: (id: string) => void
  onMarkPaid?: (id: string) => void
  showActions?: boolean
  className?: string
}

export function AppointmentCard({
  appointment,
  onComplete,
  onCancel,
  onNoShow,
  onMarkPaid,
  showActions = true,
  className,
}: AppointmentCardProps) {
  const isPending = appointment.status === 'agendado'
  const canMarkPaid = appointment.status === 'concluido' && appointment.status_pagamento === 'pendente'
  const hasPendingActions = Boolean(onComplete || onCancel || onNoShow)

  return (
    <Card className={cn('flex h-full flex-col overflow-hidden', className)}>
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Time and Info */}
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold leading-none">
                {formatTime(appointment.horario).split(':')[0]}
              </span>
              <span className="text-xs leading-none">
                :{formatTime(appointment.horario).split(':')[1]}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {appointment.cliente?.nome || 'Cliente'}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Scissors className="h-3 w-3" />
                {appointment.servico?.nome || 'Serviço'}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {appointment.servico?.duracao || 30} min
              </div>
            </div>
          </div>

          {/* Status and Price */}
          <div className="flex flex-col items-end gap-1.5">
            <AppointmentStatusBadge status={appointment.status} />
            <PaymentStatusBadge status={appointment.status_pagamento} />
            <span className="text-sm font-semibold">
              {formatCurrency(appointment.valor)}
            </span>
          </div>
        </div>

        {/* Actions */}
        {showActions && isPending && hasPendingActions && (
          <div className="mt-3 flex gap-2">
            {onComplete && (
              <Button
                size="sm"
                variant="default"
                className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                onClick={() => onComplete(appointment.id)}
              >
                <Check className="mr-1.5 h-4 w-4" />
                Concluir
              </Button>
            )}
            {onNoShow && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
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
                className="flex-1"
                onClick={() => onCancel(appointment.id)}
              >
                <X className="mr-1.5 h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>
        )}

        {/* Mark as Paid */}
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
  )
}
