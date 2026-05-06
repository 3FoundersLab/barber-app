'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  Building2,
  CalendarRange,
  Check,
  ChevronRight,
  Lock,
  Minus,
  PiggyBank,
  Target,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageContent } from '@/components/shared/page-container'
import { ExportarPDFButton } from '@/components/ui/exportar-pdf-button'
import { usePdfGeradoPor } from '@/hooks/usePdfGeradoPor'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserSafe } from '@/lib/supabase/get-auth-user-safe'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import {
  computeTendenciasFromRows,
  fetchTendenciasAgendamentos,
  intensidadeSazonalidade12,
} from '@/lib/relatorios-tendencias-data'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { VisaoGeralAgendamentoRow } from '@/lib/relatorios-visao-geral-data'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

type MesesPreset = '12m' | '6m'

const PERIODO_OPTIONS: { id: MesesPreset; label: string }[] = [
  { id: '12m', label: 'Últimos 12 meses' },
  { id: '6m', label: 'Últimos 6 meses' },
]

const chartDuploConfig = {
  faturamento: { label: 'Faturamento', color: 'var(--faturamento)' },
  ticketMedio: { label: 'Ticket médio', color: 'var(--crescimento)' },
} satisfies ChartConfig

const chartBarConfig = {
  atual: { label: 'Período atual', color: 'var(--faturamento)' },
  anterior: { label: 'Mesmo mês (ano ant.)', color: 'var(--text-tertiary)' },
} satisfies ChartConfig

const chartProjConfig = {
  realizado: { label: 'Realizado', color: 'var(--faturamento)' },
  projecao: { label: 'Projeção', color: 'var(--crescimento)' },
} satisfies ChartConfig

function tickFmtCompact(v: number): string {
  if (!Number.isFinite(v)) return ''
  if (Math.abs(v) >= 1000) return `${Math.round(v / 1000)}k`
  return String(Math.round(v))
}

function fmtPctSigned(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—'
  const s = n.toFixed(1).replace('.', ',')
  if (n > 0) return `+${s}%`
  if (n < 0) return `${s}%`
  return `${s}%`
}

