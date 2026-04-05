'use client'

import { useTheme } from 'next-themes'
import { useEffect, useId, useMemo, useState } from 'react'
import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
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

type SliceLabelProps = {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number | string
  outerRadius?: number | string
  percent?: number
  name?: string
  value?: number
}

function AssinaturasSliceLabel(props: SliceLabelProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, name, value } = props
  const { resolvedTheme } = useTheme()
  const [narrowViewport, setNarrowViewport] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 360px)')
    const update = () => setNarrowViewport(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

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
  const midR = inner + (outer - inner) * 0.52
  const x = cx + midR * Math.cos(-midAngle * RADIAN)
  const y = cy + midR * Math.sin(-midAngle * RADIAN)

  const pctRounded = Math.round((percent ?? 0) * 100)
  const isTinySlice = (percent ?? 0) < 0.12
  const isDark = resolvedTheme === 'dark'
  const displayName = name ?? ''
  const displayValue = value ?? 0

  const titleSize = narrowViewport ? 10 : isTinySlice ? 9 : 11
  const detailSize = narrowViewport ? 8.5 : 10

  const fill = isDark ? 'var(--foreground)' : '#ffffff'
  const stroke = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'

  const secondLine = isTinySlice
    ? `${pctRounded}%`
    : `${displayValue.toLocaleString('pt-BR')} · ${pctRounded}%`

  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      className="pointer-events-none select-none font-sans"
      fill={fill}
      stroke={stroke}
      strokeWidth={0.45}
      paintOrder="stroke fill"
      style={{ fontWeight: 600 }}
    >
      {!isTinySlice ? (
        <>
          <tspan x={x} dy={narrowViewport ? '-0.45em' : '-0.55em'} style={{ fontSize: titleSize }}>
            {displayName}
          </tspan>
          <tspan
            x={x}
            dy={narrowViewport ? '1.05em' : '1.15em'}
            style={{ fontSize: detailSize, fontWeight: 500, opacity: 0.92 }}
          >
            {secondLine}
          </tspan>
        </>
      ) : (
        <tspan x={x} style={{ fontSize: titleSize }}>
          {pctRounded}%
        </tspan>
      )}
    </text>
  )
}

export type SuperAssinaturasAtivasPieChartProps = {
  /** Default: mock até integração com API */
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
  const shadowFilterId = `assinaturas-pie-shadow-${rawId}`

  return (
    <ChartContainer
      config={chartConfig}
      className={className ?? 'aspect-auto mx-auto h-[200px] w-full max-w-[300px] sm:h-[260px] sm:max-w-[320px]'}
    >
      <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <defs>
          <filter
            id={shadowFilterId}
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
            colorInterpolationFilters="sRGB"
          >
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.14" />
          </filter>
        </defs>
        <ChartTooltip
          cursor={false}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const item = payload[0]
            const v = Number(item.value)
            const name = String(item.name ?? '')
            const pct = total > 0 ? Math.round((v / total) * 100) : 0
            return (
              <div className="border-border/50 bg-background grid min-w-[11rem] gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                <p className="leading-none font-medium">{name}</p>
                <div className="text-muted-foreground flex items-center justify-between gap-6 leading-none">
                  <span>Quantidade</span>
                  <span className="text-foreground font-mono font-medium tabular-nums">
                    {v.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="text-muted-foreground flex items-center justify-between gap-6 leading-none">
                  <span>Percentual</span>
                  <span className="text-foreground font-mono font-medium tabular-nums">{pct}%</span>
                </div>
              </div>
            )
          }}
        />
        <Pie
          data={chartRows}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius="42%"
          outerRadius="78%"
          paddingAngle={2.8}
          cornerRadius={5}
          stroke="var(--card)"
          strokeWidth={2.5}
          labelLine={false}
          style={{ filter: `url(#${shadowFilterId})` }}
          label={(props) => <AssinaturasSliceLabel {...props} />}
        >
          {chartRows.map((row) => (
            <Cell key={row.segment} fill={`var(--color-${row.segment})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
