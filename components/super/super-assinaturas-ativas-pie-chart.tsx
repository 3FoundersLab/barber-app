'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
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

const RADIAN = Math.PI / 180

type PieCalloutPayload = {
  cx?: number
  cy?: number
  midAngle?: number
  outerRadius?: number | string
  innerRadius?: number | string
  name?: string
  value?: number
  fill?: string
}

function PieCalloutGroup({
  cx = 0,
  cy = 0,
  midAngle = 0,
  outerRadius: orOuter,
  name,
  value,
  total,
  radialExtra,
  horizontalStub,
  textNudge,
  fontSize,
}: PieCalloutPayload & {
  total: number
  radialExtra: number
  horizontalStub: number
  textNudge: number
  fontSize: number
}) {
  const outer = Number(orOuter)
  if (
    !Number.isFinite(outer) ||
    outer <= 0 ||
    !name ||
    value == null ||
    !Number.isFinite(Number(value))
  ) {
    return null
  }

  const angle = -midAngle * RADIAN
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  const p0 = { x: cx + outer * cos, y: cy + outer * sin }
  const p1 = { x: cx + (outer + radialExtra) * cos, y: cy + (outer + radialExtra) * sin }
  const isRight = p1.x >= cx
  const sign = isRight ? 1 : -1
  const p2 = { x: p1.x + sign * horizontalStub, y: p1.y }

  const pct = total > 0 ? Math.round((Number(value) / total) * 100) : 0
  const tx = p2.x + sign * textNudge

  const d = `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`

  return (
    <g className="pointer-events-none select-none font-sans">
      <path
        d={d}
        fill="none"
        stroke="var(--border)"
        strokeOpacity={0.72}
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <text
        x={tx}
        y={p2.y}
        textAnchor={isRight ? 'start' : 'end'}
        dominantBaseline="central"
        className="fill-foreground font-medium tabular-nums"
        style={{
          fontSize,
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        {name} — {pct}%
      </text>
    </g>
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

  const isLgUp = useMediaQuery('(min-width: 1024px)')
  const isCoarsePointer = useMediaQuery('(pointer: coarse)')

  const rootRef = useRef<HTMLDivElement>(null)
  const chartBoxRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useLayoutEffect(() => {
    const el = chartBoxRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width
      if (next != null && next > 0) setContainerWidth(next)
    })
    ro.observe(el)
    setContainerWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [])

  const [selectedSegment, setSelectedSegment] = useState<AssinaturaPorPlanoRow['segment'] | null>(
    null,
  )

  useEffect(() => {
    if (isLgUp) setSelectedSegment(null)
  }, [isLgUp])

  useEffect(() => {
    if (selectedSegment == null || isLgUp || !isCoarsePointer) return
    const onPointerDown = (e: PointerEvent) => {
      const root = rootRef.current
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

  const w = containerWidth || 360
  const narrowMobile = !isLgUp && w < 380
  const margin = useMemo(() => {
    if (isLgUp) {
      const sideCap = w > 520 ? 92 : w > 400 ? 82 : 74
      const side = Math.max(50, Math.min(sideCap, Math.round(w * 0.19)))
      const vert = 8
      return { top: vert, right: side, bottom: vert, left: side }
    }
    const side = Math.max(narrowMobile ? 58 : 52, Math.min(100, Math.round(w * 0.2)))
    const vert = narrowMobile ? 16 : 22
    return { top: vert, right: side, bottom: vert, left: side }
  }, [isLgUp, narrowMobile, w])

  const calloutLayout = useMemo(() => {
    if (isLgUp) {
      return {
        radialExtra: w >= 420 ? 13 : 11,
        horizontalStub: w >= 420 ? 16 : 14,
        textNudge: w >= 420 ? 7 : 6,
        fontSize: w >= 420 ? 12 : 11.25,
        outerRadius: '76%' as const,
      }
    }
    if (narrowMobile) {
      return {
        radialExtra: 10,
        horizontalStub: 11,
        textNudge: 5,
        fontSize: 10.5,
        outerRadius: '68%' as const,
      }
    }
    if (w < 480) {
      return {
        radialExtra: 12,
        horizontalStub: 14,
        textNudge: 6,
        fontSize: 11.5,
        outerRadius: '70%' as const,
      }
    }
    return {
      radialExtra: 14,
      horizontalStub: 18,
      textNudge: 7,
      fontSize: 12.5,
      outerRadius: '72%' as const,
    }
  }, [isLgUp, narrowMobile, w])

  const ariaSummary = useMemo(
    () =>
      chartRows
        .map((row) => {
          const pct = total > 0 ? Math.round((row.value / total) * 100) : 0
          return `${row.name} ${pct}%`
        })
        .join(', '),
    [chartRows, total],
  )

  const renderCallout = (props: PieCalloutPayload) => (
    <PieCalloutGroup
      {...props}
      total={total}
      radialExtra={calloutLayout.radialExtra}
      horizontalStub={calloutLayout.horizontalStub}
      textNudge={calloutLayout.textNudge}
      fontSize={calloutLayout.fontSize}
    />
  )

  return (
    <div
      ref={rootRef}
      data-assinaturas-chart
      className={cn('w-full', className)}
    >
      <p className="sr-only" role="status">
        Distribuição de assinaturas ativas por plano: {ariaSummary}.
      </p>

      <div
        ref={chartBoxRef}
        className={cn(
          'relative mx-auto aspect-square w-full min-h-[260px] max-w-[min(100%,440px)] sm:min-h-[280px]',
          'lg:max-w-none lg:min-h-0 lg:aspect-auto lg:h-[248px] lg:shrink-0 xl:h-[254px]',
          !isLgUp && isCoarsePointer && 'cursor-pointer [&_.recharts-layer.recharts-pie]:cursor-pointer',
        )}
      >
        <ChartContainer
          config={chartConfig}
          className={cn(
            'aspect-square !size-full h-full w-full touch-manipulation overflow-visible [&_.recharts-surface]:overflow-visible [&_[data-slot=chart]]:justify-center',
            'lg:aspect-auto lg:min-h-0 lg:!h-full lg:!w-full',
          )}
        >
          <PieChart margin={margin}>
            <Pie
              data={chartRows}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={calloutLayout.outerRadius}
              paddingAngle={1.8}
              cornerRadius={6}
              stroke="var(--background)"
              strokeWidth={2.5}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
              labelLine={false}
              label={renderCallout}
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
      </div>

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
  )
}