function DeltaBadge({
  pct,
  invert = false,
}: {
  pct: number | null
  invert?: boolean
}) {
  if (pct == null || !Number.isFinite(pct)) {
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

function SparkFaturamento({ data }: { data: { label: string; v: number }[] }) {
  if (!data.length) return <div className="h-12 w-full rounded-lg bg-[var(--bg-elevated)]/80" />
  return (
    <div className="h-12 w-full min-w-[7rem]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 0 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke="var(--crescimento)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RelatoriosTendenciasPainel(props: { slug: string; base: string }) {
  const { slug, base } = props
  const pdfGeradoPor = usePdfGeradoPor()

  const [mesesPreset, setMesesPreset] = useState<MesesPreset>('12m')
  const [barbeiroId, setBarbeiroId] = useState<string | null>(null)
  const [periodOpen, setPeriodOpen] = useState(false)
  const [barberOpen, setBarberOpen] = useState(false)

  const [unidadeNome, setUnidadeNome] = useState<string | null>(null)
  const [operacaoLiberada, setOperacaoLiberada] = useState(true)
  const [barbeiros, setBarbeiros] = useState<{ id: string; nome: string }[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<VisaoGeralAgendamentoRow[]>([])

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
      setRows([])
      setLoading(false)
      return
    }

    try {
      const r = await fetchTendenciasAgendamentos(supabase, barRow.id, barbeiroId)
      setRows(r)
    } catch {
      setError('Não foi possível carregar tendências')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [slug, barbeiroId])

  useEffect(() => {
    void load()
  }, [load])

  const metrics = useMemo(
    () => computeTendenciasFromRows(rows, new Date(), mesesPreset === '12m' ? 12 : 6),
    [rows, mesesPreset],
  )

  const heatSazonalidade = useMemo(() => intensidadeSazonalidade12(rows), [rows])

  const sparkMoM = useMemo(
    () => metrics.serieMensal.map((p) => ({ label: p.label, v: p.faturamento })),
    [metrics.serieMensal],
  )
  const sparkYoY = useMemo(
    () => metrics.serieYoYPercent.map((p) => ({ label: p.label, v: p.faturamento })),
    [metrics.serieYoYPercent],
  )

  const diffFat = metrics.fatUltimoMes - metrics.fatPenultimoMes
  const maxFatBar = Math.max(metrics.fatUltimoMes, metrics.fatPenultimoMes, 1)
  const barAtualPct = (metrics.fatUltimoMes / maxFatBar) * 100
  const barAntPct = (metrics.fatPenultimoMes / maxFatBar) * 100

  const churnBarWidth = Math.min(100, (metrics.churnUltimoPct / 35) * 100)

  const exportCsv = () => {
    const lines = [
      'metrica;valor',
      `crescimento_mom_pct;${metrics.crescimentoMoM?.toFixed(2) ?? ''}`,
      `crescimento_yoy_pct;${metrics.crescimentoYoY?.toFixed(2) ?? ''}`,
      `faturamento_ultimo_mes;${metrics.fatUltimoMes.toFixed(2)}`,
      `faturamento_penultimo_mes;${metrics.fatPenultimoMes.toFixed(2)}`,
      `churn_pct;${metrics.churnUltimoPct.toFixed(2)}`,
      `ticket_medio;${metrics.ticketUltimo.toFixed(2)}`,
      `clientes_ativos;${metrics.clientesUltimo}`,
    ].join('\n')
    const blob = new Blob([`\ufeff${lines}`], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `tendencias-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const analiseChurn =
    metrics.churnUltimoPct >= 18
      ? `Churn em patamar elevado (${metrics.churnUltimoPct.toFixed(1).replace('.', ',')}%). Vale cruzar com horários de pico e confirmação de agenda — muitas perdas concentradas costumam indicar atrito operacional, não só preço.`
      : metrics.deltaChurnPontos > 1.5
        ? `O churn subiu ${metrics.deltaChurnPontos.toFixed(1).replace('.', ',')} p.p. em relação ao par de meses anterior — investigar qualidade de atendimento e lembretes nos horários mais cheios tende a ser mais efetivo que descontos amplos.`
        : metrics.churnUltimoPct <= 8
          ? `Retenção de base relativamente saudável; mantenha ritual de pós-atendimento nos dias de maior fluxo para não deixar o indicador escorregar.`
          : `Churn moderado: combine confirmação ativa com ofertas em horários onde a agenda ainda tem folga.`

  const periodLabel = PERIODO_OPTIONS.find((o) => o.id === mesesPreset)?.label ?? 'Período'
  const barberLabel = barbeiroId
    ? barbeiros.find((b) => b.id === barbeiroId)?.nome ?? 'Barbeiro'
    : 'Todos os barbeiros'
  const unitLabel = unidadeNome ?? 'Unidade'

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
    <PageContent className="visao-geral-premium relatorio-tendencias-premium bg-[var(--bg-page)] pb-14 pt-[var(--space-md)]">
      <div
        id="relatorio-tendencias-export"
        className="flex min-w-0 flex-col gap-[var(--space-xl)]"
      >
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
              Tendências
            </li>
          </ol>
        </nav>
        <div className="flex flex-col gap-[var(--space-md)] lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-[var(--space-sm)]">
            <h1 className="vg-display text-[var(--text-primary)]">Tendências</h1>
            <p className="vg-body max-w-2xl text-[var(--text-secondary)]">
              Analise o crescimento e projeções operacionais do negócio com base em faturamento concluído e base de
              clientes.
            </p>
          </div>
          <div className="flex w-full min-w-0 items-center gap-2 lg:w-auto lg:flex-1 lg:justify-end">
            <div
              className={cn(
                'flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto py-0.5',
                '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              )}
            >
            <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'group vg-body inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 font-medium text-[var(--text-primary)] shadow-premium transition-colors',
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
                  {PERIODO_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setMesesPreset(o.id)
                        setPeriodOpen(false)
                      }}
                      className={cn(
                        'vg-body flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-colors',
                        mesesPreset === o.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/80',
                      )}
                    >
                      {o.label}
                      {mesesPreset === o.id ? <Check className="size-4 shrink-0 opacity-70" /> : null}
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
                    'group vg-body inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 font-medium text-[var(--text-primary)] shadow-premium transition-colors',
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

            <span className="vg-body inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 text-[var(--text-secondary)] shadow-premium">
              <Building2 className="size-3.5 shrink-0 opacity-70" aria-hidden />
              Todas as unidades
            </span>
            </div>
            <ExportarPDFButton
              conteudoId="relatorio-tendencias-export"
              nomeArquivo={`tendencias-${format(new Date(), 'yyyy-MM-dd-HHmm')}`}
              titulo="Exportar PDF"
              tipoRelatorio="tendencias"
              pdfMeta={{
                titulo: 'Tendências',
                subtitulo:
                  barberLabel !== 'Todos os barbeiros' ? `Escopo: ${barberLabel}` : undefined,
                periodo: `${periodLabel} (corte em ${format(new Date(), 'dd/MM/yyyy', { locale: ptBR })})`,
                unidade: unitLabel,
                geradoPor: pdfGeradoPor,
              }}
              disabled={loading || rows.length === 0}
              className="shrink-0"
            />
          </div>
        </div>
      </header>

      {/* Hero crescimento */}
      <section className="vg-enter" style={{ animationDelay: '60ms' }}>
        <div
          className={cn(
            'overflow-hidden rounded-3xl p-[var(--space-lg)] shadow-premium hover-lift md:p-[var(--space-xl)]',
            'bg-gradient-to-br from-[var(--bg-crescimento)] via-white to-[var(--bg-card)]',
            'dark:from-emerald-950/35 dark:via-[var(--bg-card)] dark:to-[var(--bg-card)]',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--crescimento)]"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--crescimento) 18%, transparent)',
              }}
              aria-hidden
            >
              <TrendingUp className="size-4" />
            </span>
            <p className="vg-section text-[var(--text-primary)]">Crescimento</p>
          </div>
          <p className="vg-small mt-2 max-w-3xl text-[var(--text-secondary)]">
            Comparativo do último mês fechado ({metrics.ultimoMesFechadoLabel}) frente ao mês anterior e ao mesmo mês do
            ano passado. O sparkline à esquerda mostra faturamento mensal ({mesesPreset === '12m' ? '12' : '6'} pontos);
            o da direita, a variação percentual mês a mês frente ao mesmo mês do ano anterior.
          </p>
          <div className="mt-[var(--space-lg)] grid gap-[var(--space-md)] md:grid-cols-2">
            <HeroGrowthBlock
              title="Crescimento mensal (MoM)"
              subtitle="vs. mês anterior"
              pct={metrics.crescimentoMoM}
              spark={sparkMoM}
              loading={loading}
            />
            <HeroGrowthBlock
              title="Crescimento anual (YoY)"
              subtitle="vs. mesmo mês do ano anterior"
              pct={metrics.crescimentoYoY}
              spark={sparkYoY}
              loading={loading}
            />
          </div>
        </div>
      </section>

      {/* Bicolumn */}
      <section className="grid gap-[var(--space-xl)] lg:grid-cols-2 lg:items-start">
        <div className="vg-card vg-enter rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium hover-lift md:p-[var(--space-lg)]">
          <p className="vg-section text-[var(--text-primary)]">Faturamento comparativo</p>
          <p className="vg-small mt-1 text-[var(--text-secondary)]">
            Serviços concluídos — {metrics.ultimoMesFechadoLabel} frente a {metrics.penultimoMesLabel}.
          </p>
          {loading && !rows.length ? (
            <div className="mt-6 space-y-4">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : (
            <div className="mt-[var(--space-md)] flex flex-col gap-[var(--space-md)]">
              <div className="rounded-2xl bg-[var(--bg-elevated)]/75 p-4 shadow-premium">
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--faturamento)]"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--faturamento) 16%, transparent)',
                    }}
                  >
                    <PiggyBank className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="vg-small font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                      Faturamento atual
                    </p>
                    <p className="vg-display mt-1 tabular-nums text-[var(--text-primary)]">
                      {formatCurrency(metrics.fatUltimoMes)}
                    </p>
                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-card)]">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${barAtualPct}%`,
                          backgroundColor: 'var(--faturamento)',
                        }}
                      />
                    </div>
                    <p className="vg-small mt-2 text-[var(--text-tertiary)]">
                      Último mês fechado — barra proporcional ao maior valor do par.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[var(--bg-elevated)]/50 p-4 shadow-premium">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted/80 text-[var(--text-secondary)]">
                    <CalendarRange className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="vg-small font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                      Faturamento anterior
                    </p>
                    <p className="vg-display mt-1 tabular-nums text-[var(--text-primary)]">
                      {formatCurrency(metrics.fatPenultimoMes)}
                    </p>
                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-card)]">
                      <div
                        className="h-full rounded-full bg-[var(--text-tertiary)]/40 transition-all"
                        style={{ width: `${barAntPct}%` }}
                      />
                    </div>
                    <p className="vg-small mt-2 text-[var(--text-tertiary)]">Mês imediatamente anterior.</p>
                  </div>
                </div>
              </div>

              <p className="vg-body leading-relaxed text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-[var(--text-primary)]">Diferença:</span>{' '}
                <span className="tabular-nums text-[var(--accent-faturamento)]">
                  {diffFat >= 0 ? '+' : ''}
                  {formatCurrency(diffFat)}
                </span>{' '}
                ({fmtPctSigned(metrics.crescimentoMoM)} em relação ao mês anterior). Quando o par está estável, o
                esforço pode ir para ticket e recorrência em vez de só volume bruto.
              </p>
            </div>
          )}
          <Link
            href={`${base}/relatorios/visao-geral`}
            className="vg-small mt-[var(--space-md)] inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
          >
            Visão geral financeira <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <div className="vg-card vg-enter flex flex-col rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium hover-lift md:p-[var(--space-lg)]">
          <p className="vg-section text-[var(--text-primary)]">Métricas-chave</p>
          <p className="vg-small mt-1 text-[var(--text-secondary)]">
            Churn estimado por saída de base entre meses consecutivos; ticket e clientes no último mês fechado.
          </p>
          {loading && !rows.length ? (
            <div className="mt-6 flex flex-1 flex-col gap-3">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : (
            <div className="mt-[var(--space-md)] flex flex-1 flex-col gap-2">
              <article
                className="rounded-xl px-3 py-3 shadow-premium ring-2 ring-[var(--churn)]/30"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--churn) 8%, var(--bg-elevated))',
                }}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--churn)]"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--churn) 22%, transparent)',
                    }}
                  >
                    <Ban className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--churn)]">
                      Churn de base
                    </p>
                    <p className="mt-0.5 text-2xl font-semibold tabular-nums leading-tight text-[var(--churn)] md:text-[1.65rem]">
                      {metrics.churnUltimoPct.toFixed(1).replace('.', ',')}%
                    </p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-card)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${churnBarWidth}%`,
                          backgroundColor: 'var(--churn)',
                        }}
                      />
                    </div>
                    <p className="mt-1.5 text-[0.8125rem] text-stone-500 dark:text-stone-400">
                      Variação vs par anterior:{' '}
                      <span className="font-semibold tabular-nums text-[var(--churn)]">
                        {metrics.deltaChurnPontos >= 0 ? '+' : ''}
                        {metrics.deltaChurnPontos.toFixed(1).replace('.', ',')} p.p.
                      </span>
                    </p>
                  </div>
                </div>
              </article>

              <article className="rounded-xl bg-[var(--bg-elevated)]/85 px-3 py-2.5 shadow-premium">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--ticket)]"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--ticket) 16%, transparent)',
                    }}
                  >
                    <PiggyBank className="size-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.7rem] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                      Ticket médio
                    </p>
                    <p className="text-lg font-semibold tabular-nums text-[var(--text-primary)] md:text-xl">
                      {formatCurrency(metrics.ticketUltimo)}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <DeltaBadge pct={metrics.pctTicketVsAnt} />
                      <span className="text-[0.75rem] text-[var(--text-tertiary)]">vs mês ant.</span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-xl bg-[var(--bg-elevated)]/85 px-3 py-2.5 shadow-premium">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--clientes)]"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--clientes) 16%, transparent)',
                    }}
                  >
                    <Users className="size-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.7rem] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                      Clientes ativos
                    </p>
                    <p className="text-lg font-semibold tabular-nums text-[var(--text-primary)] md:text-xl">
                      {metrics.clientesUltimo.toLocaleString('pt-BR')}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <DeltaBadge pct={metrics.pctClientesVsAnt} />
                      <span className="text-[0.75rem] text-[var(--text-tertiary)]">únicos no mês</span>
                    </div>
                  </div>
                </div>
              </article>

              <p className="vg-body mt-2 rounded-xl bg-[var(--bg-elevated)]/55 px-3 py-3 leading-relaxed text-stone-500 dark:text-stone-400">
                <span className="font-semibold text-stone-600 dark:text-stone-300">Análise integrada:</span>{' '}
                {analiseChurn}{' '}
                {metrics.pctTicketVsAnt != null && metrics.pctTicketVsAnt > 3
                  ? `O ticket médio avançou ${metrics.pctTicketVsAnt.toFixed(1).replace('.', ',')}%, o que ajuda a compensar oscilações de volume se a taxa de comparecimento se mantiver.`
                  : metrics.pctTicketVsAnt != null && metrics.pctTicketVsAnt < -3
                    ? `O ticket recuou ${Math.abs(metrics.pctTicketVsAnt).toFixed(1).replace('.', ',')}%; vale revisar mix de serviços e upsell sem alongar excessivamente o tempo de cadeira.`
                    : 'Ticket estável em relação ao mês anterior — priorize recorrência e ocupação.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Gráficos principais — tricolumna */}
      <section className="vg-enter space-y-[var(--space-lg)]" style={{ animationDelay: '90ms' }}>
        <div className="grid gap-x-[var(--space-xl)] gap-y-[var(--space-xl)] xl:grid-cols-3 xl:items-stretch">
          <div className="flex h-full min-h-0 flex-col rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium hover-lift md:p-[var(--space-lg)]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5 text-[0.7rem] text-stone-500 dark:text-stone-400">
                <span className="size-2 rounded-full bg-[var(--faturamento)]" aria-hidden />
                Faturamento
              </span>
              <span className="inline-flex items-center gap-1.5 text-[0.7rem] text-stone-500 dark:text-stone-400">
                <span className="size-2 rounded-full bg-[var(--crescimento)]" aria-hidden />
                Ticket médio
              </span>
            </div>
            <p className="vg-section mt-2 text-[var(--text-primary)]">Crescimento do faturamento</p>
            {loading && !rows.length ? (
              <Skeleton className="mt-4 aspect-auto h-[240px] w-full rounded-xl" />
            ) : (
              <ChartContainer config={chartDuploConfig} className="mt-4 aspect-auto h-[240px] w-full">
                <ComposedChart data={metrics.serieFatTicket} margin={{ top: 8, right: 6, left: 0, bottom: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/35" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  />
                  <YAxis
                    yAxisId="l"
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tickFormatter={tickFmtCompact}
                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  />
                  <YAxis
                    yAxisId="r"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    width={36}
                    tickFormatter={tickFmtCompact}
                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />}
                  />
                  <Line
                    yAxisId="l"
                    type="monotone"
                    dataKey="faturamento"
                    stroke="var(--faturamento)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="r"
                    type="monotone"
                    dataKey="ticketMedio"
                    stroke="var(--crescimento)"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ChartContainer>
            )}
            <p className="vg-body mt-auto pt-3 leading-relaxed text-stone-500 dark:text-stone-400">
              O faturamento mensal acompanha o ritmo de atendimentos concluídos; o ticket médio, quando sobe junto,
              indica retenção de valor por cadeira. No período exibido, o último ponto soma{' '}
              <span className="font-medium tabular-nums text-stone-600 dark:text-stone-300">
                {formatCurrency(metrics.serieFatTicket[metrics.serieFatTicket.length - 1]?.faturamento ?? 0)}
              </span>{' '}
              com ticket em{' '}
              <span className="font-medium tabular-nums text-stone-600 dark:text-stone-300">
                {formatCurrency(metrics.serieFatTicket[metrics.serieFatTicket.length - 1]?.ticketMedio ?? 0)}
              </span>
              .
            </p>
          </div>

          <div className="flex h-full min-h-0 flex-col rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium hover-lift md:p-[var(--space-lg)]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5 text-[0.7rem] text-stone-500 dark:text-stone-400">
                <span className="size-2 rounded-full bg-[var(--faturamento)]" aria-hidden />
                Período atual
              </span>
              <span className="inline-flex items-center gap-1.5 text-[0.7rem] text-stone-500 dark:text-stone-400">
                <span className="size-2 rounded-full bg-[var(--text-tertiary)] opacity-70" aria-hidden />
                Mesmo mês (ano ant.)
              </span>
            </div>
            <p className="vg-section mt-2 text-[var(--text-primary)]">Comparação entre períodos</p>
            {loading && !rows.length ? (
              <Skeleton className="mt-4 aspect-auto h-[240px] w-full rounded-xl" />
            ) : (
              <ChartContainer config={chartBarConfig} className="mt-4 aspect-auto h-[240px] w-full">
                <BarChart data={metrics.serieBarrasComparacao} margin={{ top: 8, right: 6, left: 0, bottom: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/35" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tickFormatter={tickFmtCompact}
                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="atual"
                    fill="var(--faturamento)"
                    radius={[4, 4, 0, 0]}
                    name="Atual"
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="anterior"
                    fill="var(--text-tertiary)"
                    fillOpacity={0.45}
                    radius={[4, 4, 0, 0]}
                    name="Ano ant."
                    isAnimationActive={false}
                  />
                </BarChart>
              </ChartContainer>
            )}
            <p className="vg-body mt-auto pt-3 leading-relaxed text-stone-500 dark:text-stone-400">
              Cada par de barras contrasta o faturamento do mês com o mesmo mês do ano anterior. O recorte ajuda a
              separar sazonalidade de mudança estrutural: quando o azul permanece acima do cinza em sequência, o
              crescimento tende a ser consistente ano contra ano.
            </p>
          </div>

          <div className="flex h-full min-h-0 flex-col rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium hover-lift md:p-[var(--space-lg)]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5 text-[0.7rem] text-stone-500 dark:text-stone-400">
                <span className="size-2 rounded-full bg-[var(--faturamento)]" aria-hidden />
                Realizado
              </span>
              <span className="inline-flex items-center gap-1.5 text-[0.7rem] text-stone-500 dark:text-stone-400">
                <span className="size-2 rounded-full border-2 border-dashed border-[var(--crescimento)] bg-transparent" aria-hidden />
                Projeção
              </span>
            </div>
            <p className="vg-section mt-2 text-[var(--text-primary)]">Projeção de faturamento</p>
            {loading && !rows.length ? (
              <Skeleton className="mt-4 aspect-auto h-[240px] w-full rounded-xl" />
            ) : (
              <ChartContainer config={chartProjConfig} className="mt-4 aspect-auto h-[240px] w-full">
                <LineChart data={metrics.serieProjecaoChart} margin={{ top: 8, right: 6, left: 0, bottom: 4 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/35" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tickFormatter={tickFmtCompact}
                    tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="realizado"
                    stroke="var(--faturamento)"
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="linear"
                    dataKey="projecao"
                    stroke="var(--crescimento)"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={{ r: 3, fill: 'var(--crescimento)' }}
                    connectNulls
                    isAnimationActive={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
            <p className="vg-body mt-auto pt-3 leading-relaxed text-stone-500 dark:text-stone-400">
              A linha pontilhada extrapola o ritmo recente (últimos meses e variação mês a mês) para uma janela de ~30
              dias. Valor indicativo:{' '}
              <span className="font-medium tabular-nums text-stone-600 dark:text-stone-300">
                {formatCurrency(metrics.projecao30Valor)}
              </span>{' '}
              (
              {metrics.projecao30Pct >= 0 ? '+' : ''}
              {metrics.projecao30Pct.toFixed(1).replace('.', ',')}% vs último mês fechado).
            </p>
          </div>
        </div>
      </section>

      {/* Análises e previsões — wide */}
      <section className="vg-enter space-y-[var(--space-lg)]" style={{ animationDelay: '120ms' }}>
        <div>
          <p className="vg-section text-[var(--text-primary)]">Análises e previsões</p>
          <div className="mt-2 h-px w-full max-w-xl bg-gradient-to-r from-[var(--text-tertiary)]/35 to-transparent" />
        </div>
        <div className="flex flex-col gap-[var(--space-xl)]">
          <article className="rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium hover-lift md:p-[var(--space-lg)]">
            <div className="flex gap-[var(--space-md)]">
              <span
                className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--crescimento)]"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--crescimento) 16%, transparent)',
                }}
              >
                <TrendingUp className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="vg-section text-[var(--text-primary)]">Crescimento projetado</p>
                <p className="vg-body mt-2 leading-relaxed text-stone-500 dark:text-stone-400">
                  Com base na tendência do último mês fechado ({metrics.ultimoMesFechadoLabel}) e na variação mês a mês
                  de {fmtPctSigned(metrics.crescimentoMoM)}, o faturamento pode avançar cerca de{' '}
                  <span className="font-semibold tabular-nums text-stone-600 dark:text-stone-300">
                    {metrics.projecao30Pct.toFixed(1).replace('.', ',')}%
                  </span>{' '}
                  na janela de ~30 dias, aproximando-se de{' '}
                  <span className="font-semibold tabular-nums text-stone-600 dark:text-stone-300">
                    {formatCurrency(metrics.projecao30Valor)}
                  </span>
                  — valor modelo, não garantia contratual.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="h-14 min-w-0 flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={metrics.serieProjecaoChart.map((p) => ({
                          l: p.label,
                          v: p.realizado ?? p.projecao ?? 0,
                        }))}
                        margin={{ top: 2, right: 2, left: 0, bottom: 0 }}
                      >
                        <Line
                          type="monotone"
                          dataKey="v"
                          stroke="var(--faturamento)"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <Link
                    href={`${base}/relatorios/visao-geral`}
                    className="vg-small inline-flex shrink-0 items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
                  >
                    Ver detalhamento <ChevronRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium hover-lift md:p-[var(--space-lg)]">
            <div className="flex gap-[var(--space-md)]">
              <span
                className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--clientes)]"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--clientes) 16%, transparent)',
                }}
              >
                <CalendarRange className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="vg-section text-[var(--text-primary)]">Sazonalidade</p>
                <p className="vg-body mt-2 leading-relaxed text-stone-500 dark:text-stone-400">
                  {metrics.sazonalidadeMesesDestaque.length >= 2
                    ? `No histórico carregado, ${metrics.sazonalidadeMesesDestaque[0]} e ${metrics.sazonalidadeMesesDestaque[1]} concentram parte relevante da receita — antecipe escala de equipe e estoque nesses meses.`
                    : metrics.sazonalidadeMesesDestaque.length === 1
                      ? `O mês de ${metrics.sazonalidadeMesesDestaque[0]} se destaca no acumulado; use isso para campanhas e folgas da equipe.`
                      : 'Ainda há poucos meses com volume comparável no recorte — amplie o período ou aguarde mais fechamentos para ler sazonalidade com segurança.'}
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="grid w-full max-w-md grid-cols-12 gap-1">
                    {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((abbr, i) => (
                      <div key={`saz-${i}`} className="flex flex-col items-center gap-1">
                        <div
                          className="aspect-square w-full max-w-[1.4rem] rounded-sm"
                          style={{
                            backgroundColor: `color-mix(in srgb, var(--faturamento) ${Math.round((heatSazonalidade[i] ?? 0) * 85 + 15)}%, var(--bg-elevated))`,
                          }}
                          title={`Intensidade ${Math.round((heatSazonalidade[i] ?? 0) * 100)}%`}
                        />
                        <span className="text-[0.6rem] text-stone-400">{abbr}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`${base}/relatorios/visao-geral`}
                    className="vg-small inline-flex shrink-0 items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
                  >
                    Ver histórico <ChevronRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium hover-lift md:p-[var(--space-lg)]">
            <div className="flex gap-[var(--space-md)]">
              <span
                className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--faturamento)]"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--faturamento) 16%, transparent)',
                }}
              >
                <Users className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="vg-section text-[var(--text-primary)]">Comportamento de clientes</p>
                <p className="vg-body mt-2 leading-relaxed text-stone-500 dark:text-stone-400">
                  {metrics.medianaDiasEntreVisitas != null
                    ? `A mediana de dias entre visitas do mesmo cliente ficou em ${Math.round(metrics.medianaDiasEntreVisitas)} dias no histórico analisado. Ciclos mais longos podem indicar concorrência ou menor urgência percebida — vale reforçar lembretes e benefícios de recorrência.`
                    : 'Com poucas visitas repetidas por cliente no período, o indicador de intervalo entre cortes ainda não estabilizou; concentre-se em volume e taxa de retorno primeiro.'}
                </p>
                <Link
                  href={`${base}/clientes`}
                  className="vg-small mt-4 inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  Ver base de clientes <ChevronRight className="size-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </article>

          <article className="rounded-3xl bg-[var(--bg-card)] p-[var(--space-md)] shadow-premium hover-lift md:p-[var(--space-lg)]">
            <div className="flex gap-[var(--space-md)]">
              <span
                className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--brand-primary)]"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--brand-primary) 14%, transparent)',
                }}
              >
                <Target className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="vg-section text-[var(--text-primary)]">Ações recomendadas</p>
                <p className="vg-body mt-2 text-stone-500 dark:text-stone-400">
                  Com base nos dados do período e no último mês fechado:
                </p>
                <ol className="vg-body mt-3 list-decimal space-y-2 pl-5 leading-relaxed text-stone-500 dark:text-stone-400">
                  <li>
                    {metrics.clientesInativosEstimados > 0
                      ? `Campanha para reativar clientes sem visita há 90+ dias (${metrics.clientesInativosEstimados} identificados no recorte).`
                      : 'Monitorar clientes que não repetem após o primeiro corte — amplie o histórico para quantificar inativos.'}
                  </li>
                  <li>
                    Promoção ou pacotes curtos para horários ociosos (ex.: 14h–16h), alinhada ao relatório operacional.
                  </li>
                  <li>
                    {metrics.pctTicketVsAnt != null && metrics.pctTicketVsAnt < 3
                      ? `Treino de upsell e combos para elevar ticket — ritmo atual (${fmtPctSigned(metrics.pctTicketVsAnt)} vs mês anterior) ainda deixa margem para composição de serviços.`
                      : 'Manter disciplina de upsell onde o ticket já reage bem, sem sacrificar tempo de cadeira.'}
                  </li>
                </ol>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                  <Link
                    href={`${base}/relatorios/operacao`}
                    className="vg-small inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
                  >
                    Abrir operacional <ChevronRight className="size-3.5" aria-hidden />
                  </Link>
                  <Link
                    href={`${base}/clientes`}
                    className="vg-small inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
                  >
                    Criar plano de ação <ChevronRight className="size-3.5" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
      </div>
    </PageContent>
  )
}

function HeroGrowthBlock({
  title,
  subtitle,
  pct,
  spark,
  loading,
}: {
  title: string
  subtitle: string
  pct: number | null
  spark: { label: string; v: number }[]
  loading: boolean
}) {
  return (
    <div className="rounded-2xl bg-[var(--bg-card)]/90 p-5 shadow-premium backdrop-blur-sm dark:bg-[var(--bg-card)]/70">
      <p className="vg-small font-medium uppercase tracking-wider text-[var(--text-tertiary)]">{title}</p>
      {loading ? (
        <Skeleton className="mt-3 h-10 w-32" />
      ) : (
        <p className="vg-display mt-2 tabular-nums text-[var(--crescimento)]">{fmtPctSigned(pct)}</p>
      )}
      <p className="vg-small mt-1 text-[var(--text-secondary)]">{subtitle}</p>
      <div className="mt-4">{loading ? <Skeleton className="h-12 w-full rounded-lg" /> : <SparkFaturamento data={spark} />}</div>
    </div>
  )
}
