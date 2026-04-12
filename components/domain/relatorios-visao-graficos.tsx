'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { eachDayOfInterval, endOfWeek, format, startOfDay, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/constants'
import { classificarServicoReceita } from '@/lib/relatorios-agregacao'
import { toLocalDateKey } from '@/lib/relatorios-range'
import { cn } from '@/lib/utils'
import type { Agendamento } from '@/types'

export type DiaFaturamentoSerie = {
  dataKey: string
  labelCurto: string
  servicos: number
  produtos: number
  total: number
}

function escalaCorOcupacao(count: number, max: number): string {
  if (max <= 0) return 'bg-muted/40 text-muted-foreground'
  const t = Math.min(1, count / max)
  if (count === 0) return 'bg-emerald-50/90 text-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-200'
  if (t < 0.25) return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
  if (t < 0.55) return 'bg-emerald-300/90 text-emerald-950 dark:bg-emerald-800/50 dark:text-emerald-50'
  if (t < 0.8) return 'bg-amber-300/95 text-amber-950 dark:bg-amber-800/55 dark:text-amber-50'
  return 'bg-amber-600 text-white dark:bg-amber-700'
}

function GraficoFaturamentoSvg({
  dias,
  onDiaClick,
}: {
  dias: DiaFaturamentoSerie[]
  onDiaClick: (dataKey: string) => void
}) {
  const [hover, setHover] = useState<number | null>(null)
  const w = 360
  const h = 140
  const padL = 36
  const padR = 8
  const padT = 12
  const padB = 28

  const { paths, maxY, pts } = useMemo(() => {
    const n = dias.length
    const maxY = Math.max(1, ...dias.map((d) => d.total))
    const innerW = w - padL - padR
    const x = (i: number) => {
      if (n <= 1) return padL + innerW / 2
      return padL + (i / (n - 1)) * innerW
    }
    const y = (v: number) => padT + (1 - v / maxY) * (h - padT - padB)

    const pt = (i: number, v: number) => `${x(i)},${y(v)}`
    const lineServ =
      n === 1
        ? `${pt(0, dias[0].servicos)} ${pt(0, dias[0].servicos)}`
        : dias.map((d, i) => pt(i, d.servicos)).join(' ')
    const lineProd =
      n === 1
        ? `${pt(0, dias[0].produtos)} ${pt(0, dias[0].produtos)}`
        : dias.map((d, i) => pt(i, d.produtos)).join(' ')
    const lineTot =
      n === 1 ? `${pt(0, dias[0].total)} ${pt(0, dias[0].total)}` : dias.map((d, i) => pt(i, d.total)).join(' ')

    const areaTot = (() => {
      if (n === 0) return ''
      const base = h - padB
      let d = `M ${x(0)} ${base} L ${x(0)} ${y(dias[0].total)}`
      for (let i = 1; i < n; i++) d += ` L ${x(i)} ${y(dias[i].total)}`
      d += ` L ${x(n - 1)} ${base} Z`
      return d
    })()

    return {
      paths: { lineServ, lineProd, areaTot, lineTot },
      maxY,
      pts: dias.map((d, i) => ({ i, x: x(i), y: y(d.total), d })),
    }
  }, [dias])

  if (dias.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sem dados no período.</p>
  }

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-[200px] w-full min-w-[280px] touch-manipulation"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="rel-fat-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.33, 0.66, 1].map((t) => {
          const yy = padT + t * (h - padT - padB)
          const val = maxY * (1 - t)
          return (
            <g key={t}>
              <line x1={padL} y1={yy} x2={w - padR} y2={yy} className="stroke-border/40" strokeWidth={0.5} />
              <text x={4} y={yy + 4} className="fill-muted-foreground text-[9px]">
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
              </text>
            </g>
          )
        })}
        <path d={paths.areaTot} fill="url(#rel-fat-area)" />
        <polyline
          fill="none"
          points={paths.lineTot}
          className="stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <polyline
          fill="none"
          points={paths.lineServ}
          className="stroke-sky-500 dark:stroke-sky-400"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <polyline
          fill="none"
          points={paths.lineProd}
          className="stroke-violet-500 dark:stroke-violet-400"
          strokeWidth={1.5}
          strokeDasharray="2 2"
        />
        {pts.map(({ i, x, y, d }) => (
          <g key={d.dataKey}>
            <circle
              cx={x}
              cy={y}
              r={hover === i ? 7 : 5}
              className="cursor-pointer fill-primary stroke-background"
              strokeWidth={2}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onDiaClick(d.dataKey)}
            />
            <title>
              {d.labelCurto}: Total {formatCurrency(d.total)} (Serviços {formatCurrency(d.servicos)} + Produtos{' '}
              {formatCurrency(d.produtos)}) — clique para detalhar
            </title>
          </g>
        ))}
        {dias.map((d, i) => {
          const innerW = w - padL - padR
          const xi =
            dias.length <= 1 ? padL + innerW / 2 : padL + (i / (dias.length - 1)) * innerW
          return (
            <text
              key={`lbl-${d.dataKey}`}
              x={xi}
              y={h - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[8px] sm:text-[9px]"
            >
              {d.labelCurto}
            </text>
          )
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-4 rounded-sm bg-primary/80" /> Total
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-0.5 w-4 bg-sky-500" /> Serviços (agend.)
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-0.5 w-4 bg-violet-500" /> Produtos (comandas)
        </span>
      </div>
    </div>
  )
}

function HeatmapCalendario({
  inicio,
  fim,
  contagemPorDia,
}: {
  inicio: Date
  fim: Date
  contagemPorDia: Map<string, number>
}) {
  const grid = useMemo(() => {
    const start = startOfWeek(inicio, { weekStartsOn: 1 })
    const end = endOfWeek(fim, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start, end })
    const max = Math.max(1, ...days.map((d) => contagemPorDia.get(toLocalDateKey(d)) ?? 0))
    return { days, max }
  }, [inicio, fim, contagemPorDia])

  const inicioKey = toLocalDateKey(inicio)
  const fimKey = toLocalDateKey(fim)

  return (
    <div className="w-full overflow-x-auto">
      <div className="grid w-max grid-cols-7 gap-1 pb-1 text-center text-[10px] font-medium text-muted-foreground">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid w-max grid-cols-7 gap-1">
        {grid.days.map((d) => {
          const key = toLocalDateKey(d)
          const dentro = key >= inicioKey && key <= fimKey
          const c = contagemPorDia.get(key) ?? 0
          const cls = dentro ? escalaCorOcupacao(c, grid.max) : 'bg-muted/25 text-muted-foreground/50 border border-dashed border-border/40'
          return (
            <div
              key={key}
              title={
                dentro
                  ? `${format(d, 'dd/MM/yyyy', { locale: ptBR })}: ${c} agendamento(s)`
                  : 'Fora do período filtrado'
              }
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-md text-[11px] font-semibold tabular-nums sm:h-10 sm:w-10',
                cls,
              )}
            >
              {format(d, 'd')}
            </div>
          )
        })}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Intensidade = volume de agendamentos no dia. Cinza tracejado = fora do período; célula vazia no período = sem
        agendamentos.
      </p>
    </div>
  )
}

