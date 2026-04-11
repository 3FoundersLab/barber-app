'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  Users,
} from 'lucide-react'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { AppointmentAdminFormDialog } from '@/components/domain/appointment-admin-form-dialog'
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
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AppointmentListSkeleton } from '@/components/shared/loading-skeleton'
import { ViewToggle, type ViewMode } from '@/components/shared/view-toggle'
import { DateNavigatorCalendar } from '@/components/shared/date-navigator-calendar'
import {
  DIAS_SEMANA_ABREV,
  formatDateWeekdayLong,
  resolveBarbeariaAgendaTimeRange,
} from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import {
  getAgendaDemoAgendamentosForMonth,
  getAgendaDemoBarbeiros,
  getAgendaDemoUnavailableBlocks,
} from '@/lib/agenda-demo-data'
import {
  BARBEARIA_DIAS_FUNCIONAMENTO_PADRAO,
  formatDiasFuncionamentoLegenda,
  isBarbeariaAbertaNoDia,
  normalizeDiasFuncionamento,
} from '@/lib/barbearia-dias-funcionamento'
import { ensureComandaForAgendamento } from '@/lib/ensure-comanda-agendamento'
import { toUserFriendlyErrorMessage } from '@/lib/to-user-friendly-error'
import { useSupabaseAgendamentosRealtime } from '@/hooks/use-supabase-agendamentos-realtime'
import { cn } from '@/lib/utils'
import type { Agendamento, Barbeiro } from '@/types'

type ListQuickFocus = 'todos' | 'hoje' | 'amanha' | 'em_atendimento'

type PeriodoKey = 'manha' | 'tarde' | 'noite'

function parseHorarioMinutes(horario: string): number {
  const [h, m] = horario.slice(0, 5).split(':').map(Number)
  return h * 60 + (m || 0)
}

function periodoFromHorario(horario: string): PeriodoKey {
  const mins = parseHorarioMinutes(horario)
  if (mins < 12 * 60) return 'manha'
  if (mins < 18 * 60) return 'tarde'
  return 'noite'
}

const PERIODO_ORDER: PeriodoKey[] = ['manha', 'tarde', 'noite']
const PERIODO_LABEL: Record<PeriodoKey, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
}

/** Permite abrir o formulário completo (cliente, barbeiro, serviço, data, horário…). */
function allowsAdminEditAppointment(a: Agendamento, demoActive: boolean): boolean {
  if (demoActive) return false
  return (
    a.status === 'agendado' ||
    a.status === 'em_atendimento' ||
    a.status === 'concluido'
  )
}

