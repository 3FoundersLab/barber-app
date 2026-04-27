'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import {
  AdminDashboardHomeTop,
  type AdminDashboardHomeStats,
} from '@/components/domain/admin-dashboard-home-top'
import { AdminDashboardOperacaoKpis } from '@/components/domain/admin-dashboard-operacao-kpis'
import { AdminDashboardFatAtendimentosChart } from '@/components/domain/admin-dashboard-fat-atendimentos-chart'
import { AdminDashboardAcoesRapidas } from '@/components/domain/admin-dashboard-acoes-rapidas'
import { AdminDashboardAgendaDia } from '@/components/domain/admin-dashboard-agenda-dia'
import { AdminDashboardTripleCol } from '@/components/domain/admin-dashboard-triple-col'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardAlertaRow } from '@/components/domain/admin-dashboard-alerta-row'
import { cn } from '@/lib/utils'
import type { AdminDashboardStatusHoje } from '@/lib/build-admin-dashboard-status-hoje'
import type { Agendamento, Barbearia } from '@/types'
import type {
  AlertaDashboard,
  DashboardAgendaDiaStats,
  DashboardFatAtendDiarioPonto,
  DashboardFatDiarioPonto,
  DashboardInsightsDia,
  DashboardOperacaoDiaKpis,
  DashboardResumoDia,
} from '@/types/admin-dashboard'

const MAX_ALERTAS_PREVIEW = 3

export function AdminDashboardPremium(props: {
  base: string
  barbearia: Barbearia | null
  userPrimeiroNome: string | null
  stats: AdminDashboardHomeStats | null
  mediaAgendamentosPorDia14d: number
  clientesNovosUltimos7Dias: number
  agendaHoje: Agendamento[]
  fatDiario: DashboardFatDiarioPonto[]
  fatAtend7d: DashboardFatAtendDiarioPonto[]
  operacaoKpisHoje: DashboardOperacaoDiaKpis | null
  operacaoKpisOntem: DashboardOperacaoDiaKpis | null
  estoqueCritico: { nome: string; quantidade: number; minimo: number }[]
  resumoDia: DashboardResumoDia | null
  insightsDia: DashboardInsightsDia | null
  agendaStats: DashboardAgendaDiaStats | null
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
    agendaHoje,
    fatDiario,
    fatAtend7d,
    operacaoKpisHoje,
    operacaoKpisOntem,
    estoqueCritico,
    resumoDia,
    insightsDia,
    agendaStats,
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

      <div className="min-w-0 space-y-6">
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

          <section aria-labelledby="dash-operacao-kpis-heading" className="space-y-3">
            <h2 id="dash-operacao-kpis-heading" className="text-foreground text-sm font-semibold tracking-tight">
              Operação hoje
            </h2>
            <AdminDashboardOperacaoKpis
              hoje={operacaoKpisHoje}
              ontem={operacaoKpisOntem}
              isLoading={isLoading}
              error={error}
            />
          </section>

          <section aria-labelledby="dash-fat-atend-heading">
            <h2 id="dash-fat-atend-heading" className="sr-only">
              Faturamento e atendimentos
            </h2>
            <AdminDashboardFatAtendimentosChart data={fatAtend7d} isLoading={isLoading} error={error} />
          </section>

          <section aria-labelledby="dash-triple-heading">
            <h2 id="dash-triple-heading" className="sr-only">
              Estoque, resumo e insights
            </h2>
            <AdminDashboardTripleCol
              base={base}
              estoqueCritico={estoqueCritico}
              resumoDia={resumoDia}
              insightsDia={insightsDia}
              isLoading={isLoading}
              error={error}
              operacaoLiberada={operacaoLiberada}
            />
          </section>

          <section aria-labelledby="dash-agenda-dia-heading">
            <h2 id="dash-agenda-dia-heading" className="sr-only">
              Agenda do dia
            </h2>
            <AdminDashboardAgendaDia
              base={base}
              stats={agendaStats}
              agendamentos={agendaHoje}
              isLoading={isLoading}
              error={error}
            />
          </section>

          <section aria-label="Ações rápidas">
            <AdminDashboardAcoesRapidas base={base} operacaoLiberada={operacaoLiberada} />
          </section>
      </div>
    </div>
  )
}
