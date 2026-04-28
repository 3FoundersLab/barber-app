'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Check } from 'lucide-react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { ServiceCard } from '@/components/domain/service-card'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DateNavigatorCalendar } from '@/components/shared/date-navigator-calendar'
import { Spinner } from '@/components/ui/spinner'
import { AgendarFlowSkeleton } from '@/components/shared/loading-skeleton'
import {
  buildAgendaSlotStrings,
  DIAS_SEMANA_ABREV,
  formatCurrency,
  HORARIOS_PADRAO,
  resolveBarbeariaAgendaTimeRange,
} from '@/lib/constants'
import { listAvailableStartSlots } from '@/lib/agenda-availability'
import {
  formatDiasFuncionamentoLegenda,
  isBarbeariaAbertaNoDia,
  normalizeDiasFuncionamento,
} from '@/lib/barbearia-dias-funcionamento'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Servico, Barbeiro } from '@/types'

type Step = 'servico' | 'barbeiro' | 'data' | 'horario' | 'confirmar'

export default function AgendarPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('servico')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data
  const [servicos, setServicos] = useState<Servico[]>([])
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  
  // Selection
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null)
  const [selectedBarbeiro, setSelectedBarbeiro] = useState<Barbeiro | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedHorario, setSelectedHorario] = useState<string | null>(null)
  const [busyAppointments, setBusyAppointments] = useState<
    { horario: string; servico: { duracao: number } | null }[]
  >([])
  const [isLoadingHorarios, setIsLoadingHorarios] = useState(false)
  const [barbeariaHorarioAbertura, setBarbeariaHorarioAbertura] = useState<string | null>(null)
  const [barbeariaHorarioFechamento, setBarbeariaHorarioFechamento] = useState<string | null>(null)
  const [diasFuncionamento, setDiasFuncionamento] = useState<number[]>(() =>
    normalizeDiasFuncionamento(null),
  )

  const horariosDisponiveis = useMemo(() => {
    const range = resolveBarbeariaAgendaTimeRange(barbeariaHorarioAbertura, barbeariaHorarioFechamento)
    const slots = buildAgendaSlotStrings(range.start, range.end, HORARIOS_PADRAO.intervalo)
    if (!selectedServico) return slots
    return listAvailableStartSlots({
      slotStrings: slots,
      dayStart: range.start,
      dayEnd: range.end,
      targetDurationMinutes: selectedServico.duracao,
      appointments: busyAppointments,
    })
  }, [
    barbeariaHorarioAbertura,
    barbeariaHorarioFechamento,
    selectedServico,
    busyAppointments,
  ])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      setError(null)
      
      // Get first barbearia (for demo)
      const { data: barbearia } = await supabase
        .from('barbearias')
        .select('id, horario_abertura, horario_fechamento, dias_funcionamento')
        .limit(1)
        .single()

      if (!barbearia) {
        setError('Barbearia não encontrada')
        setIsLoading(false)
        return
      }

      setBarbeariaHorarioAbertura(barbearia.horario_abertura ?? null)
      setBarbeariaHorarioFechamento(barbearia.horario_fechamento ?? null)
      setDiasFuncionamento(normalizeDiasFuncionamento(barbearia.dias_funcionamento))

      if (barbearia) {
        // Load services
        const { data: servicosData } = await supabase
          .from('servicos')
          .select('*')
          .eq('barbearia_id', barbearia.id)
          .eq('ativo', true)
          .order('nome')
        
        if (servicosData) setServicos(servicosData)

        // Load barbers
        const { data: barbeirosData } = await supabase
          .from('barbeiros')
          .select('*')
          .eq('barbearia_id', barbearia.id)
          .eq('ativo', true)
          .or('funcao_equipe.eq.barbeiro,funcao_equipe.eq.barbeiro_lider,funcao_equipe.is.null')
          .order('nome')
        
        if (barbeirosData) setBarbeiros(barbeirosData)
      }
      
      setIsLoading(false)
    }
    
    loadData()
  }, [])

  useEffect(() => {
    if (!selectedBarbeiro || !selectedDate) {
      setBusyAppointments([])
      return
    }

    let cancelled = false
    async function loadBusyAppointments() {
      setIsLoadingHorarios(true)
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('agendamentos')
        .select('horario, status, servico:servicos(duracao)')
        .eq('barbeiro_id', selectedBarbeiro.id)
        .eq('data', selectedDate.toISOString().split('T')[0])
        .in('status', ['agendado', 'em_atendimento', 'concluido'])

      if (cancelled) return
      if (fetchError) {
        setBusyAppointments([])
      } else {
        setBusyAppointments(
          (data ?? []).map((item) => ({
            horario: item.horario,
            servico: item.servico,
          })),
        )
      }
      setIsLoadingHorarios(false)
    }

    void loadBusyAppointments()
    return () => {
      cancelled = true
    }
  }, [selectedBarbeiro, selectedDate])

  useEffect(() => {
    if (!selectedHorario) return
    if (horariosDisponiveis.includes(selectedHorario)) return
    setSelectedHorario(null)
  }, [selectedHorario, horariosDisponiveis])

  const handleBack = () => {
    if (step === 'barbeiro') setStep('servico')
    else if (step === 'data') setStep('barbeiro')
    else if (step === 'horario') setStep('data')
    else if (step === 'confirmar') setStep('horario')
    else router.back()
  }

  const handleNext = () => {
    if (step === 'servico' && selectedServico) setStep('barbeiro')
    else if (step === 'barbeiro' && selectedBarbeiro) setStep('data')
    else if (step === 'data' && selectedDate) setStep('horario')
    else if (step === 'horario' && selectedHorario) setStep('confirmar')
  }

  const handleConfirm = async () => {
    if (!selectedServico || !selectedBarbeiro || !selectedDate || !selectedHorario) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const supabase = createClient()
      const selectedDateYmd = selectedDate.toISOString().split('T')[0]
      const range = resolveBarbeariaAgendaTimeRange(barbeariaHorarioAbertura, barbeariaHorarioFechamento)

      const { data: currentBusy, error: availabilityError } = await supabase
        .from('agendamentos')
        .select('horario, status, servico:servicos(duracao)')
        .eq('barbeiro_id', selectedBarbeiro.id)
        .eq('data', selectedDateYmd)
        .in('status', ['agendado', 'em_atendimento', 'concluido'])

      if (availabilityError) {
        setError('Não foi possível validar a disponibilidade deste horário')
        return
      }

      const stillAvailable = listAvailableStartSlots({
        slotStrings: [selectedHorario],
        dayStart: range.start,
        dayEnd: range.end,
        targetDurationMinutes: selectedServico.duracao,
        appointments: (currentBusy ?? []).map((item) => ({
          horario: item.horario,
          servico: item.servico,
        })),
      }).length > 0

      if (!stillAvailable) {
        setError('Este horário acabou de ficar indisponível. Escolha outro horário.')
        setStep('horario')
        return
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get cliente record
      const { data: cliente } = await supabase
        .from('clientes')
        .select('id, barbearia_id')
        .eq('user_id', user.id)
        .single()

      if (!cliente) {
        // Create cliente if not exists
        const { data: barbearia } = await supabase
          .from('barbearias')
          .select('id')
          .limit(1)
          .single()

        if (!barbearia) {
          setError('Barbearia não encontrada')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('nome, telefone, email')
          .eq('id', user.id)
          .single()

        const { data: newCliente } = await supabase
          .from('clientes')
          .insert({
            barbearia_id: barbearia.id,
            user_id: user.id,
            nome: profile?.nome || 'Cliente',
            telefone: profile?.telefone || '',
            email: profile?.email || user.email,
          })
          .select()
          .single()

        if (!newCliente) {
          setError('Não foi possível criar o cliente')
          return
        }

        // Create agendamento
        const { error: insertError } = await supabase.from('agendamentos').insert({
          barbearia_id: barbearia.id,
          cliente_id: newCliente.id,
          barbeiro_id: selectedBarbeiro.id,
          servico_id: selectedServico.id,
          data: selectedDateYmd,
          horario: selectedHorario,
          status: 'agendado',
          status_pagamento: 'pendente',
          valor: selectedServico.preco,
        })
        if (insertError) {
          if (
            insertError.code === '23514' ||
            insertError.message.includes('Conflito de horário')
          ) {
            setError('Este horário conflita com outro atendimento. Escolha outro horário.')
          } else {
            setError('Não foi possível concluir o agendamento')
          }
          return
        }
      } else {
        // Create agendamento
        const { error: insertError } = await supabase.from('agendamentos').insert({
          barbearia_id: cliente.barbearia_id,
          cliente_id: cliente.id,
          barbeiro_id: selectedBarbeiro.id,
          servico_id: selectedServico.id,
          data: selectedDateYmd,
          horario: selectedHorario,
          status: 'agendado',
          status_pagamento: 'pendente',
          valor: selectedServico.preco,
        })
        if (insertError) {
          if (
            insertError.code === '23514' ||
            insertError.message.includes('Conflito de horário')
          ) {
            setError('Este horário conflita com outro atendimento. Escolha outro horário.')
          } else {
            setError('Não foi possível concluir o agendamento')
          }
          return
        }
      }

      router.push('/agendamentos')
    } catch (error) {
      console.error('Error creating appointment:', error)
      setError('Não foi possível concluir o agendamento')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 'servico': return 'Escolha o serviço'
      case 'barbeiro': return 'Escolha o barbeiro'
      case 'data': return 'Escolha a data'
      case 'horario': return 'Escolha o horário'
      case 'confirmar': return 'Confirmar agendamento'
    }
  }

  const headerLeading = (
    <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Voltar">
      <ChevronLeft className="h-5 w-5" />
    </Button>
  )

  if (isLoading) {
    return (
      <PageContainer>
        <AppPageHeader
          leading={headerLeading}
          contentTitle={getStepTitle()}
          profileHref="/perfil/editar"
          avatarFallback="C"
        />
        <PageContent className="space-y-4">
          <AgendarFlowSkeleton count={5} />
        </PageContent>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <AppPageHeader
        leading={headerLeading}
        contentTitle={getStepTitle()}
        profileHref="/perfil/editar"
        avatarFallback="C"
      />

      <PageContent className="space-y-4">
        {error && (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {/* Step: Serviço */}
        {step === 'servico' && (
          <div className="space-y-3">
            {servicos.length > 0 ? (
              servicos.map((servico) => (
                <ServiceCard
                  key={servico.id}
                  service={servico}
                  showActions={false}
                  selected={selectedServico?.id === servico.id}
                  onClick={setSelectedServico}
                />
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum serviço disponível
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step: Barbeiro */}
        {step === 'barbeiro' && (
          <div className="space-y-3">
            {barbeiros.length > 0 ? (
              barbeiros.map((barbeiro) => (
                <Card
                  key={barbeiro.id}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-accent/50',
                    selectedBarbeiro?.id === barbeiro.id && 'border-primary bg-primary/5'
                  )}
                  onClick={() => setSelectedBarbeiro(barbeiro)}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={barbeiro.avatar} />
                      <AvatarFallback>
                        {barbeiro.nome.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{barbeiro.nome}</p>
                      {barbeiro.telefone && (
                        <p className="text-sm text-muted-foreground">{barbeiro.telefone}</p>
                      )}
                    </div>
                    {selectedBarbeiro?.id === barbeiro.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum barbeiro disponível
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step: Data */}
        {step === 'data' && (
          <Card>
            <CardContent className="space-y-2 p-4">
              <DateNavigatorCalendar
                value={selectedDate}
                onChange={setSelectedDate}
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  if (date < today) return true
                  return !isBarbeariaAbertaNoDia(date.getDay(), diasFuncionamento)
                }}
              />
              <p className="text-center text-xs text-muted-foreground">
                Atendimento:{' '}
                <span className="font-medium text-foreground">
                  {formatDiasFuncionamentoLegenda(diasFuncionamento)}
                </span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step: Horário */}
        {step === 'horario' && (
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              {selectedDate && (
                <>
                  {DIAS_SEMANA_ABREV[selectedDate.getDay()]},{' '}
                  {selectedDate.toLocaleDateString('pt-BR')}
                </>
              )}
            </p>
            {isLoadingHorarios ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="h-5 w-5" />
              </div>
            ) : horariosDisponiveis.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Não há horários disponíveis para a duração deste serviço nesta data.
                </CardContent>
              </Card>
            ) : null}
            <div className="grid grid-cols-4 gap-2">
              {horariosDisponiveis.map((h) => (
                <Button
                  key={h}
                  variant={selectedHorario === h ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedHorario(h)}
                >
                  {h}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Confirmar */}
        {step === 'confirmar' && (
          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serviço</span>
                  <span className="font-medium">{selectedServico?.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Barbeiro</span>
                  <span className="font-medium">{selectedBarbeiro?.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data</span>
                  <span className="font-medium">
                    {selectedDate?.toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horário</span>
                  <span className="font-medium">{selectedHorario}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração</span>
                  <span className="font-medium">{selectedServico?.duracao} min</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(selectedServico?.preco || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Button */}
        {step !== 'confirmar' ? (
          <Button
            className="w-full"
            disabled={
              (step === 'servico' && !selectedServico) ||
              (step === 'barbeiro' && !selectedBarbeiro) ||
              (step === 'data' && !selectedDate) ||
              (step === 'horario' && !selectedHorario)
            }
            onClick={handleNext}
          >
            Continuar
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Spinner className="mr-2" /> : null}
            {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}
          </Button>
        )}
      </PageContent>
    </PageContainer>
  )
}
