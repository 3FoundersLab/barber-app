'use client'

import { Building2, CreditCard, TrendingUp } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import { SuperAssinaturasAtivasPieChart } from '@/components/super/super-assinaturas-ativas-pie-chart'
import { Card, CardContent } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatCurrency } from '@/lib/constants'
import {
  getBarbeariasComparisonChartRows,
  mockBarbeariasPlanoStatus,
  mockMrrMensal,
} from '@/lib/data/super-dashboard-charts-mock'

const barbeariasChartConfig = {
  value: { label: 'Barbearias' },
  ativas: {
    label: 'Plano ativo',
    color: 'var(--chart-2)',
  },
  inativas: {
    label: 'Plano inativo',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig

const mrrChartConfig = {
  value: { label: 'MRR' },
  mrr: {
    label: 'MRR estimado',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

const barbeariasRows = getBarbeariasComparisonChartRows()

export function SuperDashboardChartsSection() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium">Barbearias</span>
            </div>
            <ChartContainer
              config={barbeariasChartConfig}
              className="aspect-auto h-[220px] w-full"
            >
              <BarChart
                data={barbeariasRows}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={0}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => (
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {Number(value).toLocaleString('pt-BR')}
                        </span>
                      )}
                    />
                  }
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {barbeariasRows.map((row) => (
                    <Cell key={row.key} fill={`var(--color-${row.key})`} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: 'var(--chart-2)' }}
                />
                Plano ativo · {mockBarbeariasPlanoStatus.comPlanoAtivo}
              </li>
              <li className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: 'var(--chart-4)' }}
                />
                Plano inativo · {mockBarbeariasPlanoStatus.comPlanoInativo}
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium">Assinaturas Ativas</span>
            </div>
            <SuperAssinaturasAtivasPieChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium">MRR estimado</span>
          </div>
          <ChartContainer config={mrrChartConfig} className="aspect-auto h-[260px] w-full">
            <AreaChart data={[...mockMrrMensal]} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="superMrrFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-mrr)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-mrr)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fontSize: 10 }}
                tickFormatter={(v) =>
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0,
                    notation: 'compact',
                    compactDisplay: 'short',
                  }).format(Number(v))
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {formatCurrency(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                name="mrr"
                stroke="var(--color-mrr)"
                strokeWidth={2}
                fill="url(#superMrrFill)"
                dot={{ r: 3, fill: 'var(--color-mrr)', strokeWidth: 0 }}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
