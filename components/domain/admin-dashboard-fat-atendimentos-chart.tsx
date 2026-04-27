'use client'

import { CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { DashboardFatAtendDiarioPonto } from '@/types/admin-dashboard'

const chartConfig = {
  fat: {
    label: 'Faturamento (R$)',
    color: 'hsl(217 91% 53%)',
  },
  at: {
    label: 'Atendimentos',
    color: 'hsl(142 71% 40%)',
  },
} satisfies ChartConfig

function FatLabel(props: { x?: number; y?: number; value?: number }) {
  const { x, y, value } = props
  if (x == null || y == null || value == null || !Number.isFinite(value)) return null
  return (
    <text
      x={x}
      y={y - 8}
      fill="hsl(217 91% 45%)"
      fontSize={10}
      fontWeight={600}
      textAnchor="middle"
      className="tabular-nums"
    >
      {formatCurrency(value)}
    </text>
  )
}

function AtendLabel(props: { x?: number; y?: number; value?: number }) {
  const { x, y, value } = props
  if (x == null || y == null || value == null || !Number.isFinite(value)) return null
  return (
    <text
      x={x}
      y={y - 8}
      fill="hsl(142 71% 32%)"
      fontSize={10}
      fontWeight={600}
      textAnchor="middle"
      className="tabular-nums"
    >
      {Math.round(value)}
    </text>
  )
}

export function AdminDashboardFatAtendimentosChart(props: {
  data: DashboardFatAtendDiarioPonto[]
  isLoading: boolean
  error: string | null
}) {
  const { data, isLoading, error } = props

  const chartData = data.map((d) => ({
    ...d,
    fat: Math.round(d.faturamento * 100) / 100,
    at: d.atendimentos,
  }))

  return (
    <Card className="border-border/80">
      <CardHeader className="space-y-3 pb-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <CardTitle className="text-base leading-tight sm:text-lg">
              Faturamento e atendimentos (últimos 7 dias)
            </CardTitle>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2.5 shrink-0 rounded-full bg-[hsl(217_91%_53%)]" aria-hidden />
                <span className="text-muted-foreground">Faturamento (R$)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2.5 shrink-0 rounded-full bg-[hsl(142_71%_40%)]" aria-hidden />
                <span className="text-muted-foreground">Atendimentos</span>
              </span>
            </div>
          </div>
          <Select defaultValue="7">
            <SelectTrigger
              className={cn('border-border/80 h-9 w-[min(100%,7rem)] shrink-0 text-xs sm:w-32')}
              aria-label="Período do gráfico"
            >
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {error ? (
          <p className="text-muted-foreground py-8 text-center text-sm">Gráfico indisponível.</p>
        ) : isLoading ? (
          <div className="bg-muted h-[280px] animate-pulse rounded-lg" />
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full min-h-[260px] [&_.recharts-responsive-container]:!h-full">
            <LineChart data={chartData} margin={{ top: 28, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} className="stroke-border/50" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                yAxisId="left"
                width={44}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (typeof v === 'number' && v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                width={36}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (name === 'fat') return formatCurrency(Number(value))
                      return String(value)
                    }}
                    labelFormatter={(_, payload) => {
                      const row = payload?.[0]?.payload as DashboardFatAtendDiarioPonto | undefined
                      return row?.label ? `Dia ${row.label}` : '—'
                    }}
                  />
                }
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="fat"
                name="fat"
                stroke="var(--color-fat)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: 'hsl(217 91% 53%)', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5 }}
              >
                <LabelList
                  dataKey="fat"
                  content={(props) => (
                    <FatLabel
                      x={typeof props.x === 'number' ? props.x : Number(props.x)}
                      y={typeof props.y === 'number' ? props.y : Number(props.y)}
                      value={Number(props.value)}
                    />
                  )}
                />
              </Line>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="at"
                name="at"
                stroke="var(--color-at)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: 'hsl(142 71% 40%)', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5 }}
              >
                <LabelList
                  dataKey="at"
                  content={(props) => (
                    <AtendLabel
                      x={typeof props.x === 'number' ? props.x : Number(props.x)}
                      y={typeof props.y === 'number' ? props.y : Number(props.y)}
                      value={Number(props.value)}
                    />
                  )}
                />
              </Line>
            </LineChart>
          </ChartContainer>
        )}
        {!error && !isLoading ? (
          <p className="text-muted-foreground mt-2 text-[11px] leading-relaxed">
            Linha azul: faturamento confirmado (eixo esquerdo, R$). Linha verde: atendimentos concluídos por dia
            (eixo direito). Valores exibidos acima de cada ponto.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
