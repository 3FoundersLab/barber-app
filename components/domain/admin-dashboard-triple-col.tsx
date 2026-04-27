'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CircleDollarSign,
  Clock,
  Star,
  Ticket,
  TrendingUp,
  User,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { DashboardInsightsDia, DashboardResumoDia } from '@/types/admin-dashboard'

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

export function AdminDashboardTripleCol(props: {
  base: string
  estoqueCritico: { nome: string; quantidade: number; minimo: number }[]
  resumoDia: DashboardResumoDia | null
  insightsDia: DashboardInsightsDia | null
  isLoading: boolean
  error: string | null
  operacaoLiberada: boolean
}) {
  const { base, estoqueCritico, resumoDia, insightsDia, isLoading, error, operacaoLiberada } = props
  const nCrit = estoqueCritico.length

  const fatPct = insightsDia?.fatPctVsOntem
  const vagos = insightsDia?.vagosEstimados
  const diaMov = insightsDia?.diaMaisMovimentado

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="border-border/80 overflow-hidden">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
          <CardTitle className="text-base font-semibold">Estoque crítico</CardTitle>
          {nCrit > 0 ? (
            <Badge
              variant="secondary"
              className="border border-red-200 bg-red-50 font-semibold text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200"
            >
              {nCrit} {nCrit === 1 ? 'produto' : 'produtos'}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground font-medium">
              OK
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {error || isLoading ? (
            <div className="bg-muted h-32 animate-pulse rounded-md" />
          ) : !operacaoLiberada ? (
            <p className="text-muted-foreground text-sm">
              Disponível após a ativação do plano. Acompanhe produtos abaixo do mínimo e evite ruptura.
            </p>
          ) : nCrit === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum item abaixo do mínimo no momento.</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full min-w-[240px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-3 py-2">Produto</th>
                      <th className="px-3 py-2 text-right">Estoque</th>
                      <th className="px-3 py-2 text-right">Mín.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estoqueCritico.map((p) => (
                      <tr key={p.nome} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-2 font-medium text-red-700 dark:text-red-400">{p.nome}</td>
                        <td className="text-destructive px-3 py-2 text-right font-semibold tabular-nums">
                          {p.quantidade}
                        </td>
                        <td className="text-muted-foreground px-3 py-2 text-right tabular-nums">{p.minimo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button
                asChild
                className="w-full border-red-200 bg-red-50 font-semibold text-red-800 shadow-sm hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100 dark:hover:bg-red-950/70"
                variant="outline"
              >
                <Link href={`${base}/estoque`} className="inline-flex items-center justify-center gap-2">
                  <AlertTriangle className="size-4 shrink-0" aria-hidden />
                  Ver estoque completo
                  <ArrowRight className="size-4 shrink-0" aria-hidden />
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

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
                        {resumoDia.avaliacaoMedia.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </p>
                      <p className="text-muted-foreground text-[11px] leading-snug">
                        {resumoDia.avaliacaoEhEstimativa
                          ? `Estimativa com base em ${resumoDia.nAvaliacoesBase} atendimento(s) concluído(s) nos últimos 30 dias.`
                          : `Baseado em ${resumoDia.nAvaliacoesBase} avaliações.`}
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">Ainda sem base suficiente para estimar (mín. 5 atendimentos em 30 dias).</p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Insights do dia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          {isLoading || error ? (
            <div className="bg-muted h-40 animate-pulse rounded-md" />
          ) : !insightsDia ? (
            <p className="text-muted-foreground text-sm">Sem insights no momento.</p>
          ) : (
            <>
              {fatPct != null && fatPct > 0 ? (
                <div className="space-y-1">
                  <p className="text-foreground inline-flex items-start gap-2 text-sm font-medium leading-snug">
                    <TrendingUp className="text-emerald-600 mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                      Seu faturamento está <span className="font-bold tabular-nums">{Math.round(fatPct)}%</span> maior do que
                      ontem. Parabéns!
                    </span>
                  </p>
                </div>
              ) : fatPct != null && fatPct < 0 ? (
                <p className="text-muted-foreground text-sm leading-snug">
                  Faturamento hoje está <span className="font-semibold tabular-nums">{Math.abs(Math.round(fatPct))}%</span>{' '}
                  abaixo de ontem — vale revisar a ocupação da agenda.
                </p>
              ) : fatPct === 0 ? (
                <p className="text-muted-foreground text-sm leading-snug">Faturamento alinhado ao dia anterior.</p>
              ) : null}

              {vagos != null && vagos > 0 ? (
                <div className="space-y-2">
                  <p className="text-foreground inline-flex items-start gap-2 text-sm font-medium leading-snug">
                    <Clock className="text-amber-600 mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                      Você tem <span className="font-bold tabular-nums">{vagos}</span> horário(s) vago(s) estimado(s) ainda hoje
                      (capacidade da escala vs. ocupados).
                    </span>
                  </p>
                  <Button variant="link" className="text-primary h-auto p-0 text-xs font-semibold" asChild>
                    <Link href={`${base}/agendamentos`}>Ver horários →</Link>
                  </Button>
                </div>
              ) : null}

              {diaMov ? (
                <p className="text-foreground inline-flex items-start gap-2 text-sm font-medium leading-snug">
                  <Users className="text-accent mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    <span className="font-semibold">{diaMov}</span> é o dia da semana com mais atendimentos concluídos nos
                    últimos ~8 semanas.
                  </span>
                </p>
              ) : null}

              <Button variant="outline" size="sm" className="w-full gap-1 text-xs" asChild>
                <Link href={`${base}/relatorios`}>
                  Ver todos os insights
                  <span aria-hidden>→</span>
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
