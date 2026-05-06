'use client'

import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { Area, AreaChart, CartesianGrid, ReferenceDot, XAxis, YAxis } from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  Building2,
  CalendarRange,
  Check,
  ChevronRight,
  Download,
  Filter,
  Lock,
  Minus,
  LineChart,
  Scissors,
  Timer,
  TrendingUp,
  UserRound,
  XCircle,
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
  diasCalendarioInclusivo,
  intervaloAnteriorComparacao,
  intervaloPorPreset,
  textoComparativoKpi,
  toLocalDateKey,
  type RelatorioPeriodoPreset,
} from '@/lib/relatorios-range'
import {
  analiseJanelaOciosa14h16,
  computeCurvaPorHora,
  computeHeatmapDowHora,
  computeOperacionalMetrics,
  computePiorServicoCancelamento,
  fetchHorariosNetPorBarbeiroDia,
  fetchOperacionalAgendamentos,
  rowsConcluidosComoDetalhe,
  taxaOcupacaoEstimadaBarbeiro,
  type OperacionalAgendaRow,
} from '@/lib/relatorios-operacional-data'
import { computeRankingBarbeiros, pctChange } from '@/lib/relatorios-visao-geral-data'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import type { Barbearia } from '@/types'

const PRESET_OPTIONS: { id: RelatorioPeriodoPreset; label: string }[] = [
  { id: '7d', label: 'Últimos 7 dias' },
  { id: '30d', label: 'Últimos 30 dias' },
  { id: 'mes', label: 'Este mês' },
  { id: 'mes_anterior', label: 'Mês anterior' },
]

const META_TEMPO_MEDIO_MIN = 35

const curvaChartConfig = {
  int: { label: 'Ocupação relativa', color: 'var(--ocupacao)' },
} satisfies ChartConfig

function heatIntensityColor(t: number): string {
  if (t <= 0) return 'rgb(231 229 228 / 0.35)'
  if (t < 0.33) return 'color-mix(in oklab, var(--ocupacao) 55%, transparent)'
  if (t < 0.66) return 'color-mix(in oklab, #eab308 70%, var(--ocupacao))'
  return 'color-mix(in oklab, var(--no-show) 75%, #eab308)'
}

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

/** Gauge em semicírculo (arco inferior) + percentual central. */
function OcupacaoGauge({ pct }: { pct: number | null }) {
  const r = 72
  const arcLen = Math.PI * r
  const p = pct != null && Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0
  const offset = arcLen * (1 - p / 100)
  return (
    <div className="relative mx-auto flex h-[5.75rem] w-[11rem] shrink-0 flex-col items-center justify-end">
      <svg viewBox="0 0 200 108" className="w-full max-w-[11rem]" aria-hidden>
        <path
          d="M 28 88 A 72 72 0 0 0 172 88"
          fill="none"
          className="stroke-[var(--bg-elevated)]"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 28 88 A 72 72 0 0 0 172 88"
          fill="none"
          stroke="var(--ocupacao)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={arcLen}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute bottom-1 vg-section tabular-nums text-[var(--text-primary)]">
        {pct != null ? `${pct.toFixed(0)}%` : '—'}
      </span>
    </div>
  )
}

