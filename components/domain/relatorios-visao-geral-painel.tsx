'use client'

import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarRange,
  Check,
  ChevronRight,
  Download,
  Lock,
  Minus,
  RefreshCw,
  Scissors,
  Ticket,
  TrendingUp,
  UserRound,
  Users,
  UserX,
} from 'lucide-react'
import { addDays, format, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageContent } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserSafe } from '@/lib/supabase/get-auth-user-safe'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import {
  intervaloAnteriorComparacao,
  intervaloPorPreset,
  textoComparativoKpi,
  toLocalDateKey,
  type RelatorioPeriodoPreset,
} from '@/lib/relatorios-range'
import {
  computeMixServicos,
  computeRankingBarbeiros,
  computeVisaoGeralMetrics,
  fetchNovosClientesNoPeriodo,
  fetchVisaoGeralAgendamentosDetalhe,
  fetchVisaoGeralAgendaStatuses,
  mediaFaturamentoPorDiaSemana,
  pctChange,
  taxaNoShowPct,
  taxaRetornoClientes,
  type VisaoGeralAgendamentoDetalhe,
  type VisaoGeralMixSlice,
} from '@/lib/relatorios-visao-geral-data'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
const PRESET_OPTIONS: { id: RelatorioPeriodoPreset; label: string }[] = [
  { id: '7d', label: 'Últimos 7 dias' },
  { id: '30d', label: 'Últimos 30 dias' },
  { id: 'mes', label: 'Este mês' },
  { id: 'mes_anterior', label: 'Mês anterior' },
]

const chartConfig = {
  fat: { label: 'Faturamento', color: 'var(--accent-faturamento)' },
} satisfies ChartConfig

const pieConfig = {
  valor: { label: 'Faturamento' },
} satisfies ChartConfig

/** Delta percentual; `invert` = queda no valor é positivo (ex.: no-show). */
function DeltaBadge({
  pct,
  comparar,
  invert = false,
}: {
  pct: number | null
  comparar: boolean
  invert?: boolean
}) {
  if (!comparar || pct == null || !Number.isFinite(pct)) {
    return (
      <span className="vg-small inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 font-medium text-muted-foreground">
        <Minus className="size-3" aria-hidden />
        estável
      </span>
    )
  }
  if (Math.abs(pct) < 0.05) {
    return (
      <span className="vg-small inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 font-medium text-muted-foreground">
        <Minus className="size-3" aria-hidden />
        estável
      </span>
    )
  }
  const rawPositive = pct > 0
  const good = invert ? !rawPositive : rawPositive
  const Icon = rawPositive ? ArrowUpRight : ArrowDownRight
  const cls = good
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
    : 'bg-amber-500/15 text-amber-800 dark:text-amber-400'

  return (
    <span
      className={cn(
        'vg-small inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold tabular-nums',
        cls,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {rawPositive ? '+' : ''}
      {pct.toFixed(1).replace('.', ',')}%
    </span>
  )
}

function MergedMetricRow(props: {
  icon: React.ReactNode
  iconClass: string
  label: string
  value: string
  delta: number | null
  invertDelta?: boolean
  loading: boolean
}) {
  const { icon, iconClass, label, value, delta, invertDelta, loading } = props
  return (
    <div className="flex gap-4 bg-[var(--bg-card)] px-4 py-4 first:rounded-t-2xl last:rounded-b-2xl">
      <div
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl [&>svg]:size-5',
          iconClass,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="vg-small font-medium text-[var(--text-tertiary)]">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-32" />
        ) : (
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="vg-section tabular-nums text-[var(--text-primary)]">
              {value}
            </span>
            <DeltaBadge pct={delta} comparar invert={invertDelta} />
          </div>
        )}
      </div>
    </div>
  )
}

