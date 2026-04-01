'use client'

import { useEffect, useState } from 'react'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { AppointmentCard } from '@/components/domain/appointment-card'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { createClient } from '@/lib/supabase/client'
import type { Agendamento, AppointmentStatus, PaymentStatus } from '@/types'

type AtendimentoFilter = AppointmentStatus | 'todos'
type PagamentoFilter = PaymentStatus | 'todos'

export default function AdminFinanceiroPage() {
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [atendimentoFilter, setAtendimentoFilter] = useState<AtendimentoFilter>('todos')
  const [pagamentoFilter, setPagamentoFilter] = useState<PagamentoFilter>('todos')

  useEffect(() => {
    async function loadInitialData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('Usuário não autenticado')
        setIsLoading(false)
        return
      }

      const { data: barbeariaUser } = await supabase
        .from('barbearia_users')
        .select('barbearia_id')
        .eq('user_id', user.id)
        .single()

      if (!barbeariaUser) {
        setError('Barbearia não encontrada para este usuário')
        setIsLoading(false)
        return
      }

      setBarbeariaId(barbeariaUser.barbearia_id)
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    if (!barbeariaId) return
    loadAgendamentos()
  }, [barbeariaId, atendimentoFilter, pagamentoFilter])

  async function loadAgendamentos() {
    if (!barbeariaId) return

    setIsLoading(true)
    setError(null)
    const supabase = createClient()

    let query = supabase
      .from('agendamentos')
      .select(`
        *,
        cliente:clientes(*),
        barbeiro:barbeiros(*),
        servico:servicos(*)
      `)
      .eq('barbearia_id', barbeariaId)
      .order('data', { ascending: false })
      .order('horario', { ascending: false })

    if (atendimentoFilter !== 'todos') {
      query = query.eq('status', atendimentoFilter)
    }

    if (pagamentoFilter !== 'todos') {
      query = query.eq('status_pagamento', pagamentoFilter)
    }

    const { data, error: queryError } = await query

    if (queryError) {
      setError('Não foi possível carregar os atendimentos')
      setAgendamentos([])
    } else {
      setAgendamentos(data || [])
    }

    setIsLoading(false)
  }

  async function handleMarkPaid(id: string) {
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('agendamentos')
      .update({ status_pagamento: 'pago' })
      .eq('id', id)

    if (updateError) {
      setError('Não foi possível marcar como pago')
      return
    }

    loadAgendamentos()
  }

  return (
    <PageContainer>
      <AppPageHeader title="Financeiro" profileHref="/admin/configuracoes" avatarFallback="A" />

      <PageContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Tabs
            value={atendimentoFilter}
            onValueChange={(value) => setAtendimentoFilter(value as AtendimentoFilter)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="concluido">Concluídos</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select
            value={pagamentoFilter}
            onValueChange={(value) => setPagamentoFilter(value as PagamentoFilter)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos pagamentos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : isLoading ? (
          <LoadingSkeleton count={4} />
        ) : agendamentos.length > 0 ? (
          <div className="space-y-3">
            {agendamentos.map((agendamento) => (
              <AppointmentCard
                key={agendamento.id}
                appointment={agendamento}
                showActions
                onMarkPaid={handleMarkPaid}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhum atendimento encontrado com os filtros selecionados
            </CardContent>
          </Card>
        )}
      </PageContent>
    </PageContainer>
  )
}
