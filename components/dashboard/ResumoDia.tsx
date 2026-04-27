'use client'

import { CircleDollarSign, Star, Ticket, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { DashboardResumoDia } from '@/types/admin-dashboard'

function ResumoLinha(props: {
  icon: typeof CircleDollarSign
  titulo: string
  valor: string
  iconWrap: string
}) {
  const I = props.icon
  return (
    <div className="flex gap-3">
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm',
          props.iconWrap,
        )}
      >
        <I className="size-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-muted-foreground text-xs font-medium">{props.titulo}</p>
        <p className="text-foreground text-base font-bold tabular-nums tracking-tight">{props.valor}</p>
      </div>
    </div>
  )
}

export function ResumoDia(props: {
  resumoDia: DashboardResumoDia | null
  isLoading: boolean
  error: string | null
}) {
  const { resumoDia, isLoading, error } = props

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Resumo do dia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        {isLoading || error ? (
          <div className="bg-muted h-40 animate-pulse rounded-md" />
        ) : !resumoDia ? (
          <p className="text-muted-foreground text-sm">Sem dados do dia.</p>
        ) : (
          <>
            <ResumoLinha
              icon={CircleDollarSign}
              titulo="Faturamento do dia"
              valor={formatCurrency(resumoDia.faturamentoDia)}
              iconWrap="bg-emerald-500/90"
            />
            <ResumoLinha
              icon={Ticket}
              titulo="Ticket médio"
              valor={formatCurrency(resumoDia.ticketMedio)}
              iconWrap="bg-violet-500/90"
            />
            <ResumoLinha
              icon={User}
              titulo="Novos clientes"
              valor={String(resumoDia.novosClientesDia)}
              iconWrap="bg-sky-500/90"
            />
            <div className="flex gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/90 text-white shadow-sm">
                <Star className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-muted-foreground text-xs font-medium">Avaliação média</p>
                {resumoDia.avaliacaoMedia != null ? (
                  <>
                    <p className="text-foreground text-base font-bold tabular-nums tracking-tight">
                      {resumoDia.avaliacaoMedia.toLocaleString('pt-BR', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </p>
                    <p className="text-muted-foreground text-[11px] leading-snug">
                      {resumoDia.avaliacaoEhEstimativa
                        ? `Estimativa com base em ${resumoDia.nAvaliacoesBase} atendimento(s) concluído(s) nos últimos 30 dias.`
                        : `Baseado em ${resumoDia.nAvaliacoesBase} avaliações.`}
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Ainda sem base suficiente para estimar (mín. 5 atendimentos em 30 dias).
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