function AnaliseCard(props: {
  icon: LucideIcon
  iconWrapperClass: string
  title: string
  children: React.ReactNode
}) {
  const { icon: Icon, iconWrapperClass, title, children } = props
  return (
    <article
      className={cn(
        'w-full rounded-2xl bg-[var(--bg-card)] p-6 md:p-7',
        'shadow-[var(--vg-card-shadow)]',
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl [&>svg]:size-5',
            iconWrapperClass,
          )}
        >
          <Icon aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="vg-section text-[var(--text-primary)]">{title}</h3>
          <div className="mt-3 space-y-3 vg-body text-[var(--text-secondary)] [&_strong]:font-semibold [&_strong]:text-[var(--text-primary)] [&_strong]:tabular-nums">
            {children}
          </div>
        </div>
      </div>
    </article>
  )
}

function MixDonut({ mix }: { mix: VisaoGeralMixSlice[] }) {
  const data = mix.map((m) => ({ name: m.nome, value: m.valor, fill: m.fill }))
  const total = data.reduce((s, d) => s + d.value, 0)

  if (!data.length) {
    return (
      <div className="vg-body flex h-[200px] items-center justify-center text-[var(--text-secondary)]">
        Sem dados de serviços no período
      </div>
    )
  }

  return (
    <ChartContainer config={pieConfig} className="mx-auto aspect-square h-[200px] max-w-[220px]">
      <PieChart>
        <ChartTooltip
          content={({ active, payload }) =>
            active && payload?.[0] ? (
              <div className="vg-small rounded-lg border bg-popover px-2 py-1.5 shadow-md">
                <span className="font-medium">{String(payload[0].name)}</span>
                <span className="ml-2 tabular-nums text-muted-foreground">
                  {((Number(payload[0].value) / Math.max(1, total)) * 100).toFixed(1).replace('.', ',')}%
                </span>
              </div>
            ) : null
          }
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={58}
          outerRadius={88}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={mix[i]?.fill ?? entry.fill} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

export function RelatoriosVisaoGeralPainel(props: { slug: string; base: string }) {
  const { slug, base } = props
  const chartGradId = useId().replace(/:/g, '')

  const [preset, setPreset] = useState<RelatorioPeriodoPreset>('30d')
  const [barbeiroId, setBarbeiroId] = useState<string | null>(null)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [barberOpen, setBarberOpen] = useState(false)

  const [unidadeNome, setUnidadeNome] = useState<string | null>(null)
  const [operacaoLiberada, setOperacaoLiberada] = useState(true)
  const [barbeiros, setBarbeiros] = useState<{ id: string; nome: string }[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [detAtual, setDetAtual] = useState<VisaoGeralAgendamentoDetalhe[]>([])
  const [detAnterior, setDetAnterior] = useState<VisaoGeralAgendamentoDetalhe[]>([])
  const [statusAtual, setStatusAtual] = useState<string[]>([])
  const [statusAnterior, setStatusAnterior] = useState<string[]>([])
  const [atual, setAtual] = useState<ReturnType<typeof computeVisaoGeralMetrics> | null>(null)
  const [anterior, setAnterior] = useState<ReturnType<typeof computeVisaoGeralMetrics> | null>(null)
  const [novosAtual, setNovosAtual] = useState(0)
  const [novosAnterior, setNovosAnterior] = useState(0)

  const intervaloAtual = useMemo(() => intervaloPorPreset(preset, null, null), [preset])

  const load = useCallback(async () => {
    const supabase = createClient()
    setError(null)
    setLoading(true)

    const user = await getAuthUserSafe(supabase)
    if (!user) {
      setError('Usuário não autenticado')
      setLoading(false)
      return
    }

    const resolved = await resolveAdminBarbeariaId(supabase, user.id, { slug })
    if (!resolved) {
      setError('Barbearia não encontrada')
      setLoading(false)
      return
    }

    const { data: barRow } = await supabase
      .from('barbearias')
      .select('id, nome, status_cadastro')
      .eq('id', resolved)
      .single()

    if (!barRow) {
      setError('Barbearia não encontrada')
      setLoading(false)
      return
    }

    setUnidadeNome(typeof barRow.nome === 'string' ? barRow.nome : null)
    const liberada = barRow.status_cadastro !== 'pagamento_pendente'
    setOperacaoLiberada(liberada)

    const { data: barbeirosRows } = await supabase
      .from('barbeiros')
      .select('id, nome')
      .eq('barbearia_id', barRow.id)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    setBarbeiros(
      (barbeirosRows ?? [])
        .filter((b): b is { id: string; nome: string } => typeof b.id === 'string')
        .map((b) => ({ id: b.id, nome: String(b.nome ?? 'Profissional') })),
    )

    if (!liberada) {
      setDetAtual([])
      setDetAnterior([])
      setAtual(null)
      setAnterior(null)
      setNovosAtual(0)
      setNovosAnterior(0)
      setLoading(false)
      return
    }

    const ini = intervaloPorPreset(preset, null, null)
    const prev = intervaloAnteriorComparacao(ini.inicio, ini.fim)
    const i0 = toLocalDateKey(startOfDay(ini.inicio))
    const i1 = toLocalDateKey(startOfDay(ini.fim))
    const p0 = toLocalDateKey(startOfDay(prev.inicio))
    const p1 = toLocalDateKey(startOfDay(prev.fim))

    const iniIso = startOfDay(ini.inicio).toISOString()
    const fimExcIso = addDays(startOfDay(ini.fim), 1).toISOString()
    const prevIniIso = startOfDay(prev.inicio).toISOString()
    const prevFimExcIso = addDays(startOfDay(prev.fim), 1).toISOString()

    try {
      const [rowsA, rowsP, stA, stP, nA, nP] = await Promise.all([
        fetchVisaoGeralAgendamentosDetalhe(supabase, barRow.id, i0, i1, barbeiroId),
        fetchVisaoGeralAgendamentosDetalhe(supabase, barRow.id, p0, p1, barbeiroId),
        fetchVisaoGeralAgendaStatuses(supabase, barRow.id, i0, i1, barbeiroId),
        fetchVisaoGeralAgendaStatuses(supabase, barRow.id, p0, p1, barbeiroId),
        fetchNovosClientesNoPeriodo(supabase, barRow.id, iniIso, fimExcIso),
        fetchNovosClientesNoPeriodo(supabase, barRow.id, prevIniIso, prevFimExcIso),
      ])

      setDetAtual(rowsA)
      setDetAnterior(rowsP)
      setStatusAtual(stA)
      setStatusAnterior(stP)
      setAtual(computeVisaoGeralMetrics(rowsA, ini.inicio, ini.fim))
      setAnterior(computeVisaoGeralMetrics(rowsP, prev.inicio, prev.fim))
      setNovosAtual(nA)
      setNovosAnterior(nP)
    } catch {
      setError('Não foi possível carregar os relatórios')
      setDetAtual([])
      setDetAnterior([])
      setAtual(null)
      setAnterior(null)
    } finally {
      setLoading(false)
    }
  }, [slug, preset, barbeiroId])

  useEffect(() => {
    void load()
  }, [load])

  const comparar = true
  const textoCmp = textoComparativoKpi(intervaloAtual.inicio, intervaloAtual.fim)

  const pctFat = pctChange(atual?.faturamentoTotal ?? 0, anterior?.faturamentoTotal ?? 0)
  const pctLucro = pctChange(atual?.lucroLiquidoRecebido ?? 0, anterior?.lucroLiquidoRecebido ?? 0)
  const pctTicket = pctChange(atual?.ticketMedio ?? 0, anterior?.ticketMedio ?? 0)
  const pctCli = pctChange(atual?.clientesUnicos ?? 0, anterior?.clientesUnicos ?? 0)

  const retornoAtual = useMemo(() => taxaRetornoClientes(detAtual), [detAtual])
  const retornoAnt = useMemo(() => taxaRetornoClientes(detAnterior), [detAnterior])
  const pctRetorno = pctChange(retornoAtual, retornoAnt)

  const noShowAtual = useMemo(() => taxaNoShowPct(statusAtual), [statusAtual])
  const noShowAnt = useMemo(() => taxaNoShowPct(statusAnterior), [statusAnterior])
  const pctNoShow = pctChange(noShowAtual, noShowAnt)

  const mix = useMemo(() => computeMixServicos(detAtual), [detAtual])
  const ranking = useMemo(
    () => computeRankingBarbeiros(detAtual, detAnterior, 5),
    [detAtual, detAnterior],
  )

  const weekdayStats = useMemo(
    () => mediaFaturamentoPorDiaSemana(detAtual, intervaloAtual.inicio, intervaloAtual.fim),
    [detAtual, intervaloAtual.inicio, intervaloAtual.fim],
  )

  const melhorDia = useMemo(() => {
    if (!weekdayStats.length) return null
    const withData = weekdayStats.filter((w) => w.total > 0)
    const mediaGeral =
      withData.length > 0
        ? withData.reduce((s, w) => s + w.mediaDiaria, 0) / withData.length
        : 0
    const best = [...weekdayStats].sort((a, b) => b.mediaDiaria - a.mediaDiaria)[0]
    if (!best || best.mediaDiaria <= 0) return null
    const vs = mediaGeral > 0 ? ((best.mediaDiaria - mediaGeral) / mediaGeral) * 100 : 0
    return { ...best, vsMedia: vs, mediaGeral }
  }, [weekdayStats])

  const sharePago =
    atual && atual.faturamentoTotal > 0
      ? (atual.lucroLiquidoRecebido / atual.faturamentoTotal) * 100
      : 0

  const topMix = mix[0]

  const periodLabel = PRESET_OPTIONS.find((o) => o.id === preset)?.label ?? 'Período'
  const barberLabel = barbeiroId
    ? barbeiros.find((b) => b.id === barbeiroId)?.nome ?? 'Barbeiro'
    : 'Todos os barbeiros'
  const unitLabel = unidadeNome ?? 'Unidade'

  const exportCsv = () => {
    if (!atual) return
    const header = 'data;faturamento;atendimentos\n'
    const body = atual.serieDiaria
      .map((d) => `${d.data};${d.faturamento.toFixed(2)};${d.atendimentos}`)
      .join('\n')
    const blob = new Blob([`\ufeff${header}${body}`], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `visao-geral-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const maxRankFat = ranking[0]?.faturamento ?? 1

  if (error) {
    return (
      <PageContent className="pb-10 pt-2">
        <Empty className="mx-auto max-w-md border border-dashed border-border/60 bg-card/30 py-10">
          <EmptyHeader>
            <EmptyTitle>Algo deu errado</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </PageContent>
    )
  }

  if (!operacaoLiberada) {
    return (
      <PageContent className="pb-10 pt-2">
        <Empty className="mx-auto max-w-md border border-dashed border-border/60 bg-card/30 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Lock className="size-6" aria-hidden />
            </EmptyMedia>
            <EmptyTitle>Relatórios indisponíveis</EmptyTitle>
            <EmptyDescription>
              Regularize sua assinatura para acessar métricas e exportações.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </PageContent>
    )
  }

  return (
    <PageContent className="visao-geral-premium space-y-10 bg-[var(--bg-page)] pb-14 pt-2">
      <header className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-[2rem] font-semibold tracking-[-0.025em] text-[var(--text-primary)] md:text-[2.125rem] md:leading-tight">
              Visão Geral
            </h1>
            <p className="vg-body max-w-2xl text-[var(--text-secondary)]">
              {periodLabel}
              <span className="mx-1.5 text-border">·</span>
              {barberLabel}
              <span className="mx-1.5 text-border">·</span>
              Todas as unidades
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'group vg-body inline-flex items-center gap-1 rounded-full border border-transparent bg-[var(--bg-elevated)] px-3 py-1.5 font-medium text-[var(--text-primary)] shadow-sm transition-colors',
                    'hover:brightness-[0.98] dark:hover:brightness-110',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <CalendarRange className="size-3.5 text-[var(--text-tertiary)]" aria-hidden />
                  {periodLabel}
                  <ChevronRight className="size-3.5 text-[var(--text-tertiary)] transition group-data-[state=open]:rotate-90" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1" align="end">
                <div className="flex flex-col gap-0.5">
                  {PRESET_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setPreset(o.id)
                        setPeriodOpen(false)
                      }}
                      className={cn(
                        'vg-body flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-colors',
                        preset === o.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/80',
                      )}
                    >
                      {o.label}
                      {preset === o.id ? <Check className="size-4 shrink-0 opacity-70" /> : null}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={barberOpen} onOpenChange={setBarberOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'group vg-body inline-flex items-center gap-1 rounded-full border border-transparent bg-[var(--bg-elevated)] px-3 py-1.5 font-medium text-[var(--text-primary)] shadow-sm transition-colors',
                    'hover:brightness-[0.98] dark:hover:brightness-110',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <UserRound className="size-3.5 text-[var(--text-tertiary)]" aria-hidden />
                  {barberLabel}
                  <ChevronRight className="size-3.5 text-[var(--text-tertiary)] transition group-data-[state=open]:rotate-90" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-1" align="end">
                <div className="max-h-64 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setBarbeiroId(null)
                      setBarberOpen(false)
                    }}
                    className={cn(
                      'vg-body flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-colors',
                      barbeiroId === null ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/80',
                    )}
                  >
                    Todos os barbeiros
                    {barbeiroId === null ? <Check className="size-4 shrink-0 opacity-70" /> : null}
                  </button>
                  {barbeiros.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setBarbeiroId(b.id)
                        setBarberOpen(false)
                      }}
                      className={cn(
                        'vg-body flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-colors',
                        barbeiroId === b.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/80',
                      )}
                    >
                      <span className="truncate">{b.nome}</span>
                      {barbeiroId === b.id ? <Check className="size-4 shrink-0 opacity-70" /> : null}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <span
              className="vg-body inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 text-[var(--text-secondary)]"
              title={unidadeNome ? `Unidade: ${unidadeNome}` : undefined}
            >
              <Building2 className="size-3.5 shrink-0 opacity-70" aria-hidden />
              {unitLabel}
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground"
              disabled={!atual || loading}
              onClick={exportCsv}
              aria-label="Exportar CSV"
            >
              <Download className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero faturamento — largura total */}
      <section
        className={cn(
          'rounded-3xl bg-[var(--bg-card)] p-6 sm:p-8',
          'shadow-[var(--vg-card-shadow)]',
        )}
      >
        {loading && !atual ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-xl" />
            <Skeleton className="h-[240px] w-full rounded-2xl" />
          </div>
        ) : atual ? (
          <>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="vg-small font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Faturamento total
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-3">
                  <span className="vg-display tabular-nums text-[var(--text-primary)]">
                    {formatCurrency(atual.faturamentoTotal)}
                  </span>
                  <DeltaBadge pct={pctFat} comparar={comparar} />
                </div>
              </div>
              <div className="text-left lg:max-w-sm lg:shrink-0 lg:text-right">
                <p className="vg-small font-medium uppercase tracking-wider text-[var(--accent-lucro)]">
                  Lucro líquido
                </p>
                <p className="vg-small mt-0.5 text-[var(--text-tertiary)]">Pagamentos confirmados</p>
                <div className="mt-2 flex flex-wrap items-baseline justify-start gap-2 lg:justify-end">
                  <span className="vg-section tabular-nums text-[var(--text-primary)]">
                    {formatCurrency(atual.lucroLiquidoRecebido)}
                  </span>
                  <DeltaBadge pct={pctLucro} comparar={comparar} />
                </div>
                <p className="vg-small mt-2 text-[var(--text-secondary)]">
                  {sharePago >= 0.01 ? (
                    <>
                      <span className="font-medium text-[var(--text-primary)]">
                        {sharePago.toFixed(0).replace('.', ',')}%
                      </span>{' '}
                      do faturamento · {formatCurrency(anterior?.faturamentoTotal ?? 0)} no período anterior
                    </>
                  ) : (
                    <>Sem pagamentos confirmados neste recorte.</>
                  )}
                </p>
              </div>
            </div>

            <div className="my-6 h-px w-full bg-stone-200/90 dark:bg-stone-600/60" />

            <div className="h-[220px] w-full sm:h-[280px]">
              <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                <AreaChart
                  data={atual.serieDiaria}
                  margin={{ left: 0, right: 8, top: 12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={`fat-fill-${chartGradId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#86efac" stopOpacity={0.55} />
                      <stop offset="45%" stopColor="#bbf7d0" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#bbf7d0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/35" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    interval="preserveStartEnd"
                    minTickGap={28}
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                  />
                  <YAxis hide domain={[0, 'auto']} />
                  <ChartTooltip
                    cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(Number(value))}
                        labelFormatter={(_, payload) => {
                          const p = payload?.[0]?.payload as { data?: string } | undefined
                          if (!p?.data) return ''
                          return format(new Date(`${p.data}T12:00:00`), "d 'de' MMM", { locale: ptBR })
                        }}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="faturamento"
                    stroke="var(--accent-faturamento)"
                    strokeWidth={2}
                    fill={`url(#fat-fill-${chartGradId})`}
                    dot={false}
                    activeDot={{
                      r: 4,
                      fill: 'var(--accent-faturamento)',
                      stroke: 'var(--bg-card)',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </>
        ) : null}
      </section>

      {/* Bicolumna: métricas + mix */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="vg-section mb-3 text-[var(--text-primary)]">Métricas chave</h2>
          <div className="overflow-hidden rounded-2xl shadow-[var(--vg-card-shadow)] ring-1 ring-stone-200/80 divide-y divide-stone-200/80 dark:ring-stone-600/60 dark:divide-stone-600/60">
            <MergedMetricRow
              icon={<Ticket />}
              iconClass="bg-[var(--accent-ticket)]/15 text-[var(--accent-ticket)]"
              label="Ticket médio"
              value={atual ? formatCurrency(atual.ticketMedio) : '—'}
              delta={pctTicket}
              loading={loading && !atual}
            />
            <MergedMetricRow
              icon={<Users />}
              iconClass="bg-[var(--accent-atendidos)]/15 text-[var(--accent-atendidos)]"
              label="Clientes atendidos"
              value={atual ? String(atual.clientesUnicos) : '—'}
              delta={pctCli}
              loading={loading && !atual}
            />
            <MergedMetricRow
              icon={<RefreshCw />}
              iconClass="bg-[var(--accent-retorno)]/15 text-[var(--accent-retorno)]"
              label="Taxa de retorno"
              value={loading && !atual ? '—' : `${retornoAtual.toFixed(1).replace('.', ',')}%`}
              delta={pctRetorno}
              loading={loading && !atual}
            />
            <MergedMetricRow
              icon={<UserX />}
              iconClass="bg-[var(--accent-noshow)]/15 text-[var(--accent-noshow)]"
              label="Taxa de no-show"
              value={loading && !atual ? '—' : `${noShowAtual.toFixed(1).replace('.', ',')}%`}
              delta={pctNoShow}
              invertDelta
              loading={loading && !atual}
            />
          </div>
        </div>

        <div>
          <h2 className="vg-section mb-3 text-[var(--text-primary)]">Mix de serviços</h2>
          <div
            className={cn(
              'rounded-2xl bg-[var(--bg-card)] p-5 shadow-[var(--vg-card-shadow)] ring-1 ring-stone-200/80 dark:ring-stone-600/60',
            )}
          >
            <MixDonut mix={mix} />
            <div className="mt-4 space-y-4">
              {mix.map((m) => (
                <div key={m.id} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-3 gap-y-1">
                  <span className="vg-body font-semibold tabular-nums text-[var(--text-primary)]">
                    {m.pct.toFixed(1).replace('.', ',')}%
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, m.pct)}%`, backgroundColor: m.fill }}
                        />
                      </div>
                    </div>
                    <p className="vg-body mt-1 truncate text-[var(--text-secondary)]">{m.nome}</p>
                  </div>
                  <span className="vg-body font-medium tabular-nums text-[var(--text-primary)]">
                    {formatCurrency(m.valor)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top barbeiros */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-4 border-b border-stone-200/80 pb-3 dark:border-stone-600/60">
          <h2 className="vg-section text-[var(--text-primary)]">Top barbeiros</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading && ranking.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-[140px] shrink-0 rounded-2xl" />
            ))
          ) : ranking.length === 0 ? (
            <p className="vg-body py-8 text-muted-foreground">Nenhum faturamento por profissional neste período.</p>
          ) : (
            ranking.map((r) => {
              const iniciais = r.nome
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase()
              const barW = maxRankFat > 0 ? (r.faturamento / maxRankFat) * 100 : 0
              return (
                <div
                  key={r.barbeiroId}
                  className={cn(
                    'flex w-[148px] shrink-0 flex-col items-center rounded-2xl bg-[var(--bg-card)] px-3 py-4 text-center',
                    'shadow-[var(--vg-card-shadow)] ring-1 ring-stone-200/70 transition-all duration-200 dark:ring-stone-600/50',
                    'hover:-translate-y-0.5 hover:shadow-md hover:ring-stone-300/90 dark:hover:ring-stone-500/70',
                  )}
                >
                  <Avatar className="size-12 border border-border/50">
                    <AvatarFallback className="vg-small font-medium">{iniciais || '?'}</AvatarFallback>
                  </Avatar>
                  <p className="vg-body mt-3 line-clamp-2 min-h-[2.5rem] font-medium text-[var(--text-primary)]">
                    {r.nome}
                  </p>
                  <p className="vg-section mt-2 tabular-nums text-[var(--text-primary)]">
                    {formatCurrency(r.faturamento)}
                  </p>
                  <DeltaBadge pct={r.pctVsAnterior} comparar={comparar} />
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className="h-full rounded-full bg-[var(--brand-primary)] transition-all"
                      style={{ width: `${barW}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="mt-3">
          <Link
            href={`${base}/equipe`}
            className="vg-body font-medium text-[var(--brand-primary)] hover:underline"
          >
            Ver ranking completo →
          </Link>
        </div>
      </section>

      {/* Análises integradas — texto corrido, tom consultivo */}
      <section className="space-y-4">
        <h2 className="vg-section border-b border-stone-200/80 pb-3 text-[var(--text-primary)] dark:border-stone-600/60">
          Análises do período
        </h2>
        <div className="flex flex-col gap-4">
          <AnaliseCard
            icon={TrendingUp}
            iconWrapperClass="bg-[var(--accent-faturamento)]/15 text-[var(--accent-faturamento)]"
            title="Crescimento"
          >
            <p>
              {atual ? (
                <>
                  Neste recorte ({periodLabel.toLowerCase()}), o faturamento consolidado ficou em{' '}
                  <strong>{formatCurrency(atual.faturamentoTotal)}</strong>
                  {pctFat != null && Math.abs(pctFat) >= 0.05 ? (
                    <>
                      , ou seja, uma variação de{' '}
                      <strong>
                        {pctFat > 0 ? '+' : ''}
                        {pctFat.toFixed(1).replace('.', ',')}%
                      </strong>{' '}
                      {textoCmp} frente ao intervalo imediatamente anterior — útil para calibrar metas e campanhas
                      {pctFat > 0 ? ' enquanto o ritmo está favorável' : ' antes que o desvio se prolongue'}.
                    </>
                  ) : (
                    <>
                      , praticamente alinhado ao que você vinha vendo {textoCmp}, o que sugere estabilidade na base de
                      serviços.
                    </>
                  )}{' '}
                  O que já entrou com pagamento confirmado foi <strong>{formatCurrency(atual.lucroLiquidoRecebido)}</strong>
                  {pctLucro != null && Math.abs(pctLucro) >= 0.05 ? (
                    <>
                      {' '}
                      (<strong>
                        {pctLucro > 0 ? '+' : ''}
                        {pctLucro.toFixed(1).replace('.', ',')}%
                      </strong>{' '}
                      {textoCmp})
                    </>
                  ) : null}
                  {sharePago >= 0.01 ? (
                    <>
                      , representando cerca de <strong>{sharePago.toFixed(0).replace('.', ',')}%</strong> do total
                      faturado
                      {pctLucro != null && pctLucro > 0.05 && pctFat != null && pctFat > -0.05
                        ? '. Esse encaixe entre execução e caixa costuma indicar operação redonda; manter o olho nas pendências evita perder o ritmo.'
                        : pctLucro != null && pctLucro < -0.05
                          ? '. Se a diferença entre vendido e recebido continuar, uma revisão das cobranças costuma destravar caixa sem mexer na oferta.'
                          : '.'}
                    </>
                  ) : (
                    <>
                      . Neste recorte, quase nada entrou ainda como pagamento confirmado — vale cruzar com o financeiro
                      para entender se é timing ou inadimplência pontual.
                    </>
                  )}
                </>
              ) : (
                <>Assim que os números carregarem, esta leitura resume o pulso de receita e caixa do período.</>
              )}
            </p>
          </AnaliseCard>

          <AnaliseCard
            icon={Scissors}
            iconWrapperClass="bg-[var(--accent-ticket)]/15 text-[var(--accent-ticket)]"
            title="Serviço em destaque"
          >
            <p>
              {topMix && atual && atual.faturamentoTotal > 0 ? (
                <>
                  O <strong>{topMix.nome}</strong> aparece como o principal motor do mix, respondendo por cerca de{' '}
                  <strong>{topMix.pct.toFixed(1).replace('.', ',')}%</strong> do faturamento — algo em torno de{' '}
                  <strong>{formatCurrency(topMix.valor)}</strong> no período. Com uma taxa de retorno de clientes na casa
                  dos <strong>{retornoAtual.toFixed(1).replace('.', ',')}%</strong>, o cenário convida a reforçar
                  lembretes pós-atendimento e benefícios para quem volta: pequenos gestos costumam transformar picos de
                  demanda em hábito, sem depender só de promoção agressiva.
                </>
              ) : (
                <>
                  Quando houver volume suficiente de serviços distintos, este bloco destaca naturalmente onde a equipe mais
                  vende — e onde vale investir narrativa, tempo de cadeira ou combos complementares.
                </>
              )}
            </p>
          </AnaliseCard>

          <AnaliseCard
            icon={CalendarRange}
            iconWrapperClass="bg-[var(--accent-retorno)]/15 text-[var(--accent-retorno)]"
            title="Padrão sazonal"
          >
            <p>
              {melhorDia && melhorDia.mediaDiaria > 0 ? (
                <>
                  Os <strong>{melhorDia.label}s</strong> concentram uma média diária próxima de{' '}
                  <strong>{formatCurrency(melhorDia.mediaDiaria)}</strong>
                  {melhorDia.vsMedia > 5
                    ? `, perceptivelmente acima do ritmo médio dos outros dias da semana neste mesmo intervalo — um bom dia para priorizar a escala e evitar gargalos na recepção.`
                    : ', em linha com o restante da semana, o que ajuda a planejar escala com previsibilidade.'}{' '}
                  No comparecimento, a taxa de faltas ficou em <strong>
                    {noShowAtual.toFixed(1).replace('.', ',')}%
                  </strong>
                  {pctNoShow != null && pctNoShow < -0.05
                    ? `, com leve melhora de ${Math.abs(pctNoShow).toFixed(1).replace('.', ',')} p.p. ${textoCmp}; isso libera horário para aproveitar melhor os dias mais fortes sem sobrecarregar a agenda.`
                    : pctNoShow != null && pctNoShow > 0.05
                      ? `; o movimento piorou ${pctNoShow.toFixed(1).replace('.', ',')} p.p. ${textoCmp}, então reforçar confirmação — especialmente nesses picos — tende a pagar o esforço.`
                      : `, estável ${textoCmp}, o que mantém o foco na ocupação em si.`}
                </>
              ) : (
                <>
                  Com alguns ciclos completos de agenda, este trecho contrasta o ritmo por dia da semana e a disciplina de
                  comparecimento — útil para ajustar escala e comunicação com o cliente antes da próxima onda de demanda.
                </>
              )}
            </p>
          </AnaliseCard>
        </div>
      </section>
    </PageContent>
  )
}
