'use client'

import { useTheme } from 'next-themes'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import {
  mockAssinaturasPorPlano,
  type AssinaturaPorPlanoRow,
} from '@/lib/data/super-dashboard-charts-mock'

const chartConfig = {
  value: { label: 'Assinaturas' },
  basico: { label: 'Básico', color: 'var(--chart-1)' },
  profissional: { label: 'Profissional', color: 'var(--chart-2)' },
  premium: { label: 'Premium', color: 'var(--chart-3)' },
} satisfies ChartConfig

const segmentFillVar: Record<AssinaturaPorPlanoRow['segment'], string> = {
  basico: 'var(--chart-1)',
  profissional: 'var(--chart-2)',
  premium: 'var(--chart-3)',
}

type SliceLabelProps = {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number | string
  outerRadius?: number | string
  percent?: number
  name?: string
}

function AssinaturasDataPctSliceLabel(props: SliceLabelProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, name } = props
  const { resolvedTheme } = useTheme()

  const inner = typeof innerRadius === 'number' ? innerRadius : Number(innerRadius)
  const outer = typeof outerRadius === 'number' ? outerRadius : Number(outerRadius)
  if (
    cx == null ||
    cy == null ||
    midAngle == null ||
    !Number.isFinite(inner) ||
    !Number.isFinite(outer) ||
    outer <= inner
  ) {
    return null
  }

  const RADIAN = Math.PI / 180
  const ringThickness = outer - inner
  const midR = inner + ringThickness * 0.5
  const x = cx + midR * Math.cos(-midAngle * RADIAN)
  const y = cy + midR * Math.sin(-midAngle * RADIAN)

  const pctRounded = Math.round((percent ?? 0) * 100)
  const p = percent ?? 0
  const isTinySlice = p < 0.11

  const displayName = name ?? ''

  const pctSize = Math.round(Math.min(20, Math.max(12, ringThickness * 0.36)))
  const baseNameSize = Math.round(Math.max(6, Math.min(8.5, ringThickness * 0.1)))
  const nameFontSize =
    displayName.length > 11
      ? Math.round(Math.max(5.5, Math.min(7.2, baseNameSize * 0.88)))
      : baseNameSize
  const gap = Math.max(3, Math.round(ringThickness * 0.055))

  const fill = resolvedTheme === 'dark' ? 'var(--foreground)' : '#ffffff'
  const strokeStrong = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.4)'
  const strokeName = resolvedTheme === 'dark' ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.32)'

  const pctDisplay = isTinySlice ? Math.min(pctSize, 12) : pctSize

  if (isTinySlice) {
    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className="pointer-events-none select-none font-sans tabular-nums"
        fill={fill}
        stroke={strokeStrong}
        strokeWidth={0.42}
        paintOrder="stroke fill"
        style={{
          fontSize: pctDisplay,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          textRendering: 'optimizeLegibility',
        }}
      >
        {pctRounded}%
      </text>
    )
  }

  if (!displayName.trim()) {
    return (
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className="pointer-events-none select-none font-sans tabular-nums"
        fill={fill}
        stroke={strokeStrong}
        strokeWidth={0.42}
        paintOrder="stroke fill"
        style={{
          fontSize: pctDisplay,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          textRendering: 'optimizeLegibility',
        }}
      >
        {pctRounded}%
      </text>
    )
  }

  const nameY = -(pctDisplay * 0.42 + gap * 0.65 + nameFontSize * 0.45)
  const pctY = nameFontSize * 0.45 + gap * 0.65 + pctDisplay * 0.38

  return (
    <g
      transform={`translate(${x},${y})`}
      className="pointer-events-none select-none font-sans"
      style={{ textRendering: 'optimizeLegibility' }}
    >
      <text
        textAnchor="middle"
        y={nameY}
        dominantBaseline="central"
        fill={fill}
        stroke={strokeName}
        strokeWidth={0.28}
        paintOrder="stroke fill"
        style={{
          fontSize: nameFontSize,
          fontWeight: 600,
          letterSpacing: displayName.length > 11 ? '0.01em' : '0.04em',
        }}
      >
        {displayName}
      </text>
      <text
        textAnchor="middle"
        y={pctY}
        dominantBaseline="central"
        fill={fill}
        stroke={strokeStrong}
        strokeWidth={0.42}
        paintOrder="stroke fill"
        className="tabular-nums"
        style={{
          fontSize: pctDisplay,
          fontWeight: 800,
          letterSpacing: '-0.04em',
        }}
      >
        {pctRounded}%
      </text>
    </g>
  )
}

