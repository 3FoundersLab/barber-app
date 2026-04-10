'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { AppointmentCard } from '@/components/domain/appointment-card'
import { AppointmentDayGrid } from '@/components/domain/appointment-day-grid'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AppointmentListSkeleton } from '@/components/shared/loading-skeleton'
import { ViewToggle, type ViewMode } from '@/components/shared/view-toggle'
import { DateNavigatorCalendar } from '@/components/shared/date-navigator-calendar'
import { DIAS_SEMANA_ABREV, formatDateWeekdayLong } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import {
  getAgendaDemoAgendamentosForMonth,
  getAgendaDemoBarbeiros,
  getAgendaDemoUnavailableBlocks,
} from '@/lib/agenda-demo-data'
import type { Agendamento, Barbeiro } from '@/types'

export default function AdminAgendamentosPage() {
  const { slug, base } = useTenantAdminBase()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedBarbeiro, setSelectedBarbeiro] = useState<string>('all')
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [useDemoData, setUseDemoData] = useState(true)
  const [demoAgendamentos, setDemoAgendamentos] = useState<Agendamento[]>(() =>
    getAgendaDemoAgendamentosForMonth(new Date().getFullYear(), new Date().getMonth()),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grade')
  const [detailAppointment, setDetailAppointment] = useState<Agendamento | null>(null)

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    async function loadInitialData() {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const barbeariaIdResolved = await resolveAdminBarbeariaId(supabase, user.id, { slug })

        if (barbeariaIdResolved) {
          setBarbeariaId(barbeariaIdResolved)
          
          // Load barbers
          const { data: barbeirosData } = await supabase
            .from('barbeiros')
            .select('*')
            .eq('barbearia_id', barbeariaIdResolved)
            .eq('ativo', true)
            .or('funcao_equipe.eq.barbeiro,funcao_equipe.eq.barbeiro_lider,funcao_equipe.is.null')
            .order('nome')
          
          if (barbeirosData) setBarbeiros(barbeirosData)
        }
      }
    }
    
    loadInitialData()
  }, [slug])

  useEffect(() => {
    if (useDemoData) {
      setIsLoading(false)
      setError(null)
      return
    }
    if (barbeariaId) {
      loadAgendamentos()
    }
  }, [selectedDate, selectedBarbeiro, barbeariaId, useDemoData])

  const selectedYear = selectedDate.getFullYear()
  const selectedMonth = selectedDate.getMonth()

  useEffect(() => {
    if (!useDemoData) return
    setDemoAgendamentos(getAgendaDemoAgendamentosForMonth(selectedYear, selectedMonth))
  }, [useDemoData, selectedYear, selectedMonth])

  useEffect(() => {
    if (useDemoData || selectedBarbeiro === 'all') return
    if (!barbeiros.some((b) => b.id === selectedBarbeiro)) {
      setSelectedBarbeiro('all')
    }
  }, [useDemoData, barbeiros, selectedBarbeiro])

  async function loadAgendamentos() {
    if (!barbeariaId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    
    let query = supabase
      .from('agendamentos')
      .select(`
        *,
        cliente:clientes(*),
        barbeiro:barbeiros(*),
        servico:servicos(*)
      `)
      .eq('barbearia_id', barbeariaId)
      .gte('data', formatDateKey(monthStart))
      .lte('data', formatDateKey(monthEnd))
      .order('horario', { ascending: true })
    
    if (selectedBarbeiro !== 'all') {
      query = query.eq('barbeiro_id', selectedBarbeiro)
    }
    
    const { data, error: queryError } = await query

    if (queryError) {
      setError('Não foi possível carregar os agendamentos')
      setAgendamentos([])
    } else if (data) {
      setAgendamentos(data)
    }
    setIsLoading(false)
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

  const handleStatusChange = async (id: string, status: 'concluido' | 'cancelado' | 'faltou') => {
    if (useDemoData) {
      setDemoAgendamentos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      )
      return
    }
    const supabase = createClient()

    await supabase.from('agendamentos').update({ status }).eq('id', id)

    loadAgendamentos()
  }

  const handleMarkPaid = async (id: string) => {
    if (useDemoData) {
      setDemoAgendamentos((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status_pagamento: 'pago' as const } : a,
        ),
      )
      return
    }
    const supabase = createClient()

    await supabase.from('agendamentos').update({ status_pagamento: 'pago' }).eq('id', id)

    loadAgendamentos()
  }

  const selectedDateKey = formatDateKey(selectedDate)

  const displayBarbeiros = useMemo(
    () => (useDemoData ? getAgendaDemoBarbeiros() : barbeiros),
    [useDemoData, barbeiros],
  )

  const displayAgendamentos = useDemoData ? demoAgendamentos : agendamentos

  const appointmentsOfSelectedDate = useMemo(
    () => displayAgendamentos.filter((agendamento) => agendamento.data === selectedDateKey),
    [displayAgendamentos, selectedDateKey],
  )

  const barbeirosNaGrade = useMemo(() => {
    if (selectedBarbeiro === 'all') return displayBarbeiros
    return displayBarbeiros.filter((b) => b.id === selectedBarbeiro)
  }, [displayBarbeiros, selectedBarbeiro])

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

    if (useDemoData) {
      setDemoAgendamentos((prev) =>
        prev.map((item) =>
          item.id === appointmentId ? { ...item, data: nextDateKey } : item,
        ),
      )
      setSelectedDate(nextDate)
      return
    }

    const supabase = createClient()

    setAgendamentos((prev) =>
      prev.map((item) => (item.id === appointmentId ? { ...item, data: nextDateKey } : item)),
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
    <TenantPanelPageContainer>
      <TenantPanelPageHeader
        title="Agendamentos"
        profileHref={`${base}/configuracoes`}
        avatarFallback="A"
        headingActions={
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Novo
          </Button>
        }
      />

      <PageContent className="space-y-4">
        {useDemoData && (
          <Alert variant="info">
            <AlertTitle>
              Modo demonstração: agenda com dados fictícios (Gabriel, Fernando, Pedro, Lucas).
              Desative o interruptor abaixo para ver os agendamentos reais da barbearia.
            </AlertTitle>
          </Alert>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="text-lg font-semibold leading-snug tracking-tight sm:text-xl">
              {formatDateWeekdayLong(selectedDate)}
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {viewMode === 'grade'
                ? 'Calendário por profissional · intervalos de 10 minutos'
                : viewMode === 'calendar'
                  ? 'Calendário mensal — arraste para mover o dia do agendamento'
                  : 'Lista do dia selecionado'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday} className="shrink-0">
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
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-1 flex-col items-center rounded-lg py-2 transition-colors ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : isTodayDay
                    ? 'bg-accent/50 text-accent-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <span className="text-xs">{DIAS_SEMANA_ABREV[day.getDay()]}</span>
                <span className="text-lg font-semibold">{day.getDate()}</span>
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 gap-y-2">
          <Select value={selectedBarbeiro} onValueChange={setSelectedBarbeiro}>
            <SelectTrigger className="min-w-[160px] flex-1 sm:max-w-xs">
              <SelectValue placeholder="Barbeiro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os barbeiros</SelectItem>
              {displayBarbeiros.map((barbeiro) => (
                <SelectItem key={barbeiro.id} value={barbeiro.id}>
                  {barbeiro.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-3 sm:flex-none">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5">
              <Switch
                id="agenda-demo-data"
                checked={useDemoData}
                onCheckedChange={setUseDemoData}
                aria-label="Usar dados fictícios de demonstração"
              />
              <Label htmlFor="agenda-demo-data" className="cursor-pointer text-xs font-medium">
                Dados fictícios
              </Label>
            </div>
            <ViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {viewMode === 'calendar' && (
          <Card>
            <CardContent className="p-2">
              <DateNavigatorCalendar
                value={selectedDate}
                onChange={setSelectedDate}
                appointments={displayAgendamentos.map((agendamento) => ({
                  id: agendamento.id,
                  data: agendamento.data,
                  horario: agendamento.horario,
                  clienteNome: agendamento.cliente?.nome,
                  servicoNome: agendamento.servico?.nome,
                }))}
                onMoveAppointment={handleMoveAppointment}
              />
            </CardContent>
          </Card>
        )}

        {viewMode === 'grade' && (useDemoData || !error) && (
          <>
            {!useDemoData && isLoading ? (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex gap-0 border-b bg-muted/30 p-3">
                    <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
                    <div className="ml-3 h-4 w-24 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="space-y-2 p-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-12 animate-pulse rounded-lg bg-muted/60"
                        style={{ marginLeft: `${(i % 3) * 12}%`, width: `${68 - (i % 3) * 8}%` }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <AppointmentDayGrid
                barbeiros={barbeirosNaGrade}
                appointments={appointmentsOfSelectedDate}
                onBlockClick={setDetailAppointment}
                timeRange={useDemoData ? { start: '09:00', end: '18:00' } : undefined}
                unavailableBlocks={useDemoData ? getAgendaDemoUnavailableBlocks() : undefined}
              />
            )}
          </>
        )}

        {/* Lista de cartões (modo lista) */}
        {viewMode === 'list' && (
          <div
            className={
              !error && (isLoading || appointmentsOfSelectedDate.length > 0)
                ? 'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3 xl:gap-5'
                : 'space-y-3'
            }
          >
            {error ? (
              <Alert
                variant="danger"
                onClose={() => setError(null)}
                autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
              >
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            ) : isLoading ? (
              <AppointmentListSkeleton count={6} className="contents" />
            ) : appointmentsOfSelectedDate.length > 0 ? (
              appointmentsOfSelectedDate.map((agendamento) => (
                <AppointmentCard
                  key={agendamento.id}
                  appointment={agendamento}
                  onComplete={(id) => handleStatusChange(id, 'concluido')}
                  onCancel={(id) => handleStatusChange(id, 'cancelado')}
                  onNoShow={(id) => handleStatusChange(id, 'faltou')}
                  onMarkPaid={handleMarkPaid}
                />
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {error && !useDemoData && viewMode !== 'list' && (
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
              onComplete={(id) => {
                handleStatusChange(id, 'concluido')
                setDetailAppointment(null)
              }}
              onCancel={(id) => {
                handleStatusChange(id, 'cancelado')
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
    </TenantPanelPageContainer>
  )
}
