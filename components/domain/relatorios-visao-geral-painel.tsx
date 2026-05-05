'use client'

import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'
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
  fat: { label: 'Faturamento', color: '#0ea5e9' },
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
  const rawPositive = pct > 0
  const good = invert ? !rawPositive : rawPositive
  const Icon = rawPositive ? ArrowUpRight : ArrowDownRight
  const cls = good
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
    <div className="flex gap-4 bg-card/80 px-4 py-4 first:rounded-t-2xl last:rounded-b-2xl">
      <div
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-xl [&>svg]:size-5',
          iconClass,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {loading ? (
          <Skeleton className="mt-2 h-8 w-32" />
        ) : (
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
              {value}
            </span>
            <DeltaBadge pct={delta} comparar invert={invertDelta} />
          </div>
        )}
      </div>
    </div>
  )
}

function MixDonut({ mix }: { mix: VisaoGeralMixSlice[] }) {
  const data = mix.map((m) => ({ name: m.nome, value: m.valor, fill: m.fill }))
  const total = data.reduce((s, d) => s + d.value, 0)

  if (!data.length) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
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
              <div className="rounded-lg border bg-popover px-2 py-1.5 text-xs shadow-md">
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

  const textoCrescimento =
    pctFat != null && pctFat > 0.05
      ? `Seu faturamento subiu ${pctFat.toFixed(1).replace('.', ',')}% ${textoCmp}.`
      : pctFat != null && pctFat < -0.05
        ? `Seu faturamento recuou ${Math.abs(pctFat).toFixed(1).replace('.', ',')}% ${textoCmp}.`
        : `O faturamento permanece estável ${textoCmp}.`

  const textoMotorLucro =
    pctLucro != null && Math.abs(pctLucro) >= 0.05
      ? pctLucro > 0
        ? ` O volume com pagamento confirmado variou ${pctLucro > 0 ? '+' : ''}${pctLucro.toFixed(1).replace('.', ',')}%, o que ajuda o fluxo de caixa.`
        : ` O recebido confirmado variou ${pctLucro.toFixed(1).replace('.', ',')}%; vale alinhar cobranças pendentes.`
      : ''

  const textoServico =
    topMix && atual && atual.faturamentoTotal > 0
      ? `${topMix.nome} responde por ${topMix.pct.toFixed(1).replace('.', ',')}% do faturamento (${formatCurrency(topMix.valor)}). Taxa de retorno de clientes em ${retornoAtual.toFixed(1).replace('.', ',')}% — programas de fidelidade podem amplificar recorrências neste mix.`
      : 'Cadastre serviços e conclua atendimentos para ver o mix aqui.'

  const textoSazonal =
    melhorDia && melhorDia.mediaDiaria > 0
      ? `${melhorDia.label} concentra média diária de ${formatCurrency(melhorDia.mediaDiaria)}${
          melhorDia.vsMedia > 5
            ? ` — cerca de ${melhorDia.vsMedia.toFixed(0).replace('.', ',')}% acima da média dos demais dias do período.`
            : '.'
        } A taxa de no-show está em ${noShowAtual.toFixed(1).replace('.', ',')}% (${
          pctNoShow != null && pctNoShow < -0.05
            ? `melhorou ${Math.abs(pctNoShow).toFixed(1).replace('.', ',')} p.p. ${textoCmp}`
            : pctNoShow != null && pctNoShow > 0.05
              ? `piorou ${pctNoShow.toFixed(1).replace('.', ',')} p.p. ${textoCmp}`
              : `estável ${textoCmp}`
        }).`
      : 'Com mais dados no período, o padrão por dia da semana aparece aqui.'

  return (
    <PageContent className="space-y-10 pb-14 pt-2">
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

      {/* Hero faturamento — largura total */}
      <section
        className={cn(
          'rounded-3xl bg-card/40 p-6 sm:p-8',
          'shadow-sm shadow-black/5 dark:shadow-black/20',
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
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Faturamento total
                </p>
                <div className="mt-2 flex flex-wrap items-baseline gap-3">
                  <span className="text-5xl font-semibold leading-none tracking-tight text-foreground sm:text-[3rem]">
                    {formatCurrency(atual.faturamentoTotal)}
                  </span>
                  <DeltaBadge pct={pctFat} comparar={comparar} />
                </div>
              </div>
              <div className="text-left lg:max-w-sm lg:shrink-0 lg:text-right">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Lucro líquido
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Pagamentos confirmados</p>
                <div className="mt-2 flex flex-wrap items-baseline justify-start gap-2 lg:justify-end">
                  <span className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                    {formatCurrency(atual.lucroLiquidoRecebido)}
                  </span>
                  <DeltaBadge pct={pctLucro} comparar={comparar} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {sharePago >= 0.01 ? (
                    <>
                      <span className="font-medium text-foreground/85">
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

            <div className="my-6 h-px w-full bg-border/60" />

            <div className="h-[220px] w-full sm:h-[280px]">
              <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                <AreaChart
                  data={atual.serieDiaria}
                  margin={{ left: 0, right: 8, top: 12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id={`fat-fill-${chartGradId}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7dd3fc" stopOpacity={0.5} />
                      <stop offset="55%" stopColor="#bae6fd" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#e0f2fe" stopOpacity={0} />
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
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
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
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fill={`url(#fat-fill-${chartGradId})`}
                    dot={false}
                    activeDot={{ r: 4, fill: '#0ea5e9', stroke: 'var(--background)', strokeWidth: 2 }}
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
          <h2 className="mb-3 text-sm font-semibold tracking-tight text-foreground">Métricas chave</h2>
          <div className="overflow-hidden rounded-2xl ring-1 ring-border/50 divide-y divide-border/60 shadow-sm">
            <MergedMetricRow
              icon={<Ticket className="text-sky-600 dark:text-sky-400" />}
              iconClass="bg-sky-500/15 text-sky-700 dark:text-sky-300"
              label="Ticket médio"
              value={atual ? formatCurrency(atual.ticketMedio) : '—'}
              delta={pctTicket}
              loading={loading && !atual}
            />
            <MergedMetricRow
              icon={<Users className="text-emerald-600 dark:text-emerald-400" />}
              iconClass="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              label="Clientes atendidos"
              value={atual ? String(atual.clientesUnicos) : '—'}
              delta={pctCli}
              loading={loading && !atual}
            />
            <MergedMetricRow
              icon={<RefreshCw className="text-amber-600 dark:text-amber-400" />}
              iconClass="bg-amber-500/15 text-amber-800 dark:text-amber-200"
              label="Taxa de retorno"
              value={loading && !atual ? '—' : `${retornoAtual.toFixed(1).replace('.', ',')}%`}
              delta={pctRetorno}
              loading={loading && !atual}
            />
            <MergedMetricRow
              icon={<UserX className="text-red-600 dark:text-red-400" />}
              iconClass="bg-red-500/15 text-red-700 dark:text-red-300"
              label="Taxa de no-show"
              value={loading && !atual ? '—' : `${noShowAtual.toFixed(1).replace('.', ',')}%`}
              delta={pctNoShow}
              invertDelta
              loading={loading && !atual}
            />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold tracking-tight text-foreground">Mix de serviços</h2>
          <div
            className={cn(
              'rounded-2xl bg-card/50 p-5 shadow-sm ring-1 ring-border/40',
            )}
          >
            <MixDonut mix={mix} />
            <div className="mt-4 space-y-4">
              {mix.map((m) => (
                <div key={m.id} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-3 gap-y-1">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {m.pct.toFixed(1).replace('.', ',')}%
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/80">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, m.pct)}%`, backgroundColor: m.fill }}
                        />
                      </div>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{m.nome}</p>
                  </div>
                  <span className="text-sm font-medium tabular-nums text-foreground">
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
        <div className="mb-4 flex items-end justify-between gap-4 border-b border-border/50 pb-3">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Top barbeiros</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {loading && ranking.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-[140px] shrink-0 rounded-2xl" />
            ))
          ) : ranking.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">Nenhum faturamento por profissional neste período.</p>
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
                    'flex w-[148px] shrink-0 flex-col items-center rounded-2xl bg-card/60 px-3 py-4 text-center',
                    'ring-1 ring-border/35 shadow-sm transition-all duration-200',
                    'hover:-translate-y-0.5 hover:shadow-md hover:ring-border/55',
                  )}
                >
                  <Avatar className="size-12 border border-border/50">
                    <AvatarFallback className="text-sm font-medium">{iniciais || '?'}</AvatarFallback>
                  </Avatar>
                  <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-tight text-foreground">
                    {r.nome}
                  </p>
                  <p className="mt-2 text-base font-semibold tabular-nums text-foreground">
                    {formatCurrency(r.faturamento)}
                  </p>
                  <DeltaBadge pct={r.pctVsAnterior} comparar={comparar} />
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/80 transition-all"
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
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver ranking completo →
          </Link>
        </div>
      </section>

      {/* Análises integradas */}
      <section>
        <h2 className="mb-4 border-b border-border/50 pb-3 text-base font-semibold tracking-tight text-foreground">
          Análises do período
        </h2>
        <div className="grid gap-4 md:grid-cols-1">
          <div className="rounded-2xl bg-muted/30 px-5 py-5 ring-1 ring-border/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp className="size-4 text-emerald-600" aria-hidden />
              Crescimento
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {textoCrescimento}
              {textoMotorLucro}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/30 px-5 py-5 ring-1 ring-border/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Scissors className="size-4 text-sky-600" aria-hidden />
              Serviço em destaque
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{textoServico}</p>
          </div>
          <div className="rounded-2xl bg-muted/30 px-5 py-5 ring-1 ring-border/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarRange className="size-4 text-violet-600" aria-hidden />
              Padrão sazonal
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{textoSazonal}</p>
          </div>
        </div>
      </section>
    </PageContent>
  )
}
