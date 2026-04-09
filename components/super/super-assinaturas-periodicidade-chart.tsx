'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import {
  PLANOS_PERIODICIDADE,
  parsePlanoPeriodicidade,
  type PlanoPeriodicidade,
} from '@/lib/plano-periodicidade'
import type { Assinatura } from '@/types'

const chartConfig = {
  mensal: { label: 'Mensal', color: 'var(--chart-1)' },
  trimestral: { label: 'Trimestral', color: 'var(--chart-2)' },
  semestral: { label: 'Semestral', color: 'var(--chart-3)' },
  anual: { label: 'Anual', color: 'var(--chart-4)' },
} satisfies ChartConfig

type PeriodicidadeRow = {
  key: PlanoPeriodicidade
  periodo: string
  quantidade: number
}

export type SuperAssinaturasPeriodicidadeChartProps = {
  assinaturas: readonly Pick<Assinatura, 'periodicidade'>[]
  className?: string
}

export function SuperAssinaturasPeriodicidadeChart({
  assinaturas,
  className,
}: SuperAssinaturasPeriodicidadeChartProps) {
  const isLgUp = useMediaQuery('(min-width: 1024px)')

  const { data, total } = useMemo(() => {
    const counts: Record<PlanoPeriodicidade, number> = {
      mensal: 0,
      trimestral: 0,
      semestral: 0,
      anual: 0,
    }
    for (const a of assinaturas) {
      counts[parsePlanoPeriodicidade(a.periodicidade)]++
    }
    const rows: PeriodicidadeRow[] = PLANOS_PERIODICIDADE.map(({ id, label }) => ({
      key: id,
      periodo: label,
      quantidade: counts[id],
    }))
    const sum = rows.reduce((s, r) => s + r.quantidade, 0)
    return { data: rows, total: sum }
  }, [assinaturas])

  const ariaSummary = useMemo(() => {
    if (total === 0) return 'Nenhuma assinatura no período.'
    return data
      .filter((r) => r.quantidade > 0)
      .map(
        (r) =>
          `${r.periodo}: ${r.quantidade.toLocaleString('pt-BR')} (${total > 0 ? Math.round((r.quantidade / total) * 100) : 0}%)`,
      )
      .join('. ')
  }, [data, total])

  return (
    <Card
      className={cn('overflow-hidden', className)}
      data-assinaturas-periodicidade-chart
    >
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base font-semibold tracking-tight">
          Assinaturas por período de cobrança
        </CardTitle>
        <CardDescription>
          Quantidade de assinaturas em cada ciclo (mensal, trimestral, semestral ou anual). Registros sem período
          definido contam como mensal.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="sr-only" aria-live="polite">
          {ariaSummary}
        </div>
        <ChartContainer
          config={chartConfig}
          className={cn(
            'aspect-auto w-full min-h-[220px] justify-stretch sm:min-h-[240px]',
            '[&_.recharts-responsive-container]:!h-full [&_.recharts-responsive-container]:min-h-[200px]',
          )}
        >
          <BarChart
            data={data}
            margin={
              isLgUp
                ? { top: 12, right: 12, left: 4, bottom: 8 }
                : { top: 8, right: 8, left: 0, bottom: 4 }
            }
            barCategoryGap="18%"
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="4 6"
              className="stroke-border/40"
              strokeOpacity={0.65}
            />
            <XAxis
              dataKey="periodo"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fontSize: 11, fontWeight: 500, fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={isLgUp ? 40 : 36}
              tick={{ fontSize: 10, fontWeight: 500, fill: 'var(--muted-foreground)' }}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--muted)', fillOpacity: 0.28 }}
              content={({ active, label, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as PeriodicidadeRow
                const pct = total > 0 ? Math.round((row.quantidade / total) * 100) : 0
                return (
                  <div className="border-border/50 bg-background grid min-w-[12rem] gap-2 rounded-xl border px-3 py-2 text-xs shadow-xl">
                    <div className="flex items-center justify-between gap-4 leading-none">
                      <span className="text-muted-foreground">Período</span>
                      <span className="text-foreground font-semibold">{label}</span>
                    </div>
                    <div className="text-foreground flex items-center justify-between gap-4 font-medium">
                      <span>Assinaturas</span>
                      <span className="font-mono tabular-nums">
                        {row.quantidade.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-muted-foreground border-t border-border/50 pt-2 text-[11px] leading-snug">
                      {pct}% do total ({total.toLocaleString('pt-BR')} assinaturas)
                    </p>
                  </div>
                )
              }}
            />
            <Bar dataKey="quantidade" name="Assinaturas" radius={[6, 6, 0, 0]} maxBarSize={72}>
              {data.map((row) => (
                <Cell key={row.key} fill={`var(--color-${row.key})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
