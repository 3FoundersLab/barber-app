'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { AppointmentCard } from '@/components/domain/appointment-card'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppointmentListSkeleton } from '@/components/shared/loading-skeleton'
import { ViewToggle, type ViewMode } from '@/components/shared/view-toggle'
import { DateNavigatorCalendar } from '@/components/shared/date-navigator-calendar'
import { formatDate, DIAS_SEMANA_ABREV } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { tenantBarbeariaBasePath } from '@/lib/routes'
import type { Agendamento, Barbeiro } from '@/types'

export default function AdminAgendamentosPage() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const base = slug ? tenantBarbeariaBasePath(slug) : '/painel'

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedBarbeiro, setSelectedBarbeiro] = useState<string>('all')
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

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
            .order('nome')
          
          if (barbeirosData) setBarbeiros(barbeirosData)
        }
      }
    }
    
    loadInitialData()
  }, [slug])

  useEffect(() => {
    if (barbeariaId) {
      loadAgendamentos()
    }
  }, [selectedDate, selectedBarbeiro, barbeariaId])

  async function loadAgendamentos() {
    if (!barbeariaId) return
    
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
    const supabase = createClient()
    
    await supabase
      .from('agendamentos')
      .update({ status })
      .eq('id', id)
    
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

  const isToday = selectedDate.toDateString() === new Date().toDateString()
  const selectedDateKey = formatDateKey(selectedDate)
  const appointmentsOfSelectedDate = useMemo(
    () => agendamentos.filter((agendamento) => agendamento.data === selectedDateKey),
    [agendamentos, selectedDateKey]
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
      <AppPageHeader title="Agendamentos" profileHref={`${base}/configuracoes`} avatarFallback="A" />

      <PageContent className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Novo
          </Button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="text-lg font-semibold">
              {formatDate(selectedDate)}
            </p>
            <p className="text-sm text-muted-foreground">
              {DIAS_SEMANA_ABREV[selectedDate.getDay()]}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleNextDay}>
            <ChevronRight className="h-5 w-5" />
          </Button>
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
        <div className="flex gap-2">
          <Select value={selectedBarbeiro} onValueChange={setSelectedBarbeiro}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Barbeiro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os barbeiros</SelectItem>
              {barbeiros.map((barbeiro) => (
                <SelectItem key={barbeiro.id} value={barbeiro.id}>
                  {barbeiro.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isToday && (
            <Button variant="outline" onClick={handleToday}>
              Hoje
            </Button>
          )}
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
                  servicoNome: agendamento.servico?.nome,
                }))}
                onMoveAppointment={handleMoveAppointment}
              />
            </CardContent>
          </Card>
        )}

        {/* Appointments */}
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
            <AppointmentListSkeleton count={4} />
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
                <p className="text-muted-foreground">
                  Nenhum agendamento para este dia
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContent>
    </PageContainer>
  )
}
