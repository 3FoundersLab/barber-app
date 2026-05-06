'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Line, LineChart, ResponsiveContainer } from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  Building2,
  CalendarRange,
  Check,
  ChevronRight,
  Download,
  Lock,
  Minus,
  PiggyBank,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react'
import { format } from 'date-fns'
import { PageContent } from '@/components/shared/page-container'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { getAuthUserSafe } from '@/lib/supabase/get-auth-user-safe'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { computeTendenciasFromRows, fetchTendenciasAgendamentos } from '@/lib/relatorios-tendencias-data'
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
        <div className="flex flex-col gap-[var(--space-md)] xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 space-y-[var(--space-sm)]">
            <h1 className="vg-display text-[var(--text-primary)]">Tendências</h1>
            <p className="vg-body max-w-2xl text-[var(--text-secondary)]">
              Analise o crescimento e projeções operacionais do negócio com base em faturamento concluído e base de
              clientes.
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

            <span className="vg-body inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 text-[var(--text-secondary)] shadow-premium">
              <Building2 className="size-3.5 shrink-0 opacity-70" aria-hidden />
              Todas as unidades
            </span>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground"
              disabled={loading || rows.length === 0}
              onClick={exportCsv}
              aria-label="Exportar CSV"
            >
              <Download className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero crescimento */}
      <section className="vg-enter" style={{ animationDelay: '60ms' }}>
        <div
          className={cn(
            'overflow-hidden rounded-3xl p-[var(--space-lg)] shadow-premium hover-lift md:p-[var(--space-xl)]',
            'bg-gradient-to-br from-emerald-50/95 via-white to-[var(--bg-card)]',
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
      <section className="grid gap-[var(--space-lg)] lg:grid-cols-2">
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
            <div className="mt-[var(--space-md)] space-y-[var(--space-lg)]">
              <div className="rounded-2xl bg-[var(--bg-elevated)]/75 p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--accent-faturamento)]"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-faturamento) 16%, transparent)',
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
                        className="h-full rounded-full bg-[var(--accent-faturamento)] transition-all"
                        style={{ width: `${barAtualPct}%` }}
                      />
                    </div>
                    <p className="vg-small mt-2 text-[var(--text-tertiary)]">
                      Último mês fechado — barra proporcional ao maior valor do par.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-0 bg-[var(--bg-elevated)]/50 p-4">
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
                        className="h-full rounded-full bg-[var(--text-tertiary)]/45 transition-all"
                        style={{ width: `${barAntPct}%` }}
                      />
                    </div>
                    <p className="vg-small mt-2 text-[var(--text-tertiary)]">Mês imediatamente anterior.</p>
                  </div>
                </div>
              </div>

              <p className="vg-body leading-relaxed text-[var(--text-secondary)]">
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
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ) : (
            <div className="mt-[var(--space-md)] flex flex-1 flex-col gap-[var(--space-sm)]">
              <article className="rounded-2xl bg-[var(--bg-elevated)]/85 px-4 py-3.5 shadow-premium">
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--churn-metric)]"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--churn-metric) 16%, transparent)',
                    }}
                  >
                    <Ban className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="vg-small font-medium text-[var(--text-tertiary)]">Churn de base (mês a mês)</p>
                    <p className="vg-display mt-1 tabular-nums text-[var(--churn-metric)]">
                      {metrics.churnUltimoPct.toFixed(1).replace('.', ',')}%
                    </p>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-card)]">
                      <div
                        className="h-full rounded-full bg-[var(--churn-metric)]/90"
                        style={{ width: `${churnBarWidth}%` }}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="vg-small text-[var(--text-tertiary)]">
                        Variação vs par anterior:{' '}
                        <span
                          className={cn(
                            'font-semibold tabular-nums',
                            metrics.deltaChurnPontos > 0.5
                              ? 'text-[var(--churn-metric)]'
                              : 'text-[var(--text-secondary)]',
                          )}
                        >
                          {metrics.deltaChurnPontos >= 0 ? '+' : ''}
                          {metrics.deltaChurnPontos.toFixed(1).replace('.', ',')} p.p.
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl bg-[var(--bg-elevated)]/85 px-4 py-3.5 shadow-premium">
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--accent-ticket)]"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-ticket) 16%, transparent)',
                    }}
                  >
                    <PiggyBank className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="vg-small font-medium text-[var(--text-tertiary)]">Ticket médio</p>
                    <p className="vg-display mt-1 tabular-nums text-[var(--text-primary)]">
                      {formatCurrency(metrics.ticketUltimo)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <DeltaBadge pct={metrics.pctTicketVsAnt} />
                      <span className="vg-small text-[var(--text-tertiary)]">vs mês anterior</span>
                    </div>
                  </div>
                </div>
              </article>

              <article className="rounded-2xl bg-[var(--bg-elevated)]/85 px-4 py-3.5 shadow-premium">
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--accent-novos)]"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-novos) 16%, transparent)',
                    }}
                  >
                    <Users className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="vg-small font-medium text-[var(--text-tertiary)]">Clientes ativos</p>
                    <p className="vg-display mt-1 tabular-nums text-[var(--text-primary)]">
                      {metrics.clientesUltimo.toLocaleString('pt-BR')}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <DeltaBadge pct={metrics.pctClientesVsAnt} />
                      <span className="vg-small text-[var(--text-tertiary)]">vs mês anterior (únicos no mês)</span>
                    </div>
                  </div>
                </div>
              </article>

              <p className="vg-body mt-1 rounded-2xl bg-[var(--bg-elevated)]/60 px-4 py-3.5 leading-relaxed text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">Leitura integrada:</span> {analiseChurn}{' '}
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
