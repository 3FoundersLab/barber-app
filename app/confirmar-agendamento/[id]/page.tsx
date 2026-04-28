'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { CalendarCheck2, Check, Clock3, Scissors, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency, formatDate, formatTime } from '@/lib/constants'

type ConfirmacaoPayload = {
  id: string
  data: string
  horario: string
  status: string
  valor: number
  confirmado_cliente_em: string | null
  cliente: { nome: string; telefone?: string | null } | null
  barbeiro: { nome: string } | null
  servico: { nome: string; duracao?: number | null } | null
  barbearia: { nome: string } | null
}

export default function ConfirmarAgendamentoPage() {
  const params = useParams<{ id: string }>()
  const agendamentoId = params?.id
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [agendamento, setAgendamento] = useState<ConfirmacaoPayload | null>(null)

  useEffect(() => {
    if (!agendamentoId) {
      setError('Link inválido para confirmação.')
      setIsLoading(false)
      return
    }

    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError(null)
      const res = await fetch(`/api/agendamentos/confirmacao/${agendamentoId}`, { cache: 'no-store' })
      const body = await res.json().catch(() => ({}))
      if (cancelled) return
      if (!res.ok) {
        setError(body?.error ?? 'Não foi possível carregar este agendamento.')
        setAgendamento(null)
        setIsLoading(false)
        return
      }
      setAgendamento((body?.data ?? null) as ConfirmacaoPayload | null)
      setIsLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [agendamentoId])

  const canConfirm = useMemo(() => {
    if (!agendamento) return false
    if (agendamento.status !== 'agendado') return false
    if (agendamento.confirmado_cliente_em) return false
    return true
  }, [agendamento])

  const handleConfirmar = async () => {
    if (!agendamentoId || !canConfirm || isConfirming) return
    setIsConfirming(true)
    setError(null)
    setSuccess(null)
    const res = await fetch(`/api/agendamentos/confirmacao/${agendamentoId}`, { method: 'POST' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(body?.error ?? 'Não foi possível confirmar o agendamento.')
      setIsConfirming(false)
      return
    }
    setAgendamento((prev) => (prev ? { ...prev, confirmado_cliente_em: body?.confirmedAt ?? new Date().toISOString() } : prev))
    setSuccess('Agendamento confirmado com sucesso.')
    setIsConfirming(false)
  }

  const handleCancelar = async () => {
    if (!agendamentoId || !canConfirm || isCancelling) return
    setIsCancelling(true)
    setError(null)
    setSuccess(null)
    const res = await fetch(`/api/agendamentos/confirmacao/${agendamentoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(body?.error ?? 'Não foi possível cancelar o agendamento.')
      setIsCancelling(false)
      return
    }
    setAgendamento((prev) => (prev ? { ...prev, status: 'cancelado' } : prev))
    setSuccess('Agendamento cancelado com sucesso.')
    setIsCancelling(false)
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CalendarCheck2 className="size-5 text-primary" />
            Confirmação de agendamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-8" />
            </div>
          ) : null}

          {!isLoading && error ? (
            <Alert variant="danger">
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          ) : null}

          {!isLoading && !error && agendamento ? (
            <>
              <p className="text-sm text-muted-foreground">
                {agendamento.barbearia?.nome
                  ? `${agendamento.barbearia.nome} pediu para confirmar este horário.`
                  : 'Confirme seu horário abaixo.'}
              </p>

              <div className="space-y-2 rounded-lg border border-border/70 p-3 text-sm">
                <p className="flex items-center gap-2">
                  <UserRound className="size-4 text-muted-foreground" />
                  <span>{agendamento.cliente?.nome ?? 'Cliente'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Scissors className="size-4 text-muted-foreground" />
                  <span>{agendamento.servico?.nome ?? 'Serviço'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <CalendarCheck2 className="size-4 text-muted-foreground" />
                  <span>{formatDate(agendamento.data)}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock3 className="size-4 text-muted-foreground" />
                  <span>{formatTime(agendamento.horario)}</span>
                </p>
                <p className="pt-1 text-base font-semibold text-primary">
                  {formatCurrency(agendamento.valor)}
                </p>
              </div>

              {success ? (
                <Alert variant="success">
                  <AlertTitle>{success}</AlertTitle>
                </Alert>
              ) : null}

              {agendamento.confirmado_cliente_em ? (
                <Alert variant="info">
                  <AlertTitle>Este agendamento já foi confirmado.</AlertTitle>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="flex-1"
                  disabled={!canConfirm || isConfirming || isCancelling}
                  onClick={() => void handleConfirmar()}
                >
                  {isConfirming ? <Spinner className="mr-2" /> : null}
                  {!isConfirming ? <Check className="mr-2 size-4" /> : null}
                  Confirmar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                  disabled={!canConfirm || isConfirming || isCancelling}
                  onClick={() => void handleCancelar()}
                >
                  {isCancelling ? <Spinner className="mr-2" /> : null}
                  {!isCancelling ? <X className="mr-2 size-4" /> : null}
                  Cancelar
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