export default function AdminAgendamentosPage() {
  const { slug, base } = useTenantAdminBase()
  const router = useRouter()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedBarbeiro, setSelectedBarbeiro] = useState<string>('all')
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [barbeariaHorarioAbertura, setBarbeariaHorarioAbertura] = useState<string | null>(null)
  const [barbeariaHorarioFechamento, setBarbeariaHorarioFechamento] = useState<string | null>(null)
  const [barbeariaDiasFuncionamento, setBarbeariaDiasFuncionamento] = useState<number[]>(() => [
    ...BARBEARIA_DIAS_FUNCIONAMENTO_PADRAO,
  ])
  const [useDemoData, setUseDemoData] = useState(false)
  const [demoAgendamentos, setDemoAgendamentos] = useState<Agendamento[]>(() =>
    getAgendaDemoAgendamentosForMonth(new Date().getFullYear(), new Date().getMonth()),
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grade')
  const [detailAppointment, setDetailAppointment] = useState<Agendamento | null>(null)
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Agendamento | null>(null)
  const [fabPortalHost, setFabPortalHost] = useState<Element | null>(null)
  const [comandaNumeroPorAgendamento, setComandaNumeroPorAgendamento] = useState<Record<string, number>>(
    {},
  )
  const [demoComandaNumeroPorAgendamento, setDemoComandaNumeroPorAgendamento] = useState<
    Record<string, number>
  >({})
  const [listQuickFocus, setListQuickFocus] = useState<ListQuickFocus>('todos')
  const loadAgendamentosRequestId = useRef(0)

  useEffect(() => {
    setFabPortalHost(document.body)
  }, [])

  const openNewAppointment = () => {
    setEditingAppointment(null)
    setAppointmentFormOpen(true)
  }

  const beginEditAppointment = useCallback((row: Agendamento) => {
    setEditingAppointment(row)
    setDetailAppointment(null)
    setAppointmentFormOpen(true)
  }, [])

  const parseLocalYMD = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map(Number)
    return new Date(y, m - 1, d)
  }

  const handleAppointmentSaved = (savedDataYmd: string) => {
    const d = parseLocalYMD(savedDataYmd)
    setEditingAppointment(null)
    setSelectedDate(d)
    void loadAgendamentos(d)
  }

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

          const { data: bbRow } = await supabase
            .from('barbearias')
            .select('horario_abertura, horario_fechamento, dias_funcionamento')
            .eq('id', barbeariaIdResolved)
            .single()
          if (bbRow) {
            setBarbeariaHorarioAbertura(bbRow.horario_abertura ?? null)
            setBarbeariaHorarioFechamento(bbRow.horario_fechamento ?? null)
            setBarbeariaDiasFuncionamento(normalizeDiasFuncionamento(bbRow.dias_funcionamento))
          } else {
            setBarbeariaHorarioAbertura(null)
            setBarbeariaHorarioFechamento(null)
            setBarbeariaDiasFuncionamento([...BARBEARIA_DIAS_FUNCIONAMENTO_PADRAO])
          }

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

  async function loadAgendamentos(dateOverride?: Date) {
    if (!barbeariaId) {
      setIsLoading(false)
      return
    }

    const refDate = dateOverride ?? selectedDate
    const requestId = ++loadAgendamentosRequestId.current

    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    
    const monthStart = new Date(refDate.getFullYear(), refDate.getMonth(), 1)
    const monthEnd = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0)
    
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

    if (requestId !== loadAgendamentosRequestId.current) {
      return
    }

    if (queryError) {
      setError('Não foi possível carregar os agendamentos')
      setAgendamentos([])
      setComandaNumeroPorAgendamento({})
    } else if (data) {
      setAgendamentos(data)
      const ids = data.map((r) => r.id)
      if (ids.length === 0) {
        setComandaNumeroPorAgendamento({})
      } else {
        const { data: comandasRows } = await supabase
          .from('comandas')
          .select('agendamento_id, numero')
          .eq('barbearia_id', barbeariaId)
          .in('agendamento_id', ids)
        if (requestId !== loadAgendamentosRequestId.current) {
          return
        }
        const map: Record<string, number> = {}
        for (const c of comandasRows ?? []) {
          if (c.agendamento_id != null && c.numero != null) {
            map[c.agendamento_id] = Number(c.numero)
          }
        }
        setComandaNumeroPorAgendamento(map)
      }
    }
    if (requestId === loadAgendamentosRequestId.current) {
      setIsLoading(false)
    }
  }

  const loadAgendamentosRef = useRef(loadAgendamentos)
  loadAgendamentosRef.current = loadAgendamentos

  useSupabaseAgendamentosRealtime(
    Boolean(barbeariaId) && !useDemoData,
    'barbearia',
    barbeariaId,
    () => {
      void loadAgendamentosRef.current()
    },
  )

  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() - 1)
      return d
    })
    if (viewMode === 'list' && listQuickFocus !== 'em_atendimento') {
      setListQuickFocus('todos')
    }
  }

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const d = new Date(prev)
      d.setDate(d.getDate() + 1)
      return d
    })
    if (viewMode === 'list' && listQuickFocus !== 'em_atendimento') {
      setListQuickFocus('todos')
    }
  }

  const handleToday = () => {
    setSelectedDate(new Date())
    if (viewMode === 'list') {
      setListQuickFocus('hoje')
    }
  }

  const handleStatusChange = async (id: string, status: 'concluido' | 'faltou') => {
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

  const handleCheckIn = async (id: string) => {
    if (useDemoData) {
      setDemoAgendamentos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'em_atendimento' as const } : a)),
      )
      setDemoComandaNumeroPorAgendamento((prev) => {
        if (prev[id] != null) return prev
        const n = 100 + Math.floor(Math.random() * 899)
        return { ...prev, [id]: n }
      })
      return
    }

    const row = agendamentos.find((a) => a.id === id)
    if (!row || !barbeariaId) return

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
      setError(toUserFriendlyErrorMessage(updErr, { fallback: 'Não foi possível registrar o check-in' }))
      return
    }

    setComandaNumeroPorAgendamento((prev) => ({ ...prev, [id]: ensured.numero }))
    setAgendamentos((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'em_atendimento' as const } : a)),
    )
  }

  const handleCancelAppointment = async (id: string, motivo?: string) => {
    if (useDemoData) {
      setDemoAgendamentos((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: 'cancelado' as const, motivo_cancelamento: motivo ?? null }
            : a,
        ),
      )
      return
    }

    const supabase = createClient()
    await supabase.from('comandas').update({ status: 'cancelada' }).eq('agendamento_id', id)

    const { error: cancelErr } = await supabase
      .from('agendamentos')
      .update({ status: 'cancelado', motivo_cancelamento: motivo?.trim() || null })
      .eq('id', id)

    if (cancelErr) {
      setError(toUserFriendlyErrorMessage(cancelErr, { fallback: 'Não foi possível cancelar o agendamento' }))
      loadAgendamentos()
      return
    }

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

  const displayAgendamentosRaw = useDemoData ? demoAgendamentos : agendamentos

  const displayAgendamentos = useMemo(() => {
    if (selectedBarbeiro === 'all') return displayAgendamentosRaw
    return displayAgendamentosRaw.filter((a) => a.barbeiro_id === selectedBarbeiro)
  }, [displayAgendamentosRaw, selectedBarbeiro])

  const comandaMapEfetivo = useDemoData ? demoComandaNumeroPorAgendamento : comandaNumeroPorAgendamento

  const appointmentsOfSelectedDate = useMemo(
    () => displayAgendamentos.filter((agendamento) => agendamento.data === selectedDateKey),
    [displayAgendamentos, selectedDateKey],
  )

  const listFilteredSorted = useMemo(() => {
    let list = appointmentsOfSelectedDate
    if (listQuickFocus === 'em_atendimento') {
      list = list.filter((a) => a.status === 'em_atendimento')
    }
    return [...list].sort((a, b) => a.horario.localeCompare(b.horario))
  }, [appointmentsOfSelectedDate, listQuickFocus])

  const listByPeriod = useMemo(() => {
    const buckets: Record<PeriodoKey, Agendamento[]> = { manha: [], tarde: [], noite: [] }
    for (const a of listFilteredSorted) {
      buckets[periodoFromHorario(a.horario)].push(a)
    }
    return PERIODO_ORDER.map((key) => ({
      key,
      label: PERIODO_LABEL[key],
      items: buckets[key],
    }))
  }, [listFilteredSorted])

  const nextAppointmentId = useMemo(() => {
    if (listQuickFocus === 'em_atendimento') return null
    const todayKey = formatDateKey(new Date())
    if (selectedDateKey !== todayKey) return null
    const nowMins = new Date().getHours() * 60 + new Date().getMinutes()
    const upcoming = listFilteredSorted.filter((a) => a.status === 'agendado')
    for (const a of upcoming) {
      if (parseHorarioMinutes(a.horario) >= nowMins) return a.id
    }
    return null
  }, [selectedDateKey, listFilteredSorted, listQuickFocus])

  const barbeirosNaGrade = useMemo(() => {
    if (selectedBarbeiro === 'all') return displayBarbeiros
    return displayBarbeiros.filter((b) => b.id === selectedBarbeiro)
  }, [displayBarbeiros, selectedBarbeiro])

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
      setError(toUserFriendlyErrorMessage(updateError, { fallback: 'Não foi possível mover o agendamento' }))
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
        }
      />

      <PageContent className="space-y-4">
        {useDemoData && (
          <Alert variant="info">
            <AlertTitle>
              Modo demonstração: agenda com dados fictícios (Gabriel, Fernando, Pedro, Lucas).
              Desative o interruptor ao lado do título para ver os agendamentos reais da barbearia.
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
                ? 'Grade por profissional · intervalos de 15 minutos'
                : viewMode === 'calendar'
                  ? 'Calendário mensal — arraste para mover o dia do agendamento'
                  : 'Lista do dia selecionado'}
            </p>
            {!useDemoData ? (
              <p className="text-xs text-muted-foreground">
                Abre em: <span className="font-medium text-foreground">{diasFuncionamentoLegenda}</span>
              </p>
            ) : null}
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
            
            const fechadoNoCalendario =
              !useDemoData && !isBarbeariaAbertaNoDia(day.getDay(), barbeariaDiasFuncionamento)

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => {
                  setSelectedDate(day)
                  if (viewMode === 'list' && listQuickFocus !== 'em_atendimento') {
                    setListQuickFocus('todos')
                  }
                }}
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

        {/* Filtros: linha (hr) acima; fundo branco; divisor vertical interno */}
        <div className="flex flex-col gap-2">
          <Separator />
          <div className="flex w-full min-w-0 items-center gap-0 rounded-lg border border-border bg-white p-1 shadow-sm dark:bg-card">
            <div className="min-w-0 flex-1 px-2">
              <Select value={selectedBarbeiro} onValueChange={setSelectedBarbeiro}>
                <SelectTrigger className="h-9 w-full min-w-0 justify-between border-0 bg-transparent shadow-none focus-visible:ring-2 focus-visible:ring-ring/50">
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {selectedBarbeiro === 'all' ? (
                      <Users className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    ) : (
                      <User className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    <SelectValue placeholder="Barbeiro" />
                  </span>
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
            </div>
            <Separator orientation="vertical" className="h-9 shrink-0" />
            <div className="shrink-0 px-1">
              <ViewToggle value={viewMode} onChange={setViewMode} className="w-fit shrink-0" />
            </div>
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
                  barbeiroNome: agendamento.barbeiro?.nome,
                  servicoNome: agendamento.servico?.nome,
                  status: agendamento.status,
                  comandaNumero: comandaMapEfetivo[agendamento.id],
                }))}
                onMoveAppointment={handleMoveAppointment}
                renderAppointmentDetail={({ appointmentId, onClose, onBackToList }) => {
                  const a = displayAgendamentos.find((x) => x.id === appointmentId)
                  if (!a) {
                    return (
                      <p className="text-sm text-muted-foreground">Agendamento não encontrado.</p>
                    )
                  }
                  return (
                    <div className="space-y-0">
                      {onBackToList ? (
                        <div className="flex flex-wrap items-center gap-2 pb-3">
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
                      ) : null}
                      {onBackToList ? <Separator className="mb-3" /> : null}
                      <AppointmentCard
                        appointment={a}
                        inSheet
                        comandaNumero={comandaMapEfetivo[a.id]}
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
                        onEdit={
                          allowsAdminEditAppointment(a, useDemoData)
                            ? (id) => {
                                if (id !== a.id) return
                                onClose()
                                beginEditAppointment(a)
                              }
                            : undefined
                        }
                      />
                    </div>
                  )
                }}
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
                comandaByAgendamentoId={comandaMapEfetivo}
                onBlockClick={setDetailAppointment}
                referenceDate={selectedDate}
                timeRange={agendaTimeRange}
                unavailableBlocks={useDemoData ? getAgendaDemoUnavailableBlocks() : undefined}
              />
            )}
          </>
        )}

        {/* Lista de cartões (modo lista) */}
        {viewMode === 'list' && (
          <div className="space-y-5">
            <div
              className="flex flex-wrap gap-2"
              role="toolbar"
              aria-label="Filtros rápidos da lista"
            >
              <Button
                type="button"
                size="sm"
                variant={listQuickFocus === 'todos' ? 'default' : 'outline'}
                className={cn(
                  'rounded-full',
                  listQuickFocus === 'todos' && 'shadow-sm',
                )}
                onClick={() => setListQuickFocus('todos')}
              >
                Todos
              </Button>
              <Button
                type="button"
                size="sm"
                variant={listQuickFocus === 'hoje' ? 'default' : 'outline'}
                className={cn('rounded-full', listQuickFocus === 'hoje' && 'shadow-sm')}
                onClick={() => {
                  setSelectedDate(new Date())
                  setListQuickFocus('hoje')
                }}
              >
                Hoje
              </Button>
              <Button
                type="button"
                size="sm"
                variant={listQuickFocus === 'amanha' ? 'default' : 'outline'}
                className={cn('rounded-full', listQuickFocus === 'amanha' && 'shadow-sm')}
                onClick={() => {
                  const t = new Date()
                  t.setDate(t.getDate() + 1)
                  setSelectedDate(t)
                  setListQuickFocus('amanha')
                }}
              >
                Amanhã
              </Button>
              <Button
                type="button"
                size="sm"
                variant={listQuickFocus === 'em_atendimento' ? 'default' : 'outline'}
                className={cn(
                  'rounded-full',
                  listQuickFocus === 'em_atendimento' && 'shadow-sm',
                )}
                onClick={() => setListQuickFocus('em_atendimento')}
              >
                Em atendimento
              </Button>
            </div>

            <div
              className={
                !error && (isLoading || listFilteredSorted.length > 0)
                  ? 'space-y-10'
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
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  <AppointmentListSkeleton count={6} className="contents" />
                </div>
              ) : listFilteredSorted.length > 0 ? (
                listByPeriod.map(
                  ({ key, label, items }) =>
                    items.length === 0 ? null : (
                      <section key={key} className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          {label}
                        </h3>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                          {items.map((agendamento) => (
                            <AppointmentCard
                              key={agendamento.id}
                              appointment={agendamento}
                              listLayout
                              comandaNumero={comandaMapEfetivo[agendamento.id]}
                              isNext={agendamento.id === nextAppointmentId}
                              onCheckIn={handleCheckIn}
                              onComplete={(id) => handleStatusChange(id, 'concluido')}
                              onCancel={(id, motivo) => void handleCancelAppointment(id, motivo)}
                              onNoShow={(id) => handleStatusChange(id, 'faltou')}
                              onMarkPaid={handleMarkPaid}
                              onEdit={
                                allowsAdminEditAppointment(agendamento, useDemoData)
                                  ? (id) => {
                                      const row = displayAgendamentos.find((x) => x.id === id)
                                      if (row) beginEditAppointment(row)
                                    }
                                  : undefined
                              }
                              onViewHistory={() => {
                                const nome = agendamento.cliente?.nome?.trim()
                                if (nome) {
                                  router.push(
                                    `${base}/clientes?q=${encodeURIComponent(nome)}`,
                                  )
                                } else {
                                  router.push(`${base}/clientes`)
                                }
                              }}
                            />
                          ))}
                        </div>
                      </section>
                    ),
                )
              ) : (
                <Card className="border-dashed border-2 bg-muted/20 shadow-none">
                  <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                      <CalendarOff className="h-7 w-7 text-muted-foreground" aria-hidden />
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">
                        {listQuickFocus === 'em_atendimento'
                          ? 'Ninguém em atendimento agora'
                          : 'Nenhum agendamento neste dia'}
                      </p>
                      <p className="max-w-sm text-sm text-muted-foreground">
                        {listQuickFocus === 'em_atendimento'
                          ? 'Quando um cliente fizer check-in, o card aparece aqui com este filtro.'
                          : 'Escolha outro dia na barra acima ou crie um novo agendamento pelo botão +.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
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

      {fabPortalHost && barbeariaId
        ? createPortal(
            <Button
              type="button"
              size="icon"
              className="fixed right-4 bottom-24 z-[60] h-14 w-14 rounded-full border-2 border-sky-300 bg-blue-600 text-white shadow-lg hover:bg-blue-700 dark:border-sky-300 dark:bg-blue-600 dark:hover:bg-blue-500 md:right-8 md:bottom-8"
              onClick={openNewAppointment}
              aria-label="Novo agendamento"
            >
              <Plus className="h-7 w-7" />
            </Button>,
            fabPortalHost,
          )
        : null}

      <AppointmentAdminFormDialog
        open={appointmentFormOpen}
        onOpenChange={(open) => {
          setAppointmentFormOpen(open)
          if (!open) setEditingAppointment(null)
        }}
        barbeariaId={barbeariaId}
        barbeiros={barbeiros}
        initialDate={selectedDate}
        editing={editingAppointment}
        defaultBarbeiroId={selectedBarbeiro === 'all' ? undefined : selectedBarbeiro}
        onSaved={handleAppointmentSaved}
        onError={setError}
        demoDataActive={useDemoData}
        agendaTimeRange={agendaTimeRange}
      />

      <Dialog open={detailAppointment !== null} onOpenChange={(open) => !open && setDetailAppointment(null)}>
        <DialogContent className="max-w-md sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>Detalhes do agendamento</DialogTitle>
          </DialogHeader>
          {detailAppointment && (
            <AppointmentCard
              appointment={detailAppointment}
              inSheet
              comandaNumero={comandaMapEfetivo[detailAppointment.id]}
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
              onEdit={
                allowsAdminEditAppointment(detailAppointment, useDemoData)
                  ? (id) => {
                      if (id !== detailAppointment.id) return
                      beginEditAppointment(detailAppointment)
                    }
                  : undefined
              }
            />
          )}
        </DialogContent>
      </Dialog>
    </TenantPanelPageContainer>
  )
}
