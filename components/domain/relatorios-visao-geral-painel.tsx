'use client'

import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CalendarRange,
  Check,
  ChevronRight,
  Download,
  Minus,
  UserRound,
} from 'lucide-react'
import { addDays, format, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageContent } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
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
  computeVisaoGeralMetrics,
  fetchNovosClientesNoPeriodo,
  fetchVisaoGeralAgendamentos,
  pctChange,
} from '@/lib/relatorios-visao-geral-data'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Lock } from 'lucide-react'

const PRESET_OPTIONS: { id: RelatorioPeriodoPreset; label: string }[] = [
  { id: '7d', label: 'Últimos 7 dias' },
  { id: '30d', label: 'Últimos 30 dias' },
  { id: 'mes', label: 'Este mês' },
  { id: 'mes_anterior', label: 'Mês anterior' },
]

const chartConfig = {
  fat: {
    label: 'Faturamento',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

function DeltaBadge({ pct, comparar }: { pct: number | null; comparar: boolean }) {
  if (!comparar || pct == null || !Number.isFinite(pct)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <Minus className="size-3" aria-hidden />
        estável
      </span>
    )
  }
  if (Math.abs(pct) < 0.05) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <Minus className="size-3" aria-hidden />
        estável
      </span>
    )
  }
  const up = pct > 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  const cls = up
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
    : 'bg-amber-500/15 text-amber-800 dark:text-amber-400'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
        cls,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {up ? '+' : ''}
      {pct.toFixed(1).replace('.', ',')}%
    </span>
  )
}

function InsightLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      <span className="text-foreground/90">{children}</span>
    </p>
  )
}

