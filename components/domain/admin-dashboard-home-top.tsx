'use client'

import type { ReactNode } from 'react'
import { useMemo } from 'react'
import {
  Calendar,
  CalendarDays,
  DollarSign,
  Scissors,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { AdminDashboardStatusHoje } from '@/lib/build-admin-dashboard-status-hoje'
import type { DashboardFatDiarioPonto } from '@/types/admin-dashboard'

function localYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDaysLocal(d: Date, delta: number): Date {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  t.setDate(t.getDate() + delta)
  return t
}

function formatDataLongaPt(d: Date): string {
  const raw = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
  const parts = raw.split(' de ')
  if (parts.length >= 3) {
    const dia = parts[0]!
    const mes = parts[1]!.charAt(0).toUpperCase() + parts[1]!.slice(1)
    const ano = parts[2]!
    return `${dia} de ${mes}, ${ano}`
  }
  if (parts.length >= 2) {
    const cap = parts[1]!.charAt(0).toUpperCase() + parts[1]!.slice(1)
    return `${parts[0]} de ${cap}`
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function DeltaLine({
  valuePct,
  label,
  emptyHint,
  invert,
}: {
  valuePct: number | null
  label: string
  emptyHint?: string
  /** true = queda numérica é “positiva” visualmente (ex.: custo). */
  invert?: boolean
}) {
  if (valuePct == null || !Number.isFinite(valuePct)) {
    return (
      <span className="text-muted-foreground text-xs font-medium">{emptyHint ?? `— ${label}`}</span>
    )
  }
  const effective = invert ? -valuePct : valuePct
  const up = effective >= 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold tabular-nums',
        up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {up ? '+' : ''}
      {Math.round(valuePct)}% {label}
    </span>
  )
}

function KpiTile(props: {
  label: string
  value: string
  deltaPct: number | null
  deltaLabel: string
  deltaEmptyHint?: string
  invertDelta?: boolean
  icon: typeof DollarSign
  iconWrapClass: string
  iconClass: string
  footer?: ReactNode
}) {
  const I = props.icon
  return (
    <Card className="border-border/80 overflow-hidden shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4 pt-5">
        <div
          className={cn(
            'flex size-11 items-center justify-center rounded-full',
            props.iconWrapClass,
          )}
        >
          <I className={cn('size-5', props.iconClass)} aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium leading-tight">{props.label}</p>
          <p className="text-foreground text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{props.value}</p>
          {props.footer ?? (
            <DeltaLine
              valuePct={props.deltaPct}
              label={props.deltaLabel}
              emptyHint={props.deltaEmptyHint}
              invert={props.invertDelta}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export type AdminDashboardHomeStats = {
  agendamentosHoje: number
  agendamentosMes: number
  faturamentoHoje: number
  faturamentoMes: number
  totalClientes: number
  totalBarbeiros: number
}

export function AdminDashboardHomeTop(props: {
  userPrimeiroNome: string | null
  barbeariaNome: string | null
  stats: AdminDashboardHomeStats | null
  statusHoje: AdminDashboardStatusHoje | null
  fatDiario: DashboardFatDiarioPonto[]
  mediaAgendamentosPorDia14d: number
  clientesNovosUltimos7Dias: number
  isLoading: boolean
  error: string | null
  notificationsSlot: ReactNode
}) {
  const {
    userPrimeiroNome,
    barbeariaNome,
    stats,
    statusHoje,
    fatDiario,
    mediaAgendamentosPorDia14d,
    clientesNovosUltimos7Dias,
    isLoading,
    error,
    notificationsSlot,
  } = props

  const hoje = useMemo(() => new Date(), [])
  const dataFormatada = useMemo(() => formatDataLongaPt(hoje), [hoje])

  const fatOntem = useMemo(() => {
    const y = localYmd(addDaysLocal(hoje, -1))
    return fatDiario.find((p) => p.data === y)?.faturamento ?? 0
  }, [fatDiario, hoje])

  const saudacao = userPrimeiroNome
    ? `Olá, ${userPrimeiroNome}! 👋`
    : 'Olá! 👋'

  const pctFatVsOntem =
    stats && fatOntem > 0
      ? ((stats.faturamentoHoje - fatOntem) / fatOntem) * 100
      : stats && stats.faturamentoHoje > 0 && fatOntem <= 0
        ? 100
        : null

  const pctAgVsMedia =
    stats && mediaAgendamentosPorDia14d > 0
      ? ((stats.agendamentosHoje - mediaAgendamentosPorDia14d) / mediaAgendamentosPorDia14d) * 100
      : stats && stats.agendamentosHoje > 0 && mediaAgendamentosPorDia14d <= 0
        ? 100
        : null

  const pctAtendMeta =
    statusHoje && statusHoje.metaAtendimentos > 0
      ? (statusHoje.atendimentosConcluidos / statusHoje.metaAtendimentos) * 100 - 100
      : null

  const vendasVar = statusHoje?.vendasVariacaoPct ?? null

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">{saudacao}</h1>
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            Aqui está o resumo do seu negócio hoje
            {barbeariaNome ? (
              <>
                {' '}
                em <span className="text-foreground font-medium">{barbeariaNome}</span>.
              </>
            ) : (
              '.'
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:flex-col sm:items-end md:flex-row md:items-center">
          <div className="border-border/80 bg-card/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm">
            <Calendar className="text-accent size-4 shrink-0" aria-hidden />
            <span className="text-foreground tabular-nums">{dataFormatada}</span>
          </div>
          {notificationsSlot ? <div className="flex items-center gap-1">{notificationsSlot}</div> : null}
        </div>
      </div>

      {error ? (
        <p className="text-muted-foreground text-sm">Indicadores indisponíveis enquanto houver erro ao carregar dados.</p>
      ) : isLoading || !stats || !statusHoje ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-muted h-36 animate-pulse rounded-xl border border-border/60" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <KpiTile
            label="Faturamento hoje"
            value={formatCurrency(stats.faturamentoHoje)}
            deltaPct={pctFatVsOntem}
            deltaLabel="vs. ontem"
            deltaEmptyHint="— sem faturamento ontem"
            icon={DollarSign}
            iconWrapClass="bg-amber-500/15 text-amber-700 dark:text-amber-400"
            iconClass="text-amber-700 dark:text-amber-400"
          />
          <KpiTile
            label="Agendamentos hoje"
            value={String(stats.agendamentosHoje)}
            deltaPct={pctAgVsMedia}
            deltaLabel="vs. média 14d"
            deltaEmptyHint="— sem histórico 14d"
            icon={CalendarDays}
            iconWrapClass="bg-sky-500/15 text-sky-700 dark:text-sky-400"
            iconClass="text-sky-700 dark:text-sky-400"
          />
          <KpiTile
            label="Atendimentos concluídos"
            value={String(statusHoje.atendimentosConcluidos)}
            deltaPct={pctAtendMeta}
            deltaLabel="vs. meta"
            deltaEmptyHint="— meta indisponível"
            icon={Scissors}
            iconWrapClass="bg-orange-500/15 text-orange-800 dark:text-orange-400"
            iconClass="text-orange-800 dark:text-orange-400"
          />
          <KpiTile
            label="Clientes na base"
            value={String(stats.totalClientes)}
            deltaPct={null}
            deltaLabel=""
            icon={Users}
            iconWrapClass="bg-emerald-500/15 text-emerald-800 dark:text-emerald-400"
            iconClass="text-emerald-800 dark:text-emerald-400"
            footer={
              clientesNovosUltimos7Dias > 0 ? (
                <span className="inline-flex flex-wrap items-center gap-x-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="size-3.5 shrink-0" aria-hidden />
                  <span>+{clientesNovosUltimos7Dias}</span>
                  <span>
                    novos (7d)
                    {stats.totalClientes > 0 ? (
                      <span className="text-muted-foreground font-normal">
                        {' '}
                        · {Math.round((clientesNovosUltimos7Dias / stats.totalClientes) * 100)}% da base
                      </span>
                    ) : null}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground text-xs font-medium">0 novos nos últimos 7 dias</span>
              )
            }
          />
          <div className="col-span-2 lg:col-span-1">
            <KpiTile
              label="Vendas (produtos)"
              value={String(statusHoje.vendasProdutosUnidades)}
              deltaPct={vendasVar}
              deltaLabel="vs. semana ant."
              deltaEmptyHint="— sem base na semana anterior"
              icon={ShoppingBag}
              iconWrapClass="bg-violet-500/15 text-violet-800 dark:text-violet-300"
              iconClass="text-violet-800 dark:text-violet-300"
            />
          </div>
        </div>
      )}
    </div>
  )
}