export function RelatoriosOperacionalPainel(props: { slug: string; base: string }) {
  const { slug, base } = props

  const [preset, setPreset] = useState<RelatorioPeriodoPreset>('30d')
  const [barbeiroId, setBarbeiroId] = useState<string | null>(null)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [barberOpen, setBarberOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const [unidadeNome, setUnidadeNome] = useState<string | null>(null)
  const [operacaoLiberada, setOperacaoLiberada] = useState(true)
  const [barbeiros, setBarbeiros] = useState<{ id: string; nome: string }[]>([])
  const [barbeariaOp, setBarbeariaOp] = useState<Pick<
    Barbearia,
    'dias_funcionamento' | 'horario_abertura' | 'horario_fechamento'
  > | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rowsAtual, setRowsAtual] = useState<OperacionalAgendaRow[]>([])
  const [rowsAnt, setRowsAnt] = useState<OperacionalAgendaRow[]>([])
  const [horNetAtual, setHorNetAtual] = useState<Map<string, number>>(new Map())
  const [horNetAnt, setHorNetAnt] = useState<Map<string, number>>(new Map())
  const [barbeiroIdsAtual, setBarbeiroIdsAtual] = useState<string[]>([])

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
      .select('id, nome, status_cadastro, horario_abertura, horario_fechamento, dias_funcionamento')
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
    setBarbeariaOp({
      dias_funcionamento: barRow.dias_funcionamento as number[] | null | undefined,
      horario_abertura: barRow.horario_abertura as string | null | undefined,
      horario_fechamento: barRow.horario_fechamento as string | null | undefined,
    })

    const { data: barbeirosRows } = await supabase
      .from('barbeiros')
      .select('id, nome')
      .eq('barbearia_id', barRow.id)
      .eq('ativo', true)
      .order('nome', { ascending: true })

    const bList = (barbeirosRows ?? [])
      .filter((b): b is { id: string; nome: string } => typeof b.id === 'string')
      .map((b) => ({ id: b.id, nome: String(b.nome ?? 'Profissional') }))

    setBarbeiros(bList)
    const idsEscopo = barbeiroId ? [barbeiroId] : bList.map((b) => b.id)
    setBarbeiroIdsAtual(idsEscopo)

    if (!liberada) {
      setRowsAtual([])
      setRowsAnt([])
      setHorNetAtual(new Map())
      setHorNetAnt(new Map())
      setLoading(false)
      return
    }

    const ini = intervaloPorPreset(preset, null, null)
    const prev = intervaloAnteriorComparacao(ini.inicio, ini.fim)
    const i0 = toLocalDateKey(startOfDay(ini.inicio))
    const i1 = toLocalDateKey(startOfDay(ini.fim))
    const p0 = toLocalDateKey(startOfDay(prev.inicio))
    const p1 = toLocalDateKey(startOfDay(prev.fim))

    const bb = {
      dias_funcionamento: barRow.dias_funcionamento as number[] | null | undefined,
      horario_abertura: barRow.horario_abertura as string | null | undefined,
      horario_fechamento: barRow.horario_fechamento as string | null | undefined,
    }

    try {
      const [hNet, rA, rP] = await Promise.all([
        fetchHorariosNetPorBarbeiroDia(supabase, idsEscopo),
        fetchOperacionalAgendamentos(supabase, barRow.id, i0, i1, barbeiroId),
        fetchOperacionalAgendamentos(supabase, barRow.id, p0, p1, barbeiroId),
      ])
      setHorNetAtual(hNet)
      setHorNetAnt(hNet)
      setRowsAtual(rA)
      setRowsAnt(rP)
    } catch {
      setError('Não foi possível carregar o relatório operacional')
      setRowsAtual([])
      setRowsAnt([])
    } finally {
      setLoading(false)
    }
  }, [slug, preset, barbeiroId])

  useEffect(() => {
    void load()
  }, [load])

  const comparar = true
  const textoCmp = textoComparativoKpi(intervaloAtual.inicio, intervaloAtual.fim)

  const atual = useMemo(() => {
    if (!barbeariaOp || !barbeiroIdsAtual.length) return null
    return computeOperacionalMetrics(
      rowsAtual,
      horNetAtual,
      barbeariaOp,
      barbeiroIdsAtual,
      intervaloAtual.inicio,
      intervaloAtual.fim,
    )
  }, [rowsAtual, horNetAtual, barbeariaOp, barbeiroIdsAtual, intervaloAtual.inicio, intervaloAtual.fim])

  const anteriorIntervalo = useMemo(
    () => intervaloAnteriorComparacao(intervaloAtual.inicio, intervaloAtual.fim),
    [intervaloAtual.inicio, intervaloAtual.fim],
  )

  const anterior = useMemo(() => {
    if (!barbeariaOp || !barbeiroIdsAtual.length) return null
    return computeOperacionalMetrics(
      rowsAnt,
      horNetAnt,
      barbeariaOp,
      barbeiroIdsAtual,
      anteriorIntervalo.inicio,
      anteriorIntervalo.fim,
    )
  }, [rowsAnt, horNetAnt, barbeariaOp, barbeiroIdsAtual, anteriorIntervalo.inicio, anteriorIntervalo.fim])

  const pctOcup = pctChange(atual?.taxaOcupacaoPct ?? 0, anterior?.taxaOcupacaoPct ?? 0)
  const pctTempoMedio = pctChange(atual?.tempoMedioAtendMin ?? 0, anterior?.tempoMedioAtendMin ?? 0)
  const pctOcioso = pctChange(atual?.tempoOciosoPct ?? 0, anterior?.tempoOciosoPct ?? 0)
  const pctProd = pctChange(atual?.produtividadeHora ?? 0, anterior?.produtividadeHora ?? 0)
  const pctCanc = pctChange(atual?.taxaCancelamentoPct ?? 0, anterior?.taxaCancelamentoPct ?? 0)
  const pctNs = pctChange(atual?.taxaNoShowPct ?? 0, anterior?.taxaNoShowPct ?? 0)
  const pctServ = pctChange(atual?.servicosRealizados ?? 0, anterior?.servicosRealizados ?? 0)

  const chartGradId = useId().replace(/:/g, '')
  const diasPeriodo = diasCalendarioInclusivo(intervaloAtual.inicio, intervaloAtual.fim)

  const heatmap = useMemo(() => computeHeatmapDowHora(rowsAtual), [rowsAtual])
  const curva = useMemo(() => computeCurvaPorHora(rowsAtual), [rowsAtual])
  const ranking = useMemo(() => {
    const a = rowsConcluidosComoDetalhe(rowsAtual)
    const p = rowsConcluidosComoDetalhe(rowsAnt)
    return computeRankingBarbeiros(a, p, 5)
  }, [rowsAtual, rowsAnt])
  const maxRankFat = ranking[0]?.faturamento ?? 1

  const piorServCancel = useMemo(() => computePiorServicoCancelamento(rowsAtual), [rowsAtual])
  const janela1416 = useMemo(() => analiseJanelaOciosa14h16(curva, diasPeriodo), [curva, diasPeriodo])

  const picoHora = useMemo(() => {
    if (!curva.length) return null
    return [...curva].reduce((best, c) => (c.raw > (best?.raw ?? -1) ? c : best), curva[0]!)
  }, [curva])

  const valeHora = useMemo(() => {
    const withData = curva.filter((c) => c.raw > 0)
    if (!withData.length) return null
    return [...withData].reduce((best, c) => (c.raw < best.raw ? c : best), withData[0]!)
  }, [curva])

  const piorBarbeiroRanking = useMemo(() => {
    if (ranking.length < 2 || barbeiroId) return null
    return ranking[ranking.length - 1] ?? null
  }, [ranking, barbeiroId])

  const periodLabel = PRESET_OPTIONS.find((o) => o.id === preset)?.label ?? 'Período'
  const barberLabel = barbeiroId
    ? barbeiros.find((b) => b.id === barbeiroId)?.nome ?? 'Barbeiro'
    : 'Todos os barbeiros'
  const unitLabel = unidadeNome ?? 'Unidade'

  const tempoBarVsMetaPct =
    atual?.tempoMedioAtendMin != null
      ? Math.min(100, (atual.tempoMedioAtendMin / META_TEMPO_MEDIO_MIN) * 100)
      : 0
  const tempoAboveMeta =
    atual?.tempoMedioAtendMin != null && atual.tempoMedioAtendMin > META_TEMPO_MEDIO_MIN
  const deltaMinVsMeta =
    atual?.tempoMedioAtendMin != null ? Math.round(atual.tempoMedioAtendMin - META_TEMPO_MEDIO_MIN) : null

  const exportCsv = () => {
    if (!atual) return
    const lines = [
      'metrica;valor',
      `taxa_ocupacao_pct;${atual.taxaOcupacaoPct?.toFixed(2) ?? ''}`,
      `tempo_medio_min;${atual.tempoMedioAtendMin?.toFixed(1) ?? ''}`,
      `tempo_ocioso_pct;${atual.tempoOciosoPct?.toFixed(2) ?? ''}`,
      `produtividade_hora;${atual.produtividadeHora?.toFixed(2) ?? ''}`,
      `taxa_cancelamento_pct;${atual.taxaCancelamentoPct.toFixed(2)}`,
      `taxa_noshow_pct;${atual.taxaNoShowPct.toFixed(2)}`,
      `servicos_realizados;${atual.servicosRealizados}`,
    ].join('\n')
    const blob = new Blob([`\ufeff${lines}`], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `operacional-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const analiseOcupacao =
    atual?.taxaOcupacaoPct != null
      ? atual.taxaOcupacaoPct >= 70
        ? 'A cadeira está bem preenchida neste recorte — o desafio passa a ser manter qualidade e pontualidade sem saturar a recepção.'
        : atual.taxaOcupacaoPct >= 40
          ? 'Há espaço para densificar a agenda com campanhas pontuais ou remanejamento de horários mais fracos.'
          : 'Muito da capacidade ainda não virou atendimento; vale revisar marketing, preços ou disponibilidade exibida ao cliente.'
      : 'Cadastre horários de trabalho da equipe para a ocupação refletir a agenda real.'

  const analiseTempo =
    atual?.tempoMedioAtendMin != null
      ? tempoAboveMeta
        ? `O tempo médio ficou cerca de ${Math.abs(deltaMinVsMeta ?? 0)} min acima da meta de ${META_TEMPO_MEDIO_MIN} min — serviços mais longos ou atrasos na sequência explicam parte disso.`
        : `A duração média está dentro ou abaixo da meta de ${META_TEMPO_MEDIO_MIN} min, o que ajuda a rodar mais atendimentos no mesmo expediente.`
      : 'Com serviços concluídos no período, passamos a exibir a média de duração por atendimento.'

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
    <PageContent className="visao-geral-premium relatorio-operacional-premium bg-[var(--bg-page)] pb-14 pt-[var(--space-md)]">
      {/* Header */}
      <header className="vg-enter space-y-[var(--space-lg)]" style={{ animationDelay: '0ms' }}>
        <nav aria-label="Hierarquia da página" className="vg-small">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--text-tertiary)]">
            <li>
              <Link
                href={`${base}/relatorios`}
                className="transition-colors hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                Relatórios
              </Link>
            </li>
            <li aria-hidden className="select-none opacity-50">
              <ChevronRight className="size-3.5" />
            </li>
            <li className="font-medium text-[var(--text-primary)]" aria-current="page">
              Operacional
            </li>
          </ol>
        </nav>
        <div className="flex flex-col gap-[var(--space-md)] xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 space-y-[var(--space-sm)]">
            <h1 className="vg-display text-[var(--text-primary)]">Operacional</h1>
            <p className="vg-body max-w-2xl text-[var(--text-secondary)]">
              Acompanhe a eficiência e produtividade da sua barbearia com leitura integrada dos dados.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-[var(--space-xs)]">
            <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'group vg-body inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 font-medium text-[var(--text-primary)] shadow-premium transition-colors',
                    'hover:brightness-[0.98] dark:hover:brightness-110',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  )}
                >
                  <CalendarRange className="size-3.5 text-[var(--text-tertiary)]" aria-hidden />
                  <span className="max-sm:hidden">Período:</span> {periodLabel}
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
                    'group vg-body inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 font-medium text-[var(--text-primary)] shadow-premium transition-colors',
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
              className="vg-body inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 text-[var(--text-secondary)] shadow-premium"
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

            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full border-0 bg-[var(--bg-elevated)] shadow-premium"
                >
                  <Filter className="size-4" />
                  Filtros
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 vg-body" align="end">
                <p className="font-medium text-[var(--text-primary)]">Filtros</p>
                <p className="mt-2 text-[var(--text-secondary)]">
                  Período, profissional e unidade já estão acima. Filtros avançados (serviço, canal) podem ser
                  adicionados depois.
                </p>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      {/* Hero assimétrico */}
      <section className="vg-enter space-y-[var(--space-lg)]" style={{ animationDelay: '60ms' }}>
        <div className="grid gap-[var(--space-md)] lg:grid-cols-12">
          {/* Taxa ocupação — maior */}
          <div
            className={cn(
              'vg-card vg-enter flex flex-col gap-[var(--space-md)] rounded-3xl bg-[var(--bg-card)] shadow-premium hover-lift lg:col-span-5',
            )}
            style={{ animationDelay: '80ms' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--ocupacao) 16%, transparent)',
                  color: 'var(--ocupacao)',
                }}
                aria-hidden
              >
                <LineChart className="size-4" />
              </span>
              <p className="vg-small font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                Taxa de ocupação
              </p>
            </div>
            <div className="flex flex-col items-center gap-[var(--space-lg)] lg:flex-row lg:items-center lg:justify-between">
              <OcupacaoGauge pct={atual?.taxaOcupacaoPct ?? null} />
              <div className="min-w-0 flex-1 space-y-[var(--space-sm)] text-center lg:text-left">
                <p className="vg-body text-[var(--text-secondary)]">{analiseOcupacao}</p>
                <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                  <DeltaBadge pct={pctOcup} comparar={comparar} />
                  <span className="vg-small text-[var(--text-tertiary)]">{textoCmp}</span>
                </div>
                <Link
                  href={`${base}/agendamentos`}
                  className="vg-small inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  Detalhado <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>

          {/* Tempo médio — largo */}
          <div
            className={cn(
              'vg-card vg-enter flex flex-col gap-[var(--space-md)] rounded-3xl bg-[var(--bg-card)] shadow-premium hover-lift lg:col-span-7',
            )}
            style={{ animationDelay: '110ms' }}
          >
            <div className="flex items-center gap-2">
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--tempo-medio) 16%, transparent)',
                  color: 'var(--tempo-medio)',
                }}
                aria-hidden
              >
                <Timer className="size-4" />
              </span>
              <p className="vg-small font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                Tempo médio por atendimento
              </p>
            </div>
            {loading && !atual ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : (
              <>
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="vg-display tabular-nums text-[var(--text-primary)]">
                    {atual?.tempoMedioAtendMin != null
                      ? `${Math.round(atual.tempoMedioAtendMin)} min`
                      : '—'}
                  </span>
                  <DeltaBadge pct={pctTempoMedio} comparar={comparar} invert />
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className={cn('h-full rounded-full transition-all')}
                      style={{
                        width: `${tempoBarVsMetaPct}%`,
                        backgroundColor: tempoAboveMeta ? 'var(--tempo-medio)' : 'var(--ocupacao)',
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 vg-small text-[var(--text-secondary)]">
                    <span>
                      Meta: {META_TEMPO_MEDIO_MIN} min
                      {deltaMinVsMeta != null && deltaMinVsMeta !== 0 ? (
                        <span className={cn('ml-2', tempoAboveMeta ? 'text-amber-700 dark:text-amber-400' : '')}>
                          {deltaMinVsMeta > 0 ? `↑ ${deltaMinVsMeta} min acima da meta` : `↓ ${Math.abs(deltaMinVsMeta)} min abaixo da meta`}
                        </span>
                      ) : null}
                    </span>
                  </div>
                </div>
                <p className="vg-body text-[var(--text-secondary)]">{analiseTempo}</p>
                <Link
                  href={`${base}/servicos`}
                  className="vg-small inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  Ver por serviço <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Três métricas compactas — ícone circular, valor grande, variação */}
        <div className="grid gap-[var(--space-md)] sm:grid-cols-3">
          <div
            className="vg-card vg-enter flex flex-col items-center rounded-2xl bg-[var(--bg-card)] px-[var(--space-md)] py-[var(--space-lg)] text-center shadow-premium hover-lift"
            style={{ animationDelay: '140ms' }}
          >
            <span
              className="flex size-14 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--tempo-ocioso) 16%, transparent)',
                color: 'var(--tempo-ocioso)',
              }}
              aria-hidden
            >
              <Timer className="size-6" />
            </span>
            <p className="vg-small mt-[var(--space-md)] font-medium text-[var(--text-tertiary)]">Tempo ocioso</p>
            <p className="vg-display mt-1 tabular-nums leading-tight text-[var(--text-primary)]">
              {atual?.tempoOciosoPct != null ? `${atual.tempoOciosoPct.toFixed(1).replace('.', ',')}%` : '—'}
            </p>
            <div className="mt-2">
              <DeltaBadge pct={pctOcioso} comparar={comparar} invert />
            </div>
          </div>

          <div
            className="vg-card vg-enter flex flex-col items-center rounded-2xl bg-[var(--bg-card)] px-[var(--space-md)] py-[var(--space-lg)] text-center shadow-premium hover-lift"
            style={{ animationDelay: '170ms' }}
          >
            <span
              className="flex size-14 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--produtividade) 16%, transparent)',
                color: 'var(--produtividade)',
              }}
              aria-hidden
            >
              <TrendingUp className="size-6" />
            </span>
            <p className="vg-small mt-[var(--space-md)] font-medium text-[var(--text-tertiary)]">Produtividade</p>
            <p className="vg-display mt-1 tabular-nums leading-tight text-[var(--text-primary)]">
              {atual?.produtividadeHora != null ? formatCurrency(atual.produtividadeHora) : '—'}
            </p>
            <p className="vg-small mt-0.5 text-[var(--text-tertiary)]">por hora</p>
            <div className="mt-2">
              <DeltaBadge pct={pctProd} comparar={comparar} />
            </div>
          </div>

          <div
            className="vg-card vg-enter flex flex-col items-center rounded-2xl bg-[var(--bg-card)] px-[var(--space-md)] py-[var(--space-lg)] text-center shadow-premium hover-lift"
            style={{ animationDelay: '200ms' }}
          >
            <span
              className="flex size-14 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--cancelamento) 16%, transparent)',
                color: 'var(--cancelamento)',
              }}
              aria-hidden
            >
              <Ban className="size-6" />
            </span>
            <p className="vg-small mt-[var(--space-md)] font-medium text-[var(--text-tertiary)]">Cancelamento</p>
            <p className="vg-display mt-1 tabular-nums leading-tight text-[var(--text-primary)]">
              {atual ? `${atual.taxaCancelamentoPct.toFixed(1).replace('.', ',')}%` : '—'}
            </p>
            <div className="mt-2">
              <DeltaBadge pct={pctCanc} comparar={comparar} invert />
            </div>
          </div>
        </div>

        {/* No-show + Serviços */}
        <div className="grid gap-[var(--space-md)] lg:grid-cols-2">
          <div
            className="vg-card vg-enter rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium hover-lift"
            style={{ animationDelay: '230ms' }}
          >
            <div className="flex items-start gap-[var(--space-md)]">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--no-show) 16%, transparent)',
                  color: 'var(--no-show)',
                }}
              >
                <XCircle className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-[var(--space-sm)]">
                <p className="vg-small font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Taxa de no-show
                </p>
                <p className="vg-display tabular-nums text-[var(--text-primary)]">
                  {atual ? `${atual.taxaNoShowPct.toFixed(1).replace('.', ',')}%` : '—'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <DeltaBadge pct={pctNs} comparar={comparar} invert />
                  <span className="vg-small text-[var(--text-tertiary)]">{textoCmp}</span>
                </div>
                <p className="vg-body text-[var(--text-secondary)]">
                  {atual && atual.taxaNoShowPct > 10
                    ? 'Faltas em patamar elevado: confirmação ativa e política de lista de espera costumam recuperar horário.'
                    : 'Comparecimento relativamente disciplinado — mantenha lembretes nos dias de maior fluxo.'}
                </p>
                <Link
                  href={`${base}/agendamentos`}
                  className="vg-small inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  Análise de faltas <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>

          <div
            className="vg-card vg-enter rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium hover-lift"
            style={{ animationDelay: '260ms' }}
          >
            <div className="flex items-start gap-[var(--space-md)]">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--servicos) 16%, transparent)',
                  color: 'var(--servicos)',
                }}
              >
                <Scissors className="size-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-[var(--space-sm)]">
                <p className="vg-small font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                  Serviços realizados
                </p>
                <p className="vg-display tabular-nums text-[var(--text-primary)]">
                  {atual ? atual.servicosRealizados : '—'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <DeltaBadge pct={pctServ} comparar={comparar} />
                  <span className="vg-small text-[var(--text-tertiary)]">{textoCmp}</span>
                </div>
                <p className="vg-body text-[var(--text-secondary)]">
                  Volume de atendimentos concluídos no período — base para comparar ocupação e receita sem ruído de
                  cancelados.
                </p>
                <Link
                  href={`${base}/servicos`}
                  className="vg-small inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  Ver por tipo <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Heatmap + ranking */}
      <section className="grid gap-[var(--space-lg)] lg:grid-cols-2">
        <div className="vg-card vg-enter rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium md:p-[var(--space-lg)]">
          <p className="vg-section text-[var(--text-primary)]">Heatmap de ocupação</p>
          <p className="vg-small mt-1 text-[var(--text-secondary)]">Inícios de agendamentos por dia da semana e hora.</p>
          <div className="mt-[var(--space-md)] overflow-x-auto">
            <table className="w-full min-w-[520px] border-separate border-spacing-1 text-left text-xs">
              <thead>
                <tr>
                  <th className="w-10 pr-1 font-medium text-[var(--text-tertiary)]" />
                  {heatmap.hourLabels.map((h) => (
                    <th key={h} className="px-0.5 text-center font-medium text-[var(--text-tertiary)]">
                      {h.replace('h', '')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.dowOrder.map((dow, rowIdx) => (
                  <tr key={dow}>
                    <td className="whitespace-nowrap pr-2 font-medium text-[var(--text-secondary)]">
                      {heatmap.dowLabels[rowIdx]}
                    </td>
                    {heatmap.matrix[dow]!.map((c, hi) => {
                      const t = heatmap.globalMax > 0 ? c / heatmap.globalMax : 0
                      return (
                        <td key={hi} className="p-0">
                          <div
                            className="mx-auto aspect-square w-full max-w-[1.35rem] rounded-sm sm:max-w-[1.5rem]"
                            style={{ backgroundColor: heatIntensityColor(t) }}
                            title={`${c} agendamentos`}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div
            className="mt-3 h-2 w-full max-w-md rounded-full"
            style={{
              background:
                'linear-gradient(90deg, var(--ocupacao) 0%, #eab308 50%, var(--no-show) 100%)',
            }}
            aria-hidden
          />
          <p className="vg-small mt-2 text-[var(--text-tertiary)]">
            <span className="font-medium text-[var(--text-secondary)]">Legenda:</span> tons mais frios = menos
            inícios na célula; tons quentes = mais demanda concentrada nesse cruzamento dia × hora.
          </p>
          <p className="vg-body mt-[var(--space-md)] text-[var(--text-secondary)]">
            {heatmap.globalMax <= 1
              ? 'Ainda há poucos dados para padrões fortes — amplie o período ou aguarde mais movimento na agenda.'
              : janela1416?.ociosa
                ? 'Os horários entre 14h e 16h aparecem mais vazios que a média do dia — vale testar promoção ou pacotes nesse intervalo.'
                : 'O calor concentra-se de forma relativamente equilibrada; use o mapa para ajustar escala onde ainda há células frias contíguas.'}
          </p>
        </div>

        <div className="vg-card vg-enter rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium md:p-[var(--space-lg)]">
          <p className="vg-section text-[var(--text-primary)]">Desempenho por barbeiro</p>
          <p className="vg-small mt-1 text-[var(--text-secondary)]">Faturamento em serviços concluídos {textoCmp}.</p>
          <div className="mt-[var(--space-md)] space-y-[var(--space-md)]">
            {loading && ranking.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
            ) : ranking.length === 0 ? (
              <p className="vg-body text-muted-foreground">Sem faturamento concluído no período.</p>
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
                  <div key={r.barbeiroId} className="flex items-center gap-3">
                    <Avatar className="size-9 shrink-0 border-0 shadow-premium">
                      <AvatarFallback className="vg-small font-semibold">{iniciais || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="vg-body truncate font-semibold text-[var(--text-primary)]">{r.nome}</p>
                        <span className="vg-body shrink-0 tabular-nums font-semibold text-[var(--text-primary)]">
                          {formatCurrency(r.faturamento)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${barW}%`,
                              backgroundColor: 'var(--servicos)',
                            }}
                          />
                        </div>
                        <div className="shrink-0">
                          <DeltaBadge pct={r.pctVsAnterior} comparar={comparar} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <Link
            href={`${base}/equipe`}
            className="vg-small mt-[var(--space-md)] inline-flex font-semibold text-[var(--brand-primary)] hover:underline"
          >
            Ver ranking completo <ChevronRight className="inline size-3.5" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Curva do dia + análises */}
      <section className="grid gap-[var(--space-lg)] lg:grid-cols-2">
        <div className="vg-card vg-enter rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium hover-lift md:p-[var(--space-lg)]">
          <p className="vg-section text-[var(--text-primary)]">Ocupação ao longo do dia (média)</p>
          <p className="vg-small mt-1 text-[var(--text-secondary)]">
            Eixo vertical 0% a 100%: intensidade relativa ao pico de inícios de agendamento no período (8h–20h).
          </p>
          <div className="mt-[var(--space-md)] h-[240px] w-full sm:h-[280px]">
            <ChartContainer config={curvaChartConfig} className="h-full w-full !aspect-auto">
              <AreaChart data={curva} margin={{ left: 0, right: 4, top: 10, bottom: 4 }}>
                <defs>
                  <linearGradient id={`op-curva-${chartGradId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--ocupacao)" stopOpacity={0.42} />
                    <stop offset="100%" stopColor="var(--ocupacao)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/35" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 100]}
                  width={44}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={4}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(v) => `${Number(v).toFixed(0)}% na escala do gráfico`}
                      labelFormatter={(l) => `Horário ${String(l)}`}
                    />
                  }
                />
                <Area
                  type="natural"
                  dataKey="intensidadePct"
                  stroke="var(--ocupacao)"
                  strokeWidth={2.5}
                  fill={`url(#op-curva-${chartGradId})`}
                  dot={false}
                />
                {picoHora && curva.some((c) => c.raw > 0) ? (
                  <ReferenceDot
                    x={picoHora.label}
                    y={picoHora.intensidadePct}
                    r={6}
                    fill="var(--brand-primary)"
                    stroke="var(--bg-card)"
                    strokeWidth={2}
                    aria-label={`Pico ${picoHora.label}`}
                  />
                ) : null}
                {valeHora &&
                curva.some((c) => c.raw > 0) &&
                (valeHora.hora !== picoHora?.hora || valeHora.raw !== picoHora?.raw) ? (
                  <ReferenceDot
                    x={valeHora.label}
                    y={valeHora.intensidadePct}
                    r={6}
                    fill="var(--text-tertiary)"
                    stroke="var(--bg-card)"
                    strokeWidth={2}
                    aria-label={`Vale ${valeHora.label}`}
                  />
                ) : null}
              </AreaChart>
            </ChartContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 vg-small text-[var(--text-tertiary)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[var(--brand-primary)]" aria-hidden />
              Pico ({picoHora?.label ?? '—'})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[var(--text-tertiary)]" aria-hidden />
              Vale ({valeHora?.label ?? '—'})
            </span>
          </div>
          {picoHora && valeHora ? (
            <p className="vg-body mt-[var(--space-md)] rounded-2xl bg-[var(--bg-elevated)]/80 px-4 py-3.5 leading-relaxed text-[var(--text-secondary)]">
              A área em <span className="font-semibold text-[var(--ocupacao)]">spline suave</span> contrasta o ritmo
              hora a hora: o pico relativo fica em <strong className="text-[var(--text-primary)]">{picoHora.label}</strong>{' '}
              (<strong className="tabular-nums text-[var(--text-primary)]">{picoHora.intensidadePct.toFixed(0)}%</strong>{' '}
              no eixo, <strong className="tabular-nums">{picoHora.raw}</strong> inícios contabilizados), enquanto o vale
              aparece em <strong className="text-[var(--text-primary)]">{valeHora.label}</strong>{' '}
              (<strong className="tabular-nums">{valeHora.raw}</strong> inícios), útil para encaixes ou pausa operacional.
              {janela1416?.ociosa
                ? ' Entre 14h e 16h a média fica abaixo do restante do dia — vale testar promoção pontual nesse recorte.'
                : ' A faixa 14h–16h não se destaca como ociosa versus a média, então o foco pode ser reforçar confirmação nas horas mais quentes da curva.'}
            </p>
          ) : null}
          <Link
            href={`${base}/agendamentos`}
            className="vg-small mt-[var(--space-md)] inline-flex font-semibold text-[var(--brand-primary)] hover:underline"
          >
            Ver por dia da semana <ChevronRight className="inline size-3.5" aria-hidden />
          </Link>
        </div>

        <div className="vg-card vg-enter flex flex-col rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium hover-lift md:p-[var(--space-lg)]">
          <p className="vg-section text-[var(--text-primary)]">Análises do período</p>
          <p className="vg-small mt-1 text-[var(--text-secondary)]">
            Leitura consultiva, com os mesmos números do painel entrelaçados no texto.
          </p>
          <div className="mt-[var(--space-md)] flex flex-1 flex-col gap-[var(--space-sm)]">
            <article className="flex gap-[var(--space-md)] rounded-2xl bg-[var(--bg-elevated)]/85 px-4 py-3.5 shadow-premium hover-lift">
              <span
                className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--tempo-ocioso) 14%, transparent)',
                  color: 'var(--tempo-ocioso)',
                }}
                aria-hidden
              >
                <Timer className="size-5" />
              </span>
              <p className="vg-body min-w-0 leading-relaxed text-[var(--text-secondary)]">
                {janela1416?.ociosa
                  ? 'Os horários entre 14h e 16h aparecem mais vazios do que a média do dia: é um sinal claro para experimentar promoção, pacotes curtos ou remanejamento de campanhas para essa janela, sem necessariamente mexer no preço base dos serviços.'
                  : 'A faixa entre 14h e 16h acompanha o ritmo geral da agenda; o esforço pode ir para pontualidade e confirmação nas horas em que a curva de ocupação sobe, evitando que picos virem fila na recepção.'}
              </p>
            </article>
            {piorBarbeiroRanking ? (
              <article className="flex gap-[var(--space-md)] rounded-2xl bg-[var(--bg-elevated)]/85 px-4 py-3.5 shadow-premium hover-lift">
                <span
                  className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--servicos) 14%, transparent)',
                    color: 'var(--servicos)',
                  }}
                  aria-hidden
                >
                  <UserRound className="size-5" />
                </span>
                <p className="vg-body min-w-0 leading-relaxed text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)]">{piorBarbeiroRanking.nome}</span> concentra
                  a menor fatia de faturamento entre os profissionais listados
                  {atual?.taxaOcupacaoPct != null
                    ? (() => {
                        const est = taxaOcupacaoEstimadaBarbeiro(
                          rowsAtual,
                          piorBarbeiroRanking.barbeiroId,
                          atual.taxaOcupacaoPct,
                        )
                        return est != null
                          ? `; numa leitura aproximada, a ocupação associada fica em torno de ${est}% face ao mix do período`
                          : ''
                      })()
                    : ''}
                  . Vale cruzar escala publicada, mix de serviços e eventuais faltas — às vezes o gargalo é visibilidade na
                  agenda, não falta de demanda.
                </p>
              </article>
            ) : null}
            {piorServCancel ? (
              <article className="flex gap-[var(--space-md)] rounded-2xl bg-[var(--bg-elevated)]/85 px-4 py-3.5 shadow-premium hover-lift">
                <span
                  className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--cancelamento) 14%, transparent)',
                    color: 'var(--cancelamento)',
                  }}
                  aria-hidden
                >
                  <Scissors className="size-5" />
                </span>
                <p className="vg-body min-w-0 leading-relaxed text-[var(--text-secondary)]">
                  O serviço <span className="font-semibold text-[var(--text-primary)]">{piorServCancel.nome}</span>{' '}
                  destaca-se com taxa de cancelamento de{' '}
                  <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                    {piorServCancel.pct.toFixed(1).replace('.', ',')}%
                  </span>{' '}
                  sobre o volume observado — situação que merece olhar para tempo de execução real, política de
                  reagendamento e comunicação prévia ao cliente, antes de atribuir o movimento só à sazonalidade.
                </p>
              </article>
            ) : null}
            <article className="flex gap-[var(--space-md)] rounded-2xl bg-[var(--bg-elevated)]/85 px-4 py-3.5 shadow-premium hover-lift">
              <span
                className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--produtividade) 14%, transparent)',
                  color: 'var(--produtividade)',
                }}
                aria-hidden
              >
                <TrendingUp className="size-5" />
              </span>
              <p className="vg-body min-w-0 leading-relaxed text-[var(--text-secondary)]">
                {pctProd != null && Math.abs(pctProd) >= 0.05 ? (
                  <>
                    A produtividade em receita por hora de serviço concluído moveu-se{' '}
                    <span className="font-semibold tabular-nums text-[var(--text-primary)]">
                      {pctProd > 0 ? '+' : ''}
                      {pctProd.toFixed(1).replace('.', ',')}%
                    </span>{' '}
                    {textoCmp}
                    {pctProd > 0
                      ? ', o que sugere que o conjunto preço × duração × ocupação está mais eficiente — convém sustentar o ritmo com consistência operacional.'
                      : ', convidando a revisar composição de serviços ou política de descontos para não erodir margem enquanto o calendário esfria.'}
                  </>
                ) : (
                  <>
                    A produtividade por hora de serviço permanece estável {textoCmp}, sinal de previsibilidade na
                    conversão de tempo em receita — útil para planejar metas sem surpresas de curto prazo.
                  </>
                )}
              </p>
            </article>
          </div>
          <Link
            href={`${base}/relatorios/visao-geral`}
            className="vg-small mt-[var(--space-md)] inline-flex font-semibold text-[var(--brand-primary)] hover:underline"
          >
            Ver panorama financeiro <ChevronRight className="inline size-3.5" aria-hidden />
          </Link>
        </div>
      </section>

      <footer className="vg-enter vg-body text-[var(--text-tertiary)]" style={{ animationDelay: '280ms' }}>
        <p>
          Ocupação global compara minutos reservados (agendado, em atendimento, concluído, faltou) com capacidade
          estimada pelos horários da equipe ou expediente da unidade.
        </p>
      </footer>
    </PageContent>
  )
}
