'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import {
  ArrowRight,
  BarChart3,
  Calendar,
  ClipboardList,
  DollarSign,
  LayoutGrid,
  Package,
  Scissors,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { AppointmentStatusBadge } from '@/components/shared/status-badge'
import {
  AdminDashboardAppointmentRowSkeleton,
  ClienteHomeBarbeariaSkeleton,
  StatCardSkeletonGrid,
} from '@/components/shared/loading-skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatCurrency, formatTime } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Agendamento, Barbearia } from '@/types'
import type { AlertaDashboard, DashboardFatDiarioPonto } from '@/types/admin-dashboard'

export interface AdminDashboardStats {
  agendamentosHoje: number
  agendamentosMes: number
  faturamentoHoje: number
  faturamentoMes: number
  totalClientes: number
  totalBarbeiros: number
}

const chartConfig = {
  fat: {
    label: 'Faturamento',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

function alertaTipoClasses(tipo: AlertaDashboard['tipo']) {
  switch (tipo) {
    case 'urgente':
      return 'border-l-red-500 bg-red-500/[0.06] dark:bg-red-500/10'
    case 'atencao':
      return 'border-l-amber-500 bg-amber-500/[0.07] dark:bg-amber-500/10'
    case 'oportunidade':
      return 'border-l-emerald-500 bg-emerald-500/[0.06] dark:bg-emerald-500/10'
    default:
      return 'border-l-sky-500 bg-sky-500/[0.06] dark:bg-sky-500/10'
  }
}

function IconWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/80 shadow-sm',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function AdminDashboardPremium(props: {
  base: string
  barbearia: Barbearia | null
  stats: AdminDashboardStats | null
  proximosAgendamentos: Agendamento[]
  fatDiario: DashboardFatDiarioPonto[]
  tendenciaInsight: string
  alertas: AlertaDashboard[]
  isLoading: boolean
  error: string | null
  pagamentoPendentePlano: boolean
  operacaoLiberada: boolean
}) {
  const {
    base,
    barbearia,
    stats,
    proximosAgendamentos,
    fatDiario,
    tendenciaInsight,
    alertas,
    isLoading,
    error,
    pagamentoPendentePlano,
    operacaoLiberada,
  } = props

  const chartData = useMemo(
    () => fatDiario.map((p) => ({ ...p, fat: Math.round(p.faturamento * 100) / 100 })),
    [fatDiario],
  )

  const acoesRapidas = useMemo(() => {
    if (!operacaoLiberada) {
      return [
        { label: 'Assinatura', href: `${base}/assinatura`, icon: Wallet },
        { label: 'Configurações', href: `${base}/configuracoes`, icon: LayoutGrid },
      ] as const
    }
    return [
      { label: 'Agendamentos', href: `${base}/agendamentos`, icon: Calendar },
      { label: 'Clientes', href: `${base}/clientes`, icon: Users },
      { label: 'Comandas', href: `${base}/comandas`, icon: ClipboardList },
      { label: 'Financeiro', href: `${base}/financeiro`, icon: DollarSign },
      { label: 'Estoque', href: `${base}/estoque`, icon: Package },
      { label: 'Relatórios', href: `${base}/relatorios`, icon: BarChart3 },
    ] as const
  }, [base, operacaoLiberada])

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Seção 1 — Alertas (sticky abaixo do header global) */}
      {!error && (
        <div
          className={cn(
            'sticky top-16 z-30 -mx-4 border-b border-border/70 bg-background/90 px-4 py-3 shadow-sm backdrop-blur-md md:-mx-6 md:px-6 lg:-mx-8 lg:px-8',
            'dark:border-zinc-800/80 dark:bg-zinc-950/90',
          )}
          role="region"
          aria-label="Alertas inteligentes"
        >
          <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wider">
            Tem problema?
          </p>
          {isLoading ? (
            <div className="space-y-2">
              <div className="bg-muted h-14 animate-pulse rounded-lg" />
              <div className="bg-muted h-14 animate-pulse rounded-lg md:hidden" />
            </div>
          ) : (
            <div className="max-h-[min(40vh,220px)] space-y-2 overflow-y-auto pr-1">
              {alertas.map((a) => {
                const Icon = a.icone
                return (
                  <div
                    key={a.id}
                    className={cn(
                      'flex flex-col gap-2 rounded-lg border border-border/60 border-l-4 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
                      alertaTipoClasses(a.tipo),
                    )}
                  >
                    <div className="flex min-w-0 flex-1 gap-3">
                      <IconWrap>
                        <Icon className="text-foreground h-4 w-4" aria-hidden />
                      </IconWrap>
                      <div className="min-w-0">
                        <p className="text-foreground text-sm font-semibold leading-snug">{a.titulo}</p>
                        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{a.descricao}</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" className="shrink-0 gap-1 self-start sm:self-center" asChild>
                      <Link href={a.link}>
                        {a.acao}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_min(280px,32%)] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-6 md:space-y-8">
          {/* Hero operação */}
          {!error &&
            (isLoading ? (
              <ClienteHomeBarbeariaSkeleton />
            ) : barbearia ? (
              <Card className="overflow-hidden border-border/80 bg-gradient-to-br from-accent/15 via-background to-background dark:from-accent/10">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-accent flex h-14 w-14 items-center justify-center rounded-xl shadow-inner">
                      <Scissors className="text-accent-foreground h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight">{barbearia.nome}</h2>
                      <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Central de comando
                        </span>
                        <span className="text-border hidden sm:inline">·</span>
                        <span>Visão em tempo real</span>
                      </p>
                    </div>
                  </div>
                  {pagamentoPendentePlano ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`${base}/assinatura`}>Concluir ativação</Link>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="hidden sm:inline-flex" asChild>
                      <Link href={`${base}/relatorios`}>Relatórios</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : null)}

          {/* Seção 2 — Status hoje */}
          <section aria-labelledby="dash-status-heading">
            <div className="mb-3 flex items-end justify-between gap-2">
              <div>
                <h2 id="dash-status-heading" className="text-base font-semibold tracking-tight">
                  Como estamos hoje?
                </h2>
                <p className="text-muted-foreground text-xs">Indicadores principais da operação</p>
              </div>
            </div>
            {isLoading ? (
              <StatCardSkeletonGrid count={6} className="md:grid-cols-3 xl:grid-cols-6" />
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-6">
                <Card className="border-border/80 shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-[11px] font-medium uppercase tracking-wide">Hoje</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold tabular-nums">{stats?.agendamentosHoje ?? 0}</p>
                    <p className="text-muted-foreground text-xs">Agendamentos</p>
                  </CardContent>
                </Card>
                <Card className="border-border/80 shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="text-[11px] font-medium uppercase tracking-wide">Hoje</span>
                    </div>
                    <p className="mt-2 text-lg font-bold tabular-nums leading-tight sm:text-xl">
                      {formatCurrency(stats?.faturamentoHoje ?? 0)}
                    </p>
                    <p className="text-muted-foreground text-xs">Faturamento</p>
                  </CardContent>
                </Card>
                <Card className="border-border/80 shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-[11px] font-medium uppercase tracking-wide">Mês</span>
                    </div>
                    <p className="mt-2 text-lg font-bold tabular-nums leading-tight sm:text-xl">
                      {formatCurrency(stats?.faturamentoMes ?? 0)}
                    </p>
                    <p className="text-muted-foreground text-xs">Faturamento acumulado</p>
                  </CardContent>
                </Card>
                <Card className="border-border/80 shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-[11px] font-medium uppercase tracking-wide">Mês</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold tabular-nums">{stats?.agendamentosMes ?? 0}</p>
                    <p className="text-muted-foreground text-xs">Agendamentos</p>
                  </CardContent>
                </Card>
                <Card className="border-border/80 shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-[11px] font-medium uppercase tracking-wide">Base</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold tabular-nums">{stats?.totalClientes ?? 0}</p>
                    <p className="text-muted-foreground text-xs">Clientes</p>
                  </CardContent>
                </Card>
                <Card className="border-border/80 shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="text-[11px] font-medium uppercase tracking-wide">Equipe</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold tabular-nums">{stats?.totalBarbeiros ?? 0}</p>
                    <p className="text-muted-foreground text-xs">Barbeiros ativos</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </section>

          {/* Seção 3 — Tendências */}
          <section aria-labelledby="dash-tendencias-heading">
            <Card className="border-border/80">
              <CardHeader className="pb-2">
                <CardTitle id="dash-tendencias-heading" className="text-base">
                  Estamos crescendo?
                </CardTitle>
                <CardDescription>Faturamento confirmado (concluído) nos últimos 14 dias</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="bg-muted h-[220px] animate-pulse rounded-lg" />
                ) : (
                  <>
                    <ChartContainer
                      config={chartConfig}
                      className="aspect-auto h-[220px] w-full min-h-[200px] justify-stretch [&_.recharts-responsive-container]:!h-full"
                    >
                      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="dashFatFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-fat)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--color-fat)" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} className="stroke-border/50" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis
                          width={48}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) =>
                            typeof v === 'number' && v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                          }
                        />
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value) => formatCurrency(Number(value))}
                              labelFormatter={(_, payload) => {
                                const row = payload?.[0]?.payload as DashboardFatDiarioPonto | undefined
                                return row?.label ? `Dia ${row.label}` : '—'
                              }}
                            />
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="fat"
                          name="fat"
                          stroke="var(--color-fat)"
                          fill="url(#dashFatFill)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ChartContainer>
                    <p className="text-muted-foreground border-t border-border/60 pt-3 text-sm leading-relaxed">
                      {tendenciaInsight}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Próximos agendamentos */}
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Agenda de hoje</CardTitle>
              <Link href={`${base}/agendamentos`}>
                <Button variant="ghost" size="sm" className="text-muted-foreground h-auto p-0 text-xs">
                  Ver todos
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {error ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  Não foi possível exibir os agendamentos.
                </p>
              ) : isLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <AdminDashboardAppointmentRowSkeleton key={i} />
                  ))}
                </div>
              ) : proximosAgendamentos.length > 0 ? (
                proximosAgendamentos.map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="border-border/80 flex items-center gap-3 rounded-lg border bg-card/50 p-3"
                  >
                    <div className="bg-primary text-primary-foreground flex h-10 w-10 flex-col items-center justify-center rounded-md text-center shadow-sm">
                      <span className="text-sm font-bold leading-none">
                        {formatTime(agendamento.horario).split(':')[0]}
                      </span>
                      <span className="text-[10px] leading-none">
                        :{formatTime(agendamento.horario).split(':')[1]}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{agendamento.cliente?.nome}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {agendamento.servico?.nome} — {agendamento.barbeiro?.nome ?? '—'}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={agendamento.status} />
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground py-6 text-center text-sm">
                  Nenhum agendamento ativo para hoje neste recorte.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seção 4 — Ações rápidas (desktop lateral) */}
        <aside
          className="border-border/80 bg-card/40 mt-6 hidden shrink-0 rounded-xl border p-4 lg:sticky lg:top-[calc(4rem+1rem)] lg:mt-0 lg:block lg:self-start"
          aria-label="Ações rápidas"
        >
          <p className="text-muted-foreground mb-3 text-[10px] font-semibold uppercase tracking-wider">
            O que faço agora?
          </p>
          <nav className="flex flex-col gap-2">
            {acoesRapidas.map((item) => {
              const I = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:bg-accent/50 flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-colors"
                >
                  <I className="text-muted-foreground h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                  <ArrowRight className="text-muted-foreground ml-auto h-3.5 w-3.5" />
                </Link>
              )
            })}
          </nav>
        </aside>
      </div>

      {/* Ações rápidas — mobile (acima da bottom nav do shell) */}
      <section className="lg:hidden" aria-label="Atalhos rápidos">
        <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wider">
          O que faço agora?
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {acoesRapidas.map((item) => {
            const I = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="border-border/80 bg-card/80 flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium shadow-sm"
              >
                <I className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
