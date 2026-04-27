'use client'

import Link from 'next/link'
import { Clock, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardInsightsDia } from '@/types/admin-dashboard'

export function InsightsDia(props: {
  base: string
  insightsDia: DashboardInsightsDia | null
  isLoading: boolean
  error: string | null
}) {
  const { base, insightsDia, isLoading, error } = props
  const fatPct = insightsDia?.fatPctVsOntem
  const vagos = insightsDia?.vagosEstimados
  const diaMov = insightsDia?.diaMaisMovimentado

  return (
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
  )
}