function CenterDottedRule() {
  const dots = 11
  return (
    <div className="flex items-end justify-center gap-0.5 py-1.5" aria-hidden>
      {Array.from({ length: dots }, (_, i) => {
        const d = 2 + Math.min(i, dots - 1 - i) * 0.35
        return (
          <span
            key={i}
            className="shrink-0 rounded-full bg-amber-600/75 dark:bg-amber-500/80"
            style={{ width: d, height: d }}
          />
        )
      })}
    </div>
  )
}

const legendCopy: Record<AssinaturaPorPlanoRow['segment'], string> = {
  basico:
    'Maior participação entre os planos. Ideal para barbearias que estão começando com o essencial.',
  profissional:
    'Forte presença na base ativa. Recursos ampliados para operação em crescimento.',
  premium:
    'Experiência completa para unidades que priorizam o máximo de funcionalidades.',
}

function PlanPlanoDetailCard({
  row,
  total,
  className,
}: {
  row: AssinaturaPorPlanoRow
  total: number
  className?: string
}) {
  const pct = total > 0 ? Math.round((row.value / total) * 100) : 0
  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 bg-card/90 px-3.5 pb-3 pt-3 shadow-md ring-1 ring-black/[0.03] dark:ring-white/[0.06]',
        className,
      )}
    >
      <div
        className="mb-2.5 h-3 w-full rounded-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]"
        style={{ background: segmentFillVar[row.segment] }}
      />
      <p className="text-foreground text-xs font-semibold leading-tight">{row.name}</p>
      <p className="text-muted-foreground mt-1 text-[10px] font-normal leading-relaxed sm:text-[11px]">
        {legendCopy[row.segment]}
      </p>
      <p className="text-muted-foreground mt-1.5 text-[10px] font-medium tabular-nums sm:text-[11px]">
        {row.value.toLocaleString('pt-BR')} assinaturas ativas · {pct}% do total
      </p>
    </div>
  )
}

export type SuperAssinaturasAtivasPieChartProps = {
  data?: ReadonlyArray<AssinaturaPorPlanoRow>
  className?: string
}

