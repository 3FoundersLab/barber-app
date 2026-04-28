'use client'

import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import type { AdminDashboardHomeStats } from '@/components/domain/admin-dashboard-home-top'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { Button } from '@/components/ui/button'
import { DashboardAlertaRow } from '@/components/domain/admin-dashboard-alerta-row'
import type { AdminDashboardStatusHoje } from '@/lib/build-admin-dashboard-status-hoje'
import type { Agendamento, Barbearia } from '@/types'
import type {
  AlertaDashboard,
  DashboardAgendaDiaStats,
  DashboardFatAtendDiarioPonto,
  DashboardFatDiarioPonto,
  DashboardInsightsDia,
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
  const alertasDoDiaSlot = !error ? (
    <div role="region" aria-label="Alertas inteligentes">
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
  ) : null

  return (
    <div className="space-y-6 md:space-y-8">
      <DashboardPage
        base={base}
        barbearia={barbearia}
        userPrimeiroNome={userPrimeiroNome}
        stats={stats}
        mediaAgendamentosPorDia14d={mediaAgendamentosPorDia14d}
        clientesNovosUltimos7Dias={clientesNovosUltimos7Dias}
        agendaHoje={agendaHoje}
        fatDiario={fatDiario}
        fatAtend7d={fatAtend7d}
        estoqueCritico={estoqueCritico}
        resumoDia={resumoDia}
        insightsDia={insightsDia}
        agendaStats={agendaStats}
        isLoading={isLoading}
        error={error}
        pagamentoPendentePlano={pagamentoPendentePlano}
        operacaoLiberada={operacaoLiberada}
        statusHoje={statusHoje}
        notificationsSlot={notificationsSlot}
        alertasDoDiaSlot={alertasDoDiaSlot}
      />
    </div>
  )
}
