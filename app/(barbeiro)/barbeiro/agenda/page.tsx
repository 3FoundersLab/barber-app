'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageContainer, PageContent, PageTitle } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { AppointmentCard } from '@/components/domain/appointment-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { ViewToggle, type ViewMode } from '@/components/shared/view-toggle'
import { DateNavigatorCalendar } from '@/components/shared/date-navigator-calendar'
import { formatDate, DIAS_SEMANA_ABREV } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { Agendamento, Profile } from '@/types'

export default function BarbeiroAgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
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
    loadAgendamentos()
  }, [selectedDate])

  async function loadAgendamentos() {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setError('Usuário não autenticado')
      setAgendamentos([])
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
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!barbeiro) {
      setError('Barbeiro não encontrado')
      setAgendamentos([])
      setIsLoading(false)
      return
    }

    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)

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
      <AppPageHeader
        renderTitle={(p) => {
          const nome = p?.nome?.trim()
          return (
            <div className="min-w-0">
              <PageTitle className="text-lg">
                {nome ? `Olá, ${nome}` : 'Olá'}
              </PageTitle>
              <p className="text-sm text-muted-foreground">Minha Agenda</p>
            </div>
          )
        }}
        profileHref="/barbeiro/perfil/editar"
        profile={profile}
        avatarFallback="B"
        actions={
          !isToday ? (
            <Button variant="outline" size="sm" onClick={handleToday}>
              Hoje
            </Button>
          ) : null
        }
      />

      <PageContent className="space-y-4">
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
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <LoadingSkeleton count={3} />
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
