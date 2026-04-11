'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { AppointmentCard } from '@/components/domain/appointment-card'
import { AppointmentDayGrid } from '@/components/domain/appointment-day-grid'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AppointmentListSkeleton } from '@/components/shared/loading-skeleton'
import { ViewToggle, type ViewMode } from '@/components/shared/view-toggle'
import { DateNavigatorCalendar } from '@/components/shared/date-navigator-calendar'
import {
  DIAS_SEMANA_ABREV,
  formatDate,
  formatDateWeekdayLong,
  resolveBarbeariaAgendaTimeRange,
} from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import {
  BARBEARIA_DIAS_FUNCIONAMENTO_PADRAO,
  formatDiasFuncionamentoLegenda,
  isBarbeariaAbertaNoDia,
  normalizeDiasFuncionamento,
} from '@/lib/barbearia-dias-funcionamento'
import { ensureComandaForAgendamento } from '@/lib/ensure-comanda-agendamento'
import { toUserFriendlyErrorMessage } from '@/lib/to-user-friendly-error'
import { cn } from '@/lib/utils'
import type { Agendamento, Barbeiro, Profile } from '@/types'

export default function BarbeiroAgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grade')
  const [barbeiroSelf, setBarbeiroSelf] = useState<Barbeiro | null>(null)
  const [detailAppointment, setDetailAppointment] = useState<Agendamento | null>(null)
  const [comandaNumeroPorAgendamento, setComandaNumeroPorAgendamento] = useState<Record<string, number>>(
    {},
  )
  const [barbeariaHorarioAbertura, setBarbeariaHorarioAbertura] = useState<string | null>(null)
  const [barbeariaHorarioFechamento, setBarbeariaHorarioFechamento] = useState<string | null>(null)
  const [barbeariaDiasFuncionamento, setBarbeariaDiasFuncionamento] = useState<number[]>(() => [
    ...BARBEARIA_DIAS_FUNCIONAMENTO_PADRAO,
  ])

  /** Evita aplicar resultados de um fetch antigo quando `selectedDate` muda durante o await. */
  const loadAgendamentosSeq = useRef(0)

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    loadAgendamentos()
  }, [selectedDate])

  async function loadAgendamentos() {
    const seq = ++loadAgendamentosSeq.current
    const dateForQuery = new Date(selectedDate.getTime())

    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      if (seq !== loadAgendamentosSeq.current) return
      setError('Usuário não autenticado')
      setAgendamentos([])
      setComandaNumeroPorAgendamento({})
      setBarbeariaHorarioAbertura(null)
      setBarbeariaHorarioFechamento(null)
      setBarbeariaDiasFuncionamento([...BARBEARIA_DIAS_FUNCIONAMENTO_PADRAO])
      setIsLoading(false)
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (profileData) setProfile(profileData)

    // Get barbeiro record
    const { data: barbeiro } = await supabase
      .from('barbeiros')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!barbeiro) {
      if (seq !== loadAgendamentosSeq.current) return
      setBarbeiroSelf(null)
      setError('Barbeiro não encontrado')
      setAgendamentos([])
      setComandaNumeroPorAgendamento({})
      setBarbeariaHorarioAbertura(null)
      setBarbeariaHorarioFechamento(null)
      setBarbeariaDiasFuncionamento([...BARBEARIA_DIAS_FUNCIONAMENTO_PADRAO])
      setIsLoading(false)
      return
    }

    if (seq !== loadAgendamentosSeq.current) return
    setBarbeiroSelf(barbeiro as Barbeiro)

    const bbId = barbeiro.barbearia_id
    if (bbId) {
      const { data: bbRow } = await supabase
        .from('barbearias')
        .select('horario_abertura, horario_fechamento, dias_funcionamento')
        .eq('id', bbId)
        .single()
      setBarbeariaHorarioAbertura(bbRow?.horario_abertura ?? null)
      setBarbeariaHorarioFechamento(bbRow?.horario_fechamento ?? null)
      setBarbeariaDiasFuncionamento(normalizeDiasFuncionamento(bbRow?.dias_funcionamento))
    } else {
      setBarbeariaHorarioAbertura(null)
      setBarbeariaHorarioFechamento(null)
      setBarbeariaDiasFuncionamento([...BARBEARIA_DIAS_FUNCIONAMENTO_PADRAO])
    }

    if (seq !== loadAgendamentosSeq.current) return

    const monthStart = new Date(dateForQuery.getFullYear(), dateForQuery.getMonth(), 1)
    const monthEnd = new Date(dateForQuery.getFullYear(), dateForQuery.getMonth() + 1, 0)

    const { data, error: queryError } = await supabase
      .from('agendamentos')
      .select(`
        *,
        cliente:clientes(*),
        servico:servicos(*)
      `)
      .eq('barbeiro_id', barbeiro.id)
      .gte('data', formatDateKey(monthStart))
      .lte('data', formatDateKey(monthEnd))
      .order('horario', { ascending: true })

    if (seq !== loadAgendamentosSeq.current) return

    if (queryError) {
      setError('Não foi possível carregar os agendamentos')
      setAgendamentos([])
      setComandaNumeroPorAgendamento({})
    } else if (data) {
      setAgendamentos(data)
      const bbIdComandas = barbeiro.barbearia_id
      const ids = data.map((r) => r.id)
      if (ids.length === 0 || !bbIdComandas) {
        setComandaNumeroPorAgendamento({})
      } else {
        const { data: comandasRows } = await supabase
          .from('comandas')
          .select('agendamento_id, numero')
          .eq('barbearia_id', bbIdComandas)
          .in('agendamento_id', ids)
        if (seq !== loadAgendamentosSeq.current) return
        const map: Record<string, number> = {}
        for (const c of comandasRows ?? []) {
          if (c.agendamento_id != null && c.numero != null) {
            map[c.agendamento_id] = Number(c.numero)
          }
        }
        setComandaNumeroPorAgendamento(map)
      }
    }

    if (seq === loadAgendamentosSeq.current) {
      setIsLoading(false)
    }
  }

  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 1)
      return d
    })
  }

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 1)
      return d
    })
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  const handleStatusChange = async (id: string, status: 'concluido' | 'faltou') => {
    const supabase = createClient()

    await supabase.from('agendamentos').update({ status }).eq('id', id)

    loadAgendamentos()
  }

  const handleCheckIn = async (id: string) => {
    const row = agendamentos.find((a) => a.id === id)
    if (!row) return

    const supabase = createClient()
    const ensured = await ensureComandaForAgendamento(supabase, row)
    if (!ensured.ok) {
      setError(toUserFriendlyErrorMessage(ensured.message, { fallback: 'Não foi possível preparar a comanda.' }))
      return
    }

    const { error: updErr } = await supabase
      .from('agendamentos')
      .update({ status: 'em_atendimento' })
      .eq('id', id)

    if (updErr) {
      setError('Não foi possível registrar o check-in')
      return
    }

    setComandaNumeroPorAgendamento((prev) => ({ ...prev, [id]: ensured.numero }))
    setAgendamentos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'em_atendimento' as const } : a)),
    )
  }

  const handleCancelAppointment = async (id: string, motivo?: string) => {
    const supabase = createClient()
    await supabase.from('comandas').update({ status: 'cancelada' }).eq('agendamento_id', id)

    const { error: cancelErr } = await supabase
      .from('agendamentos')
      .update({ status: 'cancelado', motivo_cancelamento: motivo?.trim() || null })
      .eq('id', id)

    if (cancelErr) {
      setError('Não foi possível cancelar o agendamento')
    }

    loadAgendamentos()
  }

  const handleMarkPaid = async (id: string) => {
    const supabase = createClient()
    
    await supabase
      .from('agendamentos')
      .update({ status_pagamento: 'pago' })
      .eq('id', id)
    
    loadAgendamentos()
  }

  const selectedDateKey = formatDateKey(selectedDate)
  const appointmentsOfSelectedDate = useMemo(
    () => agendamentos.filter((agendamento) => agendamento.data === selectedDateKey),
    [agendamentos, selectedDateKey]
  )

  const agendaTimeRange = useMemo(
    () => resolveBarbeariaAgendaTimeRange(barbeariaHorarioAbertura, barbeariaHorarioFechamento),
    [barbeariaHorarioAbertura, barbeariaHorarioFechamento],
  )

  const diasFuncionamentoLegenda = useMemo(
    () => formatDiasFuncionamentoLegenda(barbeariaDiasFuncionamento),
    [barbeariaDiasFuncionamento],
  )

  // Generate week days
  const getWeekDays = () => {
    const days = []
    const start = new Date(selectedDate)
    start.setDate(start.getDate() - 3)
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      days.push(d)
    }
    return days
  }

  const handleMoveAppointment = async (appointmentId: string, nextDate: Date) => {
    const nextDateKey = formatDateKey(nextDate)
    const supabase = createClient()

    setAgendamentos((prev) =>
      prev.map((item) => (item.id === appointmentId ? { ...item, data: nextDateKey } : item))
    )

    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({ data: nextDateKey })
      .eq('id', appointmentId)

    if (updateError) {
      setError('Não foi possível mover o agendamento')
      loadAgendamentos()
      return
    }

    setSelectedDate(nextDate)
  }

  return (
    <PageContainer>
      <AppPageHeader
        title="Minha Agenda"
        profileHref="/profissional/perfil/editar"
        profile={profile}
        avatarFallback="B"
      />

      <PageContent className="space-y-4">
        {/* Date Navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold leading-snug sm:text-xl">
              {formatDateWeekdayLong(selectedDate)}
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(selectedDate)}</p>
            <p className="text-xs text-muted-foreground">
              Abre em: <span className="font-medium text-foreground">{diasFuncionamentoLegenda}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              <Calendar className="mr-1.5 h-4 w-4" />
              Hoje
            </Button>
            <div className="flex rounded-lg border border-border bg-background shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none rounded-l-lg"
                onClick={handlePrevDay}
                aria-label="Dia anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-none rounded-r-lg border-l"
                onClick={handleNextDay}
                aria-label="Próximo dia"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Week Days */}
        <div className="flex justify-between gap-1">
          {getWeekDays().map((day) => {
            const isSelected = day.toDateString() === selectedDate.toDateString()
            const isTodayDay = day.toDateString() === new Date().toDateString()
            
            const fechadoNoCalendario = !isBarbeariaAbertaNoDia(day.getDay(), barbeariaDiasFuncionamento)

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'flex flex-1 flex-col items-center rounded-lg py-2 transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : isTodayDay
                      ? 'bg-accent/50 text-accent-foreground'
                      : 'hover:bg-muted',
                  fechadoNoCalendario && !isSelected && 'opacity-45',
                )}
                title={fechadoNoCalendario ? 'Dia sem expediente nesta unidade' : undefined}
              >
                <span className="text-xs">{DIAS_SEMANA_ABREV[day.getDay()]}</span>
                <span className="text-lg font-semibold">{day.getDate()}</span>
              </button>
            )
          })}
        </div>

        <div className="flex justify-end">
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>

        {viewMode === 'calendar' && (
          <Card>
            <CardContent className="p-2">
              <DateNavigatorCalendar
                value={selectedDate}
                onChange={setSelectedDate}
                appointments={agendamentos.map((agendamento) => ({
                  id: agendamento.id,
                  data: agendamento.data,
                  horario: agendamento.horario,
                  clienteNome: agendamento.cliente?.nome,
                  barbeiroNome: barbeiroSelf?.nome,
                  servicoNome: agendamento.servico?.nome,
                  status: agendamento.status,
                  comandaNumero: comandaNumeroPorAgendamento[agendamento.id],
                }))}
                onMoveAppointment={handleMoveAppointment}
                renderAppointmentDetail={({ appointmentId, onClose, onBackToList }) => {
                  const a = agendamentos.find((x) => x.id === appointmentId)
                  if (!a) {
                    return (
                      <p className="text-sm text-muted-foreground">Agendamento não encontrado.</p>
                    )
                  }
                  return (
                    <div className="space-y-0">
                      {onBackToList ? (
                        <>
                          <div className="pb-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="-ml-2 h-8 px-2"
                              onClick={onBackToList}
                            >
                              <ChevronLeft className="mr-1 h-4 w-4" />
                              Lista do dia
                            </Button>
                          </div>
                          <Separator className="mb-3" />
                        </>
                      ) : null}
                      <AppointmentCard
                        appointment={a}
                        inSheet
                        comandaNumero={comandaNumeroPorAgendamento[a.id]}
                        onCheckIn={handleCheckIn}
                        onComplete={(id) => {
                          handleStatusChange(id, 'concluido')
                          onClose()
                        }}
                        onCancel={(id, motivo) => {
                          void handleCancelAppointment(id, motivo)
                          onClose()
                        }}
                        onNoShow={(id) => {
                          handleStatusChange(id, 'faltou')
                          onClose()
                        }}
                        onMarkPaid={(id) => {
                          handleMarkPaid(id)
                          onClose()
                        }}
                      />
                    </div>
                  )
                }}
              />
            </CardContent>
          </Card>
        )}

        {viewMode === 'grade' && !error && barbeiroSelf && (
          <>
            {isLoading ? (
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="h-40 animate-pulse rounded-lg bg-muted/60" />
                </CardContent>
              </Card>
            ) : (
              <AppointmentDayGrid
                barbeiros={[barbeiroSelf]}
                appointments={appointmentsOfSelectedDate}
                comandaByAgendamentoId={comandaNumeroPorAgendamento}
                onBlockClick={setDetailAppointment}
                referenceDate={selectedDate}
                timeRange={agendaTimeRange}
              />
            )}
          </>
        )}

        {viewMode === 'list' && (
          <div className="space-y-3">
            {error ? (
              <Alert
                variant="danger"
                onClose={() => setError(null)}
                autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
              >
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            ) : isLoading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <AppointmentListSkeleton count={3} className="contents" />
              </div>
            ) : appointmentsOfSelectedDate.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {appointmentsOfSelectedDate.map((agendamento) => (
                  <AppointmentCard
                    key={agendamento.id}
                    appointment={agendamento}
                    comandaNumero={comandaNumeroPorAgendamento[agendamento.id]}
                    onCheckIn={handleCheckIn}
                    onComplete={(id) => handleStatusChange(id, 'concluido')}
                    onCancel={(id, motivo) => void handleCancelAppointment(id, motivo)}
                    onNoShow={(id) => handleStatusChange(id, 'faltou')}
                    onMarkPaid={handleMarkPaid}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {error && viewMode !== 'list' && (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
      </PageContent>

      <Dialog open={detailAppointment !== null} onOpenChange={(open) => !open && setDetailAppointment(null)}>
        <DialogContent className="max-w-md sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>Detalhes do agendamento</DialogTitle>
          </DialogHeader>
          {detailAppointment && (
            <AppointmentCard
              appointment={detailAppointment}
              comandaNumero={comandaNumeroPorAgendamento[detailAppointment.id]}
              onCheckIn={handleCheckIn}
              onComplete={(id) => {
                handleStatusChange(id, 'concluido')
                setDetailAppointment(null)
              }}
              onCancel={(id, motivo) => {
                void handleCancelAppointment(id, motivo)
                setDetailAppointment(null)
              }}
              onNoShow={(id) => {
                handleStatusChange(id, 'faltou')
                setDetailAppointment(null)
              }}
              onMarkPaid={(id) => {
                handleMarkPaid(id)
                setDetailAppointment(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
