'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useId, useMemo, type ReactNode } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import {
  chartMonthNavButtonClassName,
  MRR_MONTH_WINDOW_RULES,
  useMonthSwipeHandlers,
  useMonthWindowState,
  useVisibleMonthCount,
} from '@/lib/chart-month-navigation'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/constants'
import { mockMrrMensal } from '@/lib/data/super-dashboard-charts-mock'
import {
  buildMrrChartRows,
  computeMrrResumoExecutivo,
  formatMrrMonthDisplay,
  formatPctVariacao,
  type MrrMensalPonto,
  type MrrMensalComVariacao,
} from '@/lib/mrr-series-stats'

const chartConfig = {
  value: { label: 'MRR' },
  mrr: {
    label: 'MRR estimado',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

function Metrica({
  label,
  valor,
  sublinha,
  className,
}: {
  label: string
  valor: ReactNode
  sublinha?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-foreground mt-1 text-base font-bold tabular-nums leading-tight sm:text-[17px]">
        {valor}
      </p>
      {sublinha != null ? (
        <p className="text-muted-foreground mt-0.5 text-[10px] font-medium leading-snug">{sublinha}</p>
      ) : null}
    </div>
  )
}

export type SuperMrrEstimadoSectionProps = {
  data?: readonly MrrMensalPonto[]
  className?: string
}

export function SuperMrrEstimadoSection({
  data = mockMrrMensal,
  className,
}: SuperMrrEstimadoSectionProps) {
  const series = useMemo(() => [...data] as MrrMensalPonto[], [data])
  const chartRows = useMemo(() => buildMrrChartRows(series), [series])
  const resumo = useMemo(() => computeMrrResumoExecutivo(series), [series])

  const visibleCount = useVisibleMonthCount(MRR_MONTH_WINDOW_RULES)
  const { windowStart, canPrev, canNext, goPrev, goNext, sliceVisible } = useMonthWindowState(
    chartRows.length,
    visibleCount,
  )
  const visibleChartRows = useMemo(() => sliceVisible(chartRows), [chartRows, sliceVisible])
  const { onTouchStart, onTouchEnd, onMouseDown } = useMonthSwipeHandlers(goPrev, goNext)

  const axisMonthFormatter = useMemo(() => {
    const compact = visibleChartRows.length >= 10
    return (v: string | number) =>
      compact ? String(v) : formatMrrMonthDisplay(String(v))
  }, [visibleChartRows.length])
  const rawId = useId().replace(/:/g, '')
  const gradientId = `mrr-fill-${rawId}`

  const crescimentoLabel =
    resumo.crescimentoJanUltimoPct != null
      ? formatPctVariacao(resumo.crescimentoJanUltimoPct)
      : '—'

  return (
    <div className={cn('flex min-h-0 w-full flex-1 flex-col gap-4', className)}>
      <div
        className={cn(
          'grid shrink-0 grid-cols-2 gap-x-4 gap-y-4 border-b border-dashed border-border/60 pb-4',
          'sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-3',
        )}
        aria-label="Resumo executivo MRR"
      >
        <Metrica label="Total acumulado" valor={formatCurrency(resumo.totalAno)} sublinha="Soma no período" />
        <Metrica label="Média mensal" valor={formatCurrency(resumo.mediaMensal)} sublinha="Por mês" />
        <Metrica
          label="Maior mês"
          valor={formatCurrency(resumo.maiorMes.value)}
          sublinha={formatMrrMonthDisplay(resumo.maiorMes.month)}
        />
        <Metrica
          label="Menor mês"
          valor={formatCurrency(resumo.menorMes.value)}
          sublinha={formatMrrMonthDisplay(resumo.menorMes.month)}
        />
        <Metrica
          label="Crescimento"
          valor={crescimentoLabel}
          sublinha={`${formatMrrMonthDisplay(series[0]?.month ?? 'Jan')} → ${formatMrrMonthDisplay(resumo.ultimoMes.month)}`}
        />
        <Metrica
          label="Último mês"
          valor={formatCurrency(resumo.ultimoMes.value)}
          sublinha={formatMrrMonthDisplay(resumo.ultimoMes.month)}
        />
      </div>

      <div className="flex w-full min-h-[240px] flex-1 flex-col sm:min-h-[260px] lg:min-h-[280px]">
        <div
          className="grid min-h-0 w-full flex-1 grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-stretch gap-1 sm:gap-2"
          aria-label="Gráfico de MRR estimado por mês"
        >
          <div className="flex min-h-0 items-center justify-center self-stretch">
            {canPrev ? (
              <button
                type="button"
                className={chartMonthNavButtonClassName}
                onClick={goPrev}
                aria-label="Ver meses anteriores"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
              </button>
            ) : null}
          </div>

          <div
            className={cn(
              'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
              'cursor-grab touch-pan-y select-none active:cursor-grabbing',
              'transition-opacity duration-300 ease-out',
            )}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
          >
            <ChartContainer
              config={chartConfig}
              key={`mrr-${windowStart}-${visibleCount}`}
              className={cn(
                'aspect-auto !h-full min-h-[200px] w-full flex-1 justify-stretch',
                '[&_.recharts-responsive-container]:!h-full [&_.recharts-responsive-container]:min-h-[180px]',
                'sm:min-h-[220px] lg:min-h-[240px]',
              )}
            >
              <AreaChart
                data={visibleChartRows}
                margin={{ top: 10, right: 6, left: 0, bottom: 6 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-mrr)" stopOpacity={0.42} />
                    <stop offset="55%" stopColor="var(--color-mrr)" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="var(--color-mrr)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="5 8"
                  className="stroke-border/35"
                  strokeOpacity={0.9}
                />
                <XAxis
                  dataKey="month"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={0}
                  tickFormatter={(v) => axisMonthFormatter(v)}
                  tick={{ fontSize: 11, fontWeight: 500, fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={54}
                  tick={{ fontSize: 10, fontWeight: 500, fill: 'var(--muted-foreground)' }}
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
                  cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={({ active, label, payload }) => {
                    if (!active || !payload?.length) return null
                    const row = payload[0].payload as MrrMensalComVariacao
                    const pct = row.pctVsAnterior
                    return (
                      <div className="border-border/50 bg-background grid min-w-[11.5rem] gap-2 rounded-xl border px-3 py-2.5 text-xs shadow-xl">
                        <p className="leading-none font-semibold">
                          {formatMrrMonthDisplay(String(label))}
                        </p>
                        <p className="text-foreground font-mono text-sm font-bold tabular-nums">
                          {formatCurrency(row.value)}
                        </p>
                        {pct != null ? (
                          <p
                            className={cn(
                              'text-[11px] font-medium tabular-nums',
                              pct >= 0 ? 'text-success' : 'text-destructive',
                            )}
                          >
                            {formatPctVariacao(pct)}{' '}
                            <span className="text-muted-foreground font-normal">vs mês anterior</span>
                          </p>
                        ) : (
                          <p className="text-muted-foreground text-[11px]">Primeiro mês do período</p>
                        )}
                      </div>
                    )
                  }}
                />
                <Area
                  type="natural"
                  dataKey="value"
                  name="mrr"
                  stroke="var(--color-mrr)"
                  strokeWidth={2.5}
                  fill={`url(#${gradientId})`}
                  dot={{
                    r: 3,
                    fill: 'var(--card)',
                    stroke: 'var(--color-mrr)',
                    strokeWidth: 2,
                  }}
                  activeDot={{ r: 5, strokeWidth: 0, fill: 'var(--color-mrr)' }}
                  animationDuration={380}
                />
              </AreaChart>
            </ChartContainer>
          </div>

          <div className="flex min-h-0 items-center justify-center self-stretch">
            {canNext ? (
              <button
                type="button"
                className={chartMonthNavButtonClassName}
                onClick={goNext}
                aria-label="Ver próximos meses"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