export function SuperAssinaturasAtivasPieChart({
  data = mockAssinaturasPorPlano,
  className,
}: SuperAssinaturasAtivasPieChartProps) {
  const chartRows = useMemo(() => [...data], [data])
  const total = useMemo(() => chartRows.reduce((acc, r) => acc + r.value, 0), [chartRows])
  const rawId = useId().replace(/:/g, '')
  const shadowFilterId = `assinaturas-pie-depth-${rawId}`

  const isLgUp = useMediaQuery('(min-width: 1024px)')
  const isCoarsePointer = useMediaQuery('(pointer: coarse)')
  const [chartInteractiveReady, setChartInteractiveReady] = useState(false)
  useEffect(() => {
    setChartInteractiveReady(true)
  }, [])
  const showHoverTooltip = chartInteractiveReady && !isLgUp && !isCoarsePointer

  const [selectedSegment, setSelectedSegment] = useState<AssinaturaPorPlanoRow['segment'] | null>(
    null,
  )
  const interactRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLgUp) setSelectedSegment(null)
  }, [isLgUp])

  useEffect(() => {
    if (selectedSegment == null || isLgUp || !isCoarsePointer) return
    const onPointerDown = (e: PointerEvent) => {
      const root = interactRef.current
      const t = e.target
      if (root && t instanceof Node && !root.contains(t)) {
        setSelectedSegment(null)
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [selectedSegment, isLgUp, isCoarsePointer])

  useEffect(() => {
    if (selectedSegment == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSegment(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedSegment])

  const selectedRow = useMemo(
    () => chartRows.find((r) => r.segment === selectedSegment),
    [chartRows, selectedSegment],
  )

  const showTouchPanel = !isLgUp && isCoarsePointer && selectedRow != null

  const onPieClick = (slice: AssinaturaPorPlanoRow) => {
    if (isLgUp || !isCoarsePointer) return
    setSelectedSegment((prev) => (prev === slice.segment ? null : slice.segment))
  }

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-10',
        className,
      )}
    >
      {/* Donut — coluna única & centralizada &lt; lg; à esquerda no desktop */}
      <div className="relative w-full min-w-0 shrink-0 lg:flex-[1.35]">
        <div
          ref={interactRef}
          data-assinaturas-chart
          className="mx-auto flex w-full max-w-[min(100%,420px)] flex-col items-stretch lg:mx-0 lg:max-w-none"
        >
          <div className="relative aspect-square w-full min-h-[240px] sm:min-h-[260px] lg:max-w-[min(100%,400px)] lg:min-h-[300px]">
          <ChartContainer
            config={chartConfig}
            className={cn(
              'aspect-square !size-full h-full w-full touch-manipulation [&_[data-slot=chart]]:justify-center',
              !isLgUp && isCoarsePointer && 'cursor-pointer [&_.recharts-layer.recharts-pie]:cursor-pointer',
            )}
          >
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <defs>
                <filter
                  id={shadowFilterId}
                  x="-40%"
                  y="-40%"
                  width="180%"
                  height="180%"
                  colorInterpolationFilters="sRGB"
                >
                  <feDropShadow dx="0" dy="4" stdDeviation="5.5" floodOpacity="0.17" />
                </filter>
              </defs>
              {showHoverTooltip ? (
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const row = payload[0].payload as AssinaturaPorPlanoRow
                    return (
                      <div className="pointer-events-none max-w-[min(18rem,calc(100vw-2rem))]">
                        <PlanPlanoDetailCard row={row} total={total} />
                      </div>
                    )
                  }}
                />
              ) : null}
              <Pie
                data={chartRows}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="44%"
                outerRadius="88%"
                paddingAngle={4.2}
                cornerRadius={8}
                stroke="var(--card)"
                strokeWidth={3}
                startAngle={100}
                endAngle={-260}
                labelLine={false}
                style={{ filter: `url(#${shadowFilterId})` }}
                label={(props) => <AssinaturasDataPctSliceLabel {...props} />}
                onClick={(_, index) => {
                  const row = chartRows[index]
                  if (row) onPieClick(row)
                }}
              >
                {chartRows.map((row) => (
                  <Cell key={row.segment} fill={`var(--color-${row.segment})`} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Disco central — sobreposto, sombra e hierarquia como na referência */}
          <div
            className={cn(
              'pointer-events-none absolute left-1/2 top-1/2 z-10 flex w-[min(46%,168px)] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full px-3 py-3 text-center sm:w-[min(46%,182px)] sm:px-4 sm:py-4',
              'border border-border/40 bg-card shadow-[0_14px_44px_-10px_rgba(0,0,0,0.2),0_6px_16px_-6px_rgba(0,0,0,0.1)]',
              'dark:border-border/50 dark:shadow-[0_14px_44px_-10px_rgba(0,0,0,0.45),0_6px_16px_-6px_rgba(0,0,0,0.25)]',
            )}
            style={{ aspectRatio: '1' }}
            aria-hidden
          >
            <p className="text-[9px] font-bold uppercase leading-tight tracking-[0.28em] text-amber-600 dark:text-amber-500 sm:text-[10px]">
              ASSINATURAS
            </p>
            <CenterDottedRule />
            <p className="text-muted-foreground mt-0.5 text-[8px] leading-snug sm:text-[9px]">
              Distribuição das assinaturas ativas por plano neste período.
            </p>
            <p className="text-foreground mt-2 text-lg font-bold tabular-nums leading-none sm:text-xl">
              {total.toLocaleString('pt-BR')}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[8px] font-medium sm:text-[9px]">
              total ativas
            </p>
          </div>
          </div>

          {/* Detalhe por toque (fora do aspect-square para não distorcer o donut) */}
          {showTouchPanel && selectedRow ? (
            <div
              className="mt-5 w-full px-0.5"
              aria-live="polite"
              role="region"
              aria-label={`Detalhes do plano ${selectedRow.name}`}
            >
              <PlanPlanoDetailCard row={selectedRow} total={total} />
            </div>
          ) : null}
        </div>
      </div>

      {/* Legenda — só a partir de lg (desktop) */}
      <div
        className="hidden w-full flex-col gap-3.5 lg:flex lg:w-[min(100%,240px)] lg:flex-none lg:shrink-0 lg:self-center"
        aria-label="Legenda dos planos"
      >
        {chartRows.map((row) => (
          <PlanPlanoDetailCard key={row.segment} row={row} total={total} />
        ))}
      </div>
    </div>
  )
}
