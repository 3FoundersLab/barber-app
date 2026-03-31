'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, Scissors, User } from 'lucide-react'
import { PageContainer, PageHeader, PageTitle, PageContent } from '@/components/shared/page-container'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppointmentStatusBadge, PaymentStatusBadge } from '@/components/shared/status-badge'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { formatDate, formatTime, formatCurrency } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { Agendamento } from '@/types'

export default function MeusAgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadAgendamentos() {
      const supabase = createClient()
      setError(null)
      
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Usuário não autenticado')
        setAgendamentos([])
        setIsLoading(false)
        return
      }

      // Get cliente
      const { data: cliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!cliente) {
        setError('Cliente não encontrado')
        setAgendamentos([])
        setIsLoading(false)
        return
      }

      const { data, error: queryError } = await supabase
        .from('agendamentos')
        .select(`
          *,
          servico:servicos(*),
          barbeiro:barbeiros(*)
        `)
        .eq('cliente_id', cliente.id)
        .order('data', { ascending: false })
        .order('horario', { ascending: false })
      
      if (queryError) {
        setError('Não foi possível carregar seus agendamentos')
        setAgendamentos([])
      } else if (data) {
        setAgendamentos(data)
      }
      
      setIsLoading(false)
    }
    
    loadAgendamentos()
  }, [])

  const today = new Date().toISOString().split('T')[0]
  
  const proximos = agendamentos.filter(
    (a) => a.data >= today && a.status === 'agendado'
  )
  
  const historico = agendamentos.filter(
    (a) => a.data < today || a.status !== 'agendado'
  )

  const AgendamentoCard = ({ agendamento }: { agendamento: Agendamento }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold leading-none">
              {formatTime(agendamento.horario).split(':')[0]}
            </span>
            <span className="text-xs leading-none">
              :{formatTime(agendamento.horario).split(':')[1]}
            </span>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{agendamento.servico?.nome}</span>
              <AppointmentStatusBadge status={agendamento.status} />
            </div>
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(agendamento.data)}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {agendamento.barbeiro?.nome}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {agendamento.servico?.duracao} min
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <PaymentStatusBadge status={agendamento.status_pagamento} />
              <span className="font-semibold text-primary">
                {formatCurrency(agendamento.valor)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const EmptyState = ({ message }: { message: string }) => (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <Scissors className="mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Meus Agendamentos</PageTitle>
      </PageHeader>

      <PageContent>
        {error && (
          <Card className="mb-4 border-dashed">
            <CardContent className="py-6 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        <Tabs defaultValue="proximos">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="proximos">
              Próximos ({proximos.length})
            </TabsTrigger>
            <TabsTrigger value="historico">
              Histórico ({historico.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proximos" className="mt-4 space-y-3">
            {isLoading ? (
              <LoadingSkeleton count={3} />
            ) : proximos.length > 0 ? (
              proximos.map((agendamento) => (
                <AgendamentoCard key={agendamento.id} agendamento={agendamento} />
              ))
            ) : (
              <EmptyState message="Nenhum agendamento futuro" />
            )}
          </TabsContent>

          <TabsContent value="historico" className="mt-4 space-y-3">
            {isLoading ? (
              <LoadingSkeleton count={3} />
            ) : historico.length > 0 ? (
              historico.map((agendamento) => (
                <AgendamentoCard key={agendamento.id} agendamento={agendamento} />
              ))
            ) : (
              <EmptyState message="Nenhum agendamento no histórico" />
            )}
          </TabsContent>
        </Tabs>
      </PageContent>
    </PageContainer>
  )
}
