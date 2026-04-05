'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import {
  BARBEARIAS_MONTH_WINDOW_RULES,
  chartMonthNavButtonClassName,
  useMonthSwipeHandlers,
  useMonthWindowState,
  useVisibleMonthCount,
} from '@/lib/chart-month-navigation'
import { cn } from '@/lib/utils'
import {
  formatPctBR,
  toBarbeariasStackedPercentRows,
  type BarbeariasMensalAbsoluto,
  type BarbeariasMensalStackedPct,
} from '@/lib/barbearias-stacked-chart'
import { mockBarbeariasMensalPlano } from '@/lib/data/super-dashboard-charts-mock'

const chartConfig = {
  pctAtivo: {
    label: 'Plano ativo',
    color: 'var(--chart-2)',
  },
  pctInativo: {
    label: 'Plano inativo',
    color: 'var(--chart-4)',
  },
} satisfies ChartConfig

/** Só omite rótulo em fatias muito finas (abaixo de 4%) para evitar poluição; 10% etc. deve aparecer. */
function pctLabelFormatter(value: unknown, minPct: number): string {
  const n = Number(value)
  if (!Number.isFinite(n) || n < minPct) return ''
  return `${Math.round(n)}%`
}

const LABEL_MIN_PCT_ATIVO = 6
const LABEL_MIN_PCT_INATIVO = 4

export type SuperBarbeariasMensalStackedChartProps = {
  data?: readonly BarbeariasMensalAbsoluto[]
  className?: string
}

export function SuperBarbeariasMensalStackedChart({
  data = mockBarbeariasMensalPlano,
  className,
}: SuperBarbeariasMensalStackedChartProps) {
  const visibleCount = useVisibleMonthCount(BARBEARIAS_MONTH_WINDOW_RULES)
  const fullRows = useMemo(() => toBarbeariasStackedPercentRows([...data]), [data])

  const { windowStart, canPrev, canNext, goPrev, goNext, sliceVisible } = useMonthWindowState(
    fullRows.length,
    visibleCount,
  )

  const visibleRows = useMemo(() => sliceVisible(fullRows), [fullRows, sliceVisible])

  const { onTouchStart, onTouchEnd, onMouseDown } = useMonthSwipeHandlers(goPrev, goNext)

  return (
    <div className={cn('flex min-h-0 w-full flex-1 flex-col', className)}>
      <div
        className="grid min-h-0 w-full flex-1 grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-stretch gap-1 sm:gap-2"
        aria-label="Gráfico de barbearias por mês"
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
            key={`${windowStart}-${visibleCount}`}
            className={cn(
              'aspect-auto !h-full min-h-[200px] w-full flex-1 justify-stretch',
              '[&_.recharts-responsive-container]:!h-full [&_.recharts-responsive-container]:min-h-[180px]',
              'sm:min-h-[220px]',
            )}
          >
            <BarChart
              data={visibleRows}
              margin={{ top: 8, right: 2, left: 0, bottom: 2 }}
              barCategoryGap="18%"
              barGap={3}
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
                tickMargin={6}
                interval={0}
                tick={{ fontSize: 11, fontWeight: 500, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                width={42}
                tick={{ fontSize: 10, fontWeight: 500, fill: 'var(--muted-foreground)' }}
                tickFormatter={(v) => `${Math.round(Number(v))}%`}
              />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)', fillOpacity: 0.28 }}
                content={({ active, label, payload }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0].payload as BarbeariasMensalStackedPct
                  return (
                    <div className="border-border/50 bg-background grid min-w-[12rem] gap-2 rounded-xl border px-3 py-2 text-xs shadow-xl">
                      <p className="leading-none font-semibold">{label}</p>
                      <div className="grid gap-1.5">
                        <div className="text-muted-foreground flex items-center justify-between gap-4 leading-none">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 shrink-0 rounded-sm shadow-sm"
                              style={{ background: 'var(--chart-2)' }}
                            />
                            Plano ativo
                          </span>
                          <span className="text-foreground text-right font-mono font-medium tabular-nums">
                            {row.ativos.toLocaleString('pt-BR')} · {formatPctBR(row.pctAtivo)}
                          </span>
                        </div>
                        <div className="text-muted-foreground flex items-center justify-between gap-4 leading-none">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 shrink-0 rounded-sm shadow-sm"
                              style={{ background: 'var(--chart-4)' }}
                            />
                            Plano inativo
                          </span>
                          <span className="text-foreground text-right font-mono font-medium tabular-nums">
                            {row.inativos.toLocaleString('pt-BR')} · {formatPctBR(row.pctInativo)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                }}
              />
              <Bar
                dataKey="pctAtivo"
                stackId="barbearias"
                fill="var(--color-pctAtivo)"
                radius={[0, 0, 6, 6]}
                maxBarSize={72}
                animationDuration={380}
              >
                <LabelList
                  dataKey="pctAtivo"
                  position="center"
                  fill="#ffffff"
                  className="font-sans text-[11px] font-bold"
                  style={{
                    paintOrder: 'stroke fill',
                    stroke: 'rgba(0,0,0,0.42)',
                    strokeWidth: 0.45,
                    textRendering: 'optimizeLegibility',
                  }}
                  formatter={(v: unknown) => pctLabelFormatter(v, LABEL_MIN_PCT_ATIVO)}
                />
              </Bar>
              <Bar
                dataKey="pctInativo"
                stackId="barbearias"
                fill="var(--color-pctInativo)"
                radius={[6, 6, 0, 0]}
                maxBarSize={72}
                animationDuration={380}
              >
                <LabelList
                  dataKey="pctInativo"
                  position="center"
                  fill="#ffffff"
                  className="font-sans text-[11px] font-bold"
                  style={{
                    paintOrder: 'stroke fill',
                    stroke: 'rgba(0,0,0,0.42)',
                    strokeWidth: 0.45,
                    textRendering: 'optimizeLegibility',
                  }}
                  formatter={(v: unknown) => pctLabelFormatter(v, LABEL_MIN_PCT_INATIVO)}
                />
              </Bar>
            </BarChart>
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

      <div
        className={cn(
          'border-border/50 mt-3 flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-dashed pt-3 text-xs',
          'sm:mt-auto sm:pt-3.5',
        )}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 min-w-10 rounded-md shadow-sm ring-1 ring-black/5 dark:ring-white/10"
            style={{ background: 'var(--chart-2)' }}
          />
          <span className="text-muted-foreground font-medium">Plano ativo</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 min-w-10 rounded-md shadow-sm ring-1 ring-black/5 dark:ring-white/10"
            style={{ background: 'var(--chart-4)' }}
          />
          <span className="text-muted-foreground font-medium">Plano inativo</span>
        </div>
      </div>
    </div>
  )
}
