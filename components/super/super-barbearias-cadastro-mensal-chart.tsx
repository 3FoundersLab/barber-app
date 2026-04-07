'use client'

import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { format, startOfMonth, subMonths } from 'date-fns'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import {
  barbeariasIdsComPlano,
  buildBarbeariasCadastroMensalRows,
  type BarbeariasCadastroMensalChartRow,
} from '@/lib/barbearias-cadastro-mensal-chart'
import type { Assinatura, Barbearia } from '@/types'

const chartConfig = {
  comPlano: {
    label: 'Com plano',
    color: 'var(--chart-2)',
  },
  semPlano: {
    label: 'Sem plano',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig

function defaultDateRange(): { from: string; to: string } {
  const now = new Date()
  return {
    from: format(startOfMonth(subMonths(now, 11)), 'yyyy-MM-dd'),
    to: format(now, 'yyyy-MM-dd'),
  }
}

export type SuperBarbeariasCadastroMensalChartProps = {
  barbearias: readonly Barbearia[]
  assinaturas: readonly Pick<Assinatura, 'barbearia_id' | 'status'>[]
  className?: string
}

export function SuperBarbeariasCadastroMensalChart({
  barbearias,
  assinaturas,
  className,
}: SuperBarbeariasCadastroMensalChartProps) {
  const defaults = useMemo(() => defaultDateRange(), [])
  const [rangeFrom, setRangeFrom] = useState(defaults.from)
  const [rangeTo, setRangeTo] = useState(defaults.to)

  const comPlanoIds = useMemo(() => barbeariasIdsComPlano(assinaturas), [assinaturas])

  const chartRows = useMemo(() => {
    let from = rangeFrom
    let to = rangeTo
    if (from > to) {
      ;[from, to] = [to, from]
    }
    return buildBarbeariasCadastroMensalRows(barbearias, comPlanoIds, from, to)
  }, [barbearias, comPlanoIds, rangeFrom, rangeTo])

  const isLgUp = useMediaQuery('(min-width: 1024px)')
  const barCategoryGap = isLgUp ? '14%' : '20%'
  const barGap = isLgUp ? 2 : 4
  const maxBarSize = isLgUp ? 56 : 64

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-base font-semibold tracking-tight">
          Cadastros por mês
        </CardTitle>
        <CardDescription>
          Total de barbearias cadastradas por mês, com e sem plano ativo.
        </CardDescription>
        <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          <div className="grid w-full gap-1.5 sm:max-w-[11rem]">
            <Label htmlFor="barbearias-chart-from" className="text-xs text-muted-foreground">
              De
            </Label>
            <Input
              id="barbearias-chart-from"
              type="date"
              value={rangeFrom}
              onChange={(e) => setRangeFrom(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="grid w-full gap-1.5 sm:max-w-[11rem]">
            <Label htmlFor="barbearias-chart-to" className="text-xs text-muted-foreground">
              Até
            </Label>
            <Input
              id="barbearias-chart-to"
              type="date"
              value={rangeTo}
              onChange={(e) => setRangeTo(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer
          config={chartConfig}
          key={`${rangeFrom}-${rangeTo}-${chartRows.length}`}
          className={cn(
            'aspect-auto w-full min-h-[240px] justify-stretch sm:min-h-[260px]',
            '[&_.recharts-responsive-container]:!h-full [&_.recharts-responsive-container]:min-h-[220px]',
          )}
        >
          <BarChart
            data={chartRows}
            margin={
              isLgUp
                ? { top: 12, right: 8, left: 4, bottom: 4 }
                : { top: 8, right: 4, left: 0, bottom: 2 }
            }
            barCategoryGap={barCategoryGap}
            barGap={barGap}
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="4 6"
              className="stroke-border/40"
              strokeOpacity={0.65}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={0}
              angle={chartRows.length > 10 ? -35 : 0}
              textAnchor={chartRows.length > 10 ? 'end' : 'middle'}
              height={chartRows.length > 10 ? 52 : 32}
              tick={{ fontSize: 11, fontWeight: 500, fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={40}
              tick={{ fontSize: 10, fontWeight: 500, fill: 'var(--muted-foreground)' }}
            />
            <ChartTooltip
              cursor={{ fill: 'var(--muted)', fillOpacity: 0.28 }}
              content={({ active, label, payload }) => {
                if (!active || !payload?.length) return null
                const row = payload[0].payload as BarbeariasCadastroMensalChartRow
                return (
                  <div className="border-border/50 bg-background grid min-w-[13rem] gap-2 rounded-xl border px-3 py-2 text-xs shadow-xl">
                    <div className="flex items-center justify-between gap-4 leading-none">
                      <span className="text-muted-foreground">Mês</span>
                      <span className="text-foreground font-semibold">{label}</span>
                    </div>
                    <div className="text-foreground flex items-center justify-between gap-4 border-b border-border/50 pb-2 font-medium">
                      <span>Total</span>
                      <span className="font-mono tabular-nums">{row.total.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="grid gap-1.5">
                      <div className="text-muted-foreground flex items-center justify-between gap-4 leading-none">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 shrink-0 rounded-sm shadow-sm"
                            style={{ background: 'var(--chart-2)' }}
                          />
                          Com plano
                        </span>
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {row.comPlano.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-muted-foreground flex items-center justify-between gap-4 leading-none">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 shrink-0 rounded-sm shadow-sm"
                            style={{ background: 'var(--chart-4)' }}
                          />
                          Sem plano
                        </span>
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {row.semPlano.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }}
            />
            <Bar
              dataKey="comPlano"
              name="Com plano"
              stackId="cadastros"
              fill="var(--color-comPlano)"
              radius={[0, 0, 4, 4]}
              maxBarSize={maxBarSize}
              animationDuration={420}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="semPlano"
              name="Sem plano"
              stackId="cadastros"
              fill="var(--color-semPlano)"
              radius={[4, 4, 0, 0]}
              maxBarSize={maxBarSize}
              animationDuration={420}
              animationEasing="ease-out"
            />
          </BarChart>
        </ChartContainer>

        <div
          className={cn(
            'border-border/50 mt-3 flex shrink-0 flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-dashed pt-3 text-xs',
            'sm:justify-start',
          )}
        >
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 min-w-10 rounded-md shadow-sm ring-1 ring-black/5 dark:ring-white/10"
              style={{ background: 'var(--chart-2)' }}
            />
            <span className="text-muted-foreground font-medium">Com plano</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 min-w-10 rounded-md shadow-sm ring-1 ring-black/5 dark:ring-white/10"
              style={{ background: 'var(--chart-4)' }}
            />
            <span className="text-muted-foreground font-medium">Sem plano</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