export function RelatoriosVisaoGeralPainel(props: { slug: string }) {
  const { slug } = props
  const chartGradId = useId().replace(/:/g, '')

  const [preset, setPreset] = useState<RelatorioPeriodoPreset>('30d')
  const [barbeiroId, setBarbeiroId] = useState<string | null>(null)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [barberOpen, setBarberOpen] = useState(false)

  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [unidadeNome, setUnidadeNome] = useState<string | null>(null)
  const [operacaoLiberada, setOperacaoLiberada] = useState(true)
  const [barbeiros, setBarbeiros] = useState<{ id: string; nome: string }[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [atual, setAtual] = useState<ReturnType<typeof computeVisaoGeralMetrics> | null>(null)
  const [anterior, setAnterior] = useState<ReturnType<typeof computeVisaoGeralMetrics> | null>(null)
  const [novosAtual, setNovosAtual] = useState(0)
  const [novosAnterior, setNovosAnterior] = useState(0)

  const intervaloAtual = useMemo(
    () => intervaloPorPreset(preset, null, null),
    [preset],
  )

  const intervaloPrev = useMemo(
    () => intervaloAnteriorComparacao(intervaloAtual.inicio, intervaloAtual.fim),
    [intervaloAtual.inicio, intervaloAtual.fim],
  )

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

    setBarbeariaId(barRow.id)
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
      const [rowsA, rowsP, nA, nP] = await Promise.all([
        fetchVisaoGeralAgendamentos(supabase, barRow.id, i0, i1, barbeiroId),
        fetchVisaoGeralAgendamentos(supabase, barRow.id, p0, p1, barbeiroId),
        fetchNovosClientesNoPeriodo(supabase, barRow.id, iniIso, fimExcIso),
        fetchNovosClientesNoPeriodo(supabase, barRow.id, prevIniIso, prevFimExcIso),
      ])

      setAtual(computeVisaoGeralMetrics(rowsA, ini.inicio, ini.fim))
      setAnterior(computeVisaoGeralMetrics(rowsP, prev.inicio, prev.fim))
      setNovosAtual(nA)
      setNovosAnterior(nP)
    } catch {
      setError('Não foi possível carregar os relatórios')
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
  const pctNovos = pctChange(novosAtual, novosAnterior)

  const sharePago =
    atual && atual.faturamentoTotal > 0
      ? (atual.lucroLiquidoRecebido / atual.faturamentoTotal) * 100
      : 0

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
    <PageContent className="space-y-8 pb-12 pt-2">
      {/* Header */}
      <header className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-[2rem] md:leading-tight">
              Visão Geral
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
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
                    'group inline-flex items-center gap-1 rounded-full border border-transparent bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors',
                    'hover:bg-muted/70 hover:shadow',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <CalendarRange className="size-3.5 text-muted-foreground" aria-hidden />
                  {periodLabel}
                  <ChevronRight className="size-3.5 text-muted-foreground transition group-data-[state=open]:rotate-90" />
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
                        'flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors',
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
                    'group inline-flex items-center gap-1 rounded-full border border-transparent bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors',
                    'hover:bg-muted/70 hover:shadow',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <UserRound className="size-3.5 text-muted-foreground" aria-hidden />
                  {barberLabel}
                  <ChevronRight className="size-3.5 text-muted-foreground transition group-data-[state=open]:rotate-90" />
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
                      'flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors',
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
                        'flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition-colors',
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
              className="inline-flex items-center gap-1 rounded-full bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground"
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

      {/* Asymmetric grid */}
      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        {/* Hero faturamento */}
        <section
          className={cn(
            'relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-muted/30 p-6 shadow-sm ring-1 ring-border/40',
            'transition-shadow hover:shadow-md lg:col-span-8',
          )}
        >
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-12 w-2/3" />
              <Skeleton className="h-[200px] w-full rounded-2xl" />
            </div>
          ) : atual ? (
            <>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Faturamento total
                  </p>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground sm:text-4xl">
                      {formatCurrency(atual.faturamentoTotal)}
                    </span>
                    <DeltaBadge pct={pctFat} comparar={comparar} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatCurrency(anterior?.faturamentoTotal ?? 0)} no período anterior
                    {pctFat != null && Math.abs(pctFat) >= 0.05 ? (
                      <span className="ml-1.5 tabular-nums">
                        ({pctFat >= 0 ? '+' : ''}
                        {pctFat.toFixed(1).replace('.', ',')}%)
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="mt-6 h-[220px] w-full sm:h-[260px]">
                <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                  <AreaChart data={atual.serieDiaria} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`fat-fill-${chartGradId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      interval="preserveStartEnd"
                      minTickGap={24}
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
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      fill={`url(#fat-fill-${chartGradId})`}
                      dot={false}
                      activeDot={{ r: 4, fill: 'var(--chart-1)', stroke: 'var(--background)', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>

              <InsightLine>
                {atual.faturamentoTotal >= (anterior?.faturamentoTotal ?? 0)
                  ? 'O ritmo de faturamento está alinhado ou acima do período de comparação — mantenha o foco em ocupação e ticket.'
                  : 'Faturamento abaixo do período anterior — vale revisar promoções, horários ociosos ou mix de serviços.'}
              </InsightLine>
            </>
          ) : null}
        </section>

        {/* Side stack */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <section
            className={cn(
              'rounded-2xl bg-card/80 p-5 shadow-sm ring-1 ring-border/35 transition-all hover:ring-border/55',
              'lg:min-h-[140px]',
            )}
          >
            {loading ? (
              <Skeleton className="h-24 w-full" />
            ) : atual ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Lucro líquido</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/90">Pagamentos confirmados no período</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl font-semibold tabular-nums tracking-tight">
                    {formatCurrency(atual.lucroLiquidoRecebido)}
                  </span>
                  <DeltaBadge pct={pctLucro} comparar={comparar} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {sharePago >= 0.01 ? (
                    <>
                      <span className="font-medium text-foreground/80">
                        {sharePago.toFixed(0).replace('.', ',')}%
                      </span>{' '}
                      do faturamento já entrou na conta ({textoCmp}).
                    </>
                  ) : (
                    <>Nenhum pagamento confirmado neste recorte — acompanhe o financeiro.</>
                  )}
                </p>
              </>
            ) : null}
          </section>

          <section
            className={cn(
              'rounded-2xl bg-muted/25 p-5 shadow-sm ring-1 ring-border/25 transition-all hover:bg-muted/35',
            )}
          >
            {loading ? (
              <Skeleton className="h-20 w-full" />
            ) : atual ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ticket médio</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl font-semibold tabular-nums">{formatCurrency(atual.ticketMedio)}</span>
                  <DeltaBadge pct={pctTicket} comparar={comparar} />
                </div>
                <InsightLine>
                  Média por atendimento concluído — subir ticket costuma refletir upsell ou serviços premium.
                </InsightLine>
              </>
            ) : null}
          </section>
        </div>

        {/* Bottom row — asymmetric */}
        <section
          className={cn(
            'rounded-2xl bg-card/60 p-5 shadow-sm ring-1 ring-border/30 lg:col-span-5',
            'hover:shadow-sm',
          )}
        >
          {loading ? (
            <Skeleton className="h-28 w-full" />
          ) : atual ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Clientes</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">{atual.clientesUnicos}</span>
                <span className="text-sm text-muted-foreground">únicos no período</span>
                <DeltaBadge pct={pctCli} comparar={comparar} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {atual.atendimentos} atendimentos concluídos
                {atual.atendimentos > 0 && atual.clientesUnicos > 0 ? (
                  <>
                    {' '}
                    · recorrência média{' '}
                    <span className="font-medium text-foreground/90">
                      {(atual.atendimentos / atual.clientesUnicos).toFixed(1).replace('.', ',')}
                    </span>
                  </>
                ) : null}
              </p>
            </>
          ) : null}
        </section>

        <section
          className={cn(
            'rounded-2xl bg-gradient-to-b from-muted/20 to-transparent p-5 ring-1 ring-border/25 lg:col-span-4',
          )}
        >
          {loading ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Novos clientes</p>
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">{novosAtual}</span>
                <DeltaBadge pct={pctNovos} comparar={comparar} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Cadastros no período · {novosAnterior} no período anterior
              </p>
            </>
          )}
        </section>

        <section
          className={cn(
            'flex flex-col justify-center rounded-2xl border border-dashed border-border/50 bg-muted/10 p-5 lg:col-span-3',
          )}
        >
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : atual ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Resumo rápido</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>
                  <span className="text-foreground/90">{atual.atendimentos}</span> concluídos
                </li>
                <li>
                  Ticket{' '}
                  <span className="font-medium text-foreground/90">{formatCurrency(atual.ticketMedio)}</span>
                </li>
                <li>
                  Confirmação financeira{' '}
                  <span className="font-medium text-foreground/90">
                    {sharePago.toFixed(0).replace('.', ',')}%
                  </span>
                </li>
              </ul>
            </>
          ) : null}
        </section>
      </div>
    </PageContent>
  )
}
