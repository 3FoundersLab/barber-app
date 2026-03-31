'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Check } from 'lucide-react'
import { PageContainer, PageHeader, PageTitle, PageContent } from '@/components/shared/page-container'
import { ServiceCard } from '@/components/domain/service-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DateNavigatorCalendar } from '@/components/shared/date-navigator-calendar'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency, DIAS_SEMANA_ABREV } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Servico, Barbeiro } from '@/types'

type Step = 'servico' | 'barbeiro' | 'data' | 'horario' | 'confirmar'

const HORARIOS_DISPONIVEIS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30'
]

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

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      setError(null)
      
      // Get first barbearia (for demo)
      const { data: barbearia } = await supabase
        .from('barbearias')
        .select('id')
        .limit(1)
        .single()
      
      if (!barbearia) {
        setError('Barbearia não encontrada')
        setIsLoading(false)
        return
      }

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
          .order('nome')
        
        if (barbeirosData) setBarbeiros(barbeirosData)
      }
      
      setIsLoading(false)
    }
    
    loadData()
  }, [])

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
          data: selectedDate.toISOString().split('T')[0],
          horario: selectedHorario,
          status: 'agendado',
          status_pagamento: 'pendente',
          valor: selectedServico.preco,
        })
        if (insertError) {
          setError('Não foi possível concluir o agendamento')
          return
        }
      } else {
        // Create agendamento
        const { error: insertError } = await supabase.from('agendamentos').insert({
          barbearia_id: cliente.barbearia_id,
          cliente_id: cliente.id,
          barbeiro_id: selectedBarbeiro.id,
          servico_id: selectedServico.id,
          data: selectedDate.toISOString().split('T')[0],
          horario: selectedHorario,
          status: 'agendado',
          status_pagamento: 'pendente',
          valor: selectedServico.preco,
        })
        if (insertError) {
          setError('Não foi possível concluir o agendamento')
          return
        }
      }

      router.push('/cliente/agendamentos')
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

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <PageTitle>{getStepTitle()}</PageTitle>
        </div>
      </PageHeader>

      <PageContent className="space-y-4">
        {error && (
          <Card className="border-dashed">
            <CardContent className="py-4 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
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
            <CardContent className="p-4">
              <DateNavigatorCalendar
                value={selectedDate}
                onChange={setSelectedDate}
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return date < today || date.getDay() === 0
                }}
              />
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
            <div className="grid grid-cols-4 gap-2">
              {HORARIOS_DISPONIVEIS.map((horario) => (
                <Button
                  key={horario}
                  variant={selectedHorario === horario ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedHorario(horario)}
                >
                  {horario}
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