function BarrasPicos8a22({
  contagemPorHora,
}: {
  contagemPorHora: number[]
}) {
  const slice = contagemPorHora.slice(8, 23)
  const max = Math.max(1, ...slice)
  const idxMax = slice.indexOf(Math.max(...slice))
  return (
    <div className="flex h-44 w-full items-end justify-between gap-0.5 sm:gap-1">
      {slice.map((v, i) => {
        const hora = i + 8
        const hPct = Math.max(6, (v / max) * 100)
        const destaque = i === idxMax && v > 0
        return (
          <div key={hora} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                'w-full max-w-[14px] rounded-t transition-colors',
                destaque ? 'bg-amber-500 dark:bg-amber-600' : 'bg-primary/65 dark:bg-primary/50',
              )}
              style={{ height: `${hPct}%` }}
              title={`${hora}h — ${v} agend.`}
            />
            <span className="text-[8px] text-muted-foreground tabular-nums">{hora}h</span>
          </div>
        )
      })}
    </div>
  )
}

const PIE_COLORS = {
  cortes: 'hsl(199 89% 48%)',
  barbas: 'hsl(142 71% 40%)',
  outros: 'hsl(262 83% 58%)',
  produtos: 'hsl(291 64% 42%)',
} as const

function PizzaMixReceita({
  fatias,
}: {
  fatias: { id: string; label: string; valor: number; color: string }[]
}) {
  const [isolado, setIsolado] = useState<string | null>(null)
  const total = fatias.reduce((s, f) => s + f.valor, 0)
  const r = 52
  const cx = 60
  const cy = 60

  const { paths } = useMemo(() => {
    if (total <= 0) return { paths: [] as { id: string; d: string; color: string }[] }
    let ang = -Math.PI / 2
    const out: { id: string; d: string; color: string }[] = []
    for (const f of fatias) {
      if (f.valor <= 0) continue
      const slice = (f.valor / total) * Math.PI * 2
      const x1 = cx + r * Math.cos(ang)
      const y1 = cy + r * Math.sin(ang)
      ang += slice
      const x2 = cx + r * Math.cos(ang)
      const y2 = cy + r * Math.sin(ang)
      const large = slice > Math.PI ? 1 : 0
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
      out.push({ id: f.id, d, color: f.color })
    }
    return { paths: out }
  }, [fatias, total])

  if (total <= 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Sem receita concluída no período.</p>
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-center sm:gap-6">
      <svg viewBox="0 0 120 120" className="h-40 w-40 shrink-0">
        {paths.map((p) => (
          <path
            key={p.id}
            d={p.d}
            fill={p.color}
            opacity={isolado && isolado !== p.id ? 0.35 : 1}
            className="cursor-pointer stroke-background transition-opacity"
            strokeWidth={1}
            onClick={() => setIsolado((cur) => (cur === p.id ? null : p.id))}
          />
        ))}
        <title>Clique numa fatia para isolar</title>
      </svg>
      <ul className="min-w-0 space-y-1.5 text-sm">
        {fatias.map((f) => {
          const pct = total > 0 ? (f.valor / total) * 100 : 0
          if (f.valor <= 0) return null
          return (
            <li key={f.id}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition-colors',
                  isolado === f.id ? 'bg-muted' : 'hover:bg-muted/60',
                )}
                onClick={() => setIsolado((cur) => (cur === f.id ? null : f.id))}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: f.color }} />
                <span className="min-w-0 flex-1 truncate font-medium">{f.label}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {pct.toFixed(0)}% · {formatCurrency(f.valor)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function RelatoriosVisaoGraficosInner({
  inicio,
  fim,
  agendamentosPeriodo,
  receitaProdutosPorDia,
}: {
  inicio: Date
  fim: Date
  agendamentosPeriodo: Agendamento[]
  receitaProdutosPorDia: Record<string, number>
}) {
  const [drillDia, setDrillDia] = useState<string | null>(null)

  const diasFaturamento = useMemo((): DiaFaturamentoSerie[] => {
    const days = eachDayOfInterval({ start: startOfDay(inicio), end: startOfDay(fim) })
    return days.map((d) => {
      const dataKey = toLocalDateKey(d)
      const servicos = agendamentosPeriodo
        .filter((a) => a.data === dataKey && a.status === 'concluido')
        .reduce((s, a) => s + (Number(a.valor) || 0), 0)
      const produtos = receitaProdutosPorDia[dataKey] ?? 0
      return {
        dataKey,
        labelCurto: format(d, 'EEE dd', { locale: ptBR }).replace('.', ''),
        servicos,
        produtos,
        total: servicos + produtos,
      }
    })
  }, [inicio, fim, agendamentosPeriodo, receitaProdutosPorDia])

  const contagemPorDia = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of agendamentosPeriodo) {
      const k = a.data
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }, [agendamentosPeriodo])

  const contagemPorHora = useMemo(() => {
    const h = new Array(24).fill(0)
    for (const a of agendamentosPeriodo) {
      const [hh] = a.horario.split(':').map(Number)
      if (Number.isFinite(hh)) h[hh] += 1
    }
    return h
  }, [agendamentosPeriodo])

  const fatiasPizza = useMemo(() => {
    let cortes = 0
    let barbas = 0
    let outros = 0
    for (const a of agendamentosPeriodo) {
      if (a.status !== 'concluido') continue
      const v = Number(a.valor) || 0
      const cat = classificarServicoReceita(a.servico?.nome)
      if (cat === 'cortes') cortes += v
      else if (cat === 'barbas') barbas += v
      else outros += v
    }
    const produtos = Object.values(receitaProdutosPorDia).reduce((s, x) => s + x, 0)
    return [
      { id: 'cortes', label: 'Cortes', valor: cortes, color: PIE_COLORS.cortes },
      { id: 'barbas', label: 'Barbas', valor: barbas, color: PIE_COLORS.barbas },
      { id: 'outros', label: 'Outros serviços', valor: outros, color: PIE_COLORS.outros },
      { id: 'produtos', label: 'Produtos (comandas)', valor: produtos, color: PIE_COLORS.produtos },
    ]
  }, [agendamentosPeriodo, receitaProdutosPorDia])

  const listaDrill = useMemo(() => {
    if (!drillDia) return []
    return agendamentosPeriodo
      .filter((a) => a.data === drillDia)
      .sort((a, b) => a.horario.localeCompare(b.horario))
  }, [drillDia, agendamentosPeriodo])

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Faturamento no período</CardTitle>
            <CardDescription>
              Área = total diário; linhas tracejadas = serviços (agendamentos concluídos) e produtos (comandas
              fechadas). Passe o mouse e clique no ponto para ver o dia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GraficoFaturamentoSvg dias={diasFaturamento} onDiaClick={(k) => setDrillDia(k)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mix de receita</CardTitle>
            <CardDescription>
              Estimativa por nome do serviço (cortes/barba) + produtos vendidos em comandas fechadas. Clique na fatia
              para isolar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PizzaMixReceita fatias={fatiasPizza} />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ocupação (calendário)</CardTitle>
            <CardDescription>Volume de agendamentos por dia — sem grade de folgas do salão.</CardDescription>
          </CardHeader>
          <CardContent>
            <HeatmapCalendario inicio={inicio} fim={fim} contagemPorDia={contagemPorDia} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Horários de pico</CardTitle>
            <CardDescription>8h às 22h — barra âmbar = horário com mais agendamentos no período</CardDescription>
          </CardHeader>
          <CardContent>
            <BarrasPicos8a22 contagemPorHora={contagemPorHora} />
          </CardContent>
        </Card>
      </div>

      <Dialog open={drillDia != null} onOpenChange={(o) => !o && setDrillDia(null)}>
        <DialogContent className="max-h-[85vh] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {drillDia
                ? `Agendamentos em ${format(new Date(`${drillDia}T12:00:00`), 'dd/MM/yyyy', { locale: ptBR })}`
                : ''}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[55vh] pr-3">
            <ul className="space-y-2 text-sm">
              {listaDrill.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 dark:bg-muted/10"
                >
                  <p className="font-medium">{a.horario.slice(0, 5)}</p>
                  <p className="text-muted-foreground">
                    {a.cliente?.nome ?? 'Cliente'} · {a.barbeiro?.nome ?? 'Profissional'}
                  </p>
                  <p className="text-xs text-muted-foreground">{a.servico?.nome ?? 'Serviço'}</p>
                  <p className="text-xs font-medium text-foreground">
                    {a.status} · {formatCurrency(Number(a.valor) || 0)}
                  </p>
                </li>
              ))}
              {listaDrill.length === 0 ? (
                <li className="text-muted-foreground">Nenhum agendamento neste dia.</li>
              ) : null}
            </ul>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Gráficos pesados só montam quando o bloco entra no viewport (performance). */
export function RelatoriosVisaoGraficos(props: {
  inicio: Date
  fim: Date
  agendamentosPeriodo: Agendamento[]
  receitaProdutosPorDia: Record<string, number>
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setVisible(true)
      },
      { rootMargin: '120px', threshold: 0.06 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={hostRef} className="space-y-4">
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <RelatoriosVisaoGraficosInner {...props} />
        </motion.div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2" aria-hidden>
          <Skeleton className="h-[min(280px,42vw)] w-full rounded-xl" />
          <Skeleton className="h-[min(280px,42vw)] w-full rounded-xl" />
          <Skeleton className="h-[min(220px,40vw)] w-full rounded-xl" />
          <Skeleton className="h-[min(220px,40vw)] w-full rounded-xl" />
        </div>
      )}
    </div>
  )
}
