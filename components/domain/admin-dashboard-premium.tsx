'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
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
  Users,
  Wallet,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { AppointmentStatusBadge } from '@/components/shared/status-badge'
import {
  AdminDashboardHomeTop,
  type AdminDashboardHomeStats,
} from '@/components/domain/admin-dashboard-home-top'
import { AdminDashboardAppointmentRowSkeleton } from '@/components/shared/loading-skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { DashboardAlertaRow } from '@/components/domain/admin-dashboard-alerta-row'
import { formatCurrency, formatTime } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { AdminDashboardStatusHoje } from '@/lib/build-admin-dashboard-status-hoje'
import type { Agendamento, Barbearia } from '@/types'
import type { AlertaDashboard, DashboardFatDiarioPonto } from '@/types/admin-dashboard'

const chartConfig = {
  fat: {
    label: 'Faturamento',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

const MAX_ALERTAS_PREVIEW = 3

export function AdminDashboardPremium(props: {
  base: string
  barbearia: Barbearia | null
  userPrimeiroNome: string | null
  stats: AdminDashboardHomeStats | null
  mediaAgendamentosPorDia14d: number
  clientesNovosUltimos7Dias: number
  proximosAgendamentos: Agendamento[]
  fatDiario: DashboardFatDiarioPonto[]
  tendenciaInsight: string
  alertas: AlertaDashboard[]
  isLoading: boolean
  error: string | null
  pagamentoPendentePlano: boolean
  operacaoLiberada: boolean
  statusHoje: AdminDashboardStatusHoje | null
  notificationsSlot: ReactNode
  /** Abre o sheet de notificações (ex.: “Ver mais” quando há mais de 3 alertas). */
  onVerMaisNotificacoes?: () => void
  /** Marca alerta como lida (some da faixa; continua opaca no sheet). */
  onMarcarAlertaLido?: (id: string) => void
  /** Arquivar alerta (faixa + sheet; mesma origem de estado do painel). */
  onArquivarAlerta?: (id: string) => void
  /** Ocultar categoria de alerta (menu ⋮). */
  onOcultarTipoAlerta?: (tipo: AlertaDashboard['tipo']) => void
  /** Desmarcar como lida (menu ⋮ na faixa). */
  onDesmarcarAlertaLido?: (id: string) => void
}) {
  const {
    base,
    barbearia,
    userPrimeiroNome,
    stats,
    mediaAgendamentosPorDia14d,
    clientesNovosUltimos7Dias,
    proximosAgendamentos,
    fatDiario,
    tendenciaInsight,
    alertas,
    isLoading,
    error,
    pagamentoPendentePlano,
    operacaoLiberada,
    statusHoje,
    notificationsSlot,
    onVerMaisNotificacoes,
    onMarcarAlertaLido,
    onArquivarAlerta,
    onOcultarTipoAlerta,
    onDesmarcarAlertaLido,
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

  const usarSheetAlertas = alertas.length > MAX_ALERTAS_PREVIEW
  const alertasPreview = usarSheetAlertas ? alertas.slice(0, MAX_ALERTAS_PREVIEW) : alertas

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Seção 1 — Alertas */}
      {!error && (
        <div
          className={cn('-mx-4 px-4 py-3 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8')}
          role="region"
          aria-label="Alertas inteligentes"
        >
          <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wider">
            Alertas do dia
          </p>
          {isLoading ? (
            <div className="space-y-2">
              <div className="bg-muted h-14 animate-pulse rounded-lg" />
              <div className="bg-muted h-14 animate-pulse rounded-lg md:hidden" />
            </div>
          ) : (
            <>
              <div className="max-h-[min(40vh,220px)] space-y-2 overflow-y-auto pr-1">
                {alertasPreview.map((a) => (
                  <DashboardAlertaRow
                    key={a.id}
                    alerta={a}
                    onMarkAsRead={onMarcarAlertaLido ? () => onMarcarAlertaLido(a.id) : undefined}
                    onMarkAsUnread={onDesmarcarAlertaLido ? () => onDesmarcarAlertaLido(a.id) : undefined}
                    onAction={onMarcarAlertaLido ? () => onMarcarAlertaLido(a.id) : undefined}
                    onArchive={onArquivarAlerta ? () => onArquivarAlerta(a.id) : undefined}
                    onMuteType={onOcultarTipoAlerta ? () => onOcultarTipoAlerta(a.tipo) : undefined}
                  />
                ))}
              </div>
              {usarSheetAlertas && onVerMaisNotificacoes ? (
                <div className="mt-2 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-8 gap-1 text-xs"
                    onClick={onVerMaisNotificacoes}
                  >
                    Ver mais
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_min(280px,32%)] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-6 md:space-y-8">
          <section aria-labelledby="dash-home-heading">
            <h2 id="dash-home-heading" className="sr-only">
              Resumo do painel
            </h2>
            <AdminDashboardHomeTop
              userPrimeiroNome={userPrimeiroNome}
              barbeariaNome={barbearia?.nome ?? null}
              stats={stats}
              statusHoje={statusHoje}
              fatDiario={fatDiario}
              mediaAgendamentosPorDia14d={mediaAgendamentosPorDia14d}
              clientesNovosUltimos7Dias={clientesNovosUltimos7Dias}
              isLoading={isLoading}
              error={error}
              notificationsSlot={notificationsSlot}
            />
            {!error && barbearia && pagamentoPendentePlano ? (
              <div className="mt-4 flex justify-end">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`${base}/assinatura`}>Concluir ativação</Link>
                </Button>
              </div>
            ) : null}
            {!error && barbearia && !pagamentoPendentePlano ? (
              <div className="mt-4 hidden justify-end sm:flex">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`${base}/relatorios`}>Relatórios</Link>
                </Button>
              </div>
            ) : null}
          </section>

          {/* Seção — Tendências */}
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
