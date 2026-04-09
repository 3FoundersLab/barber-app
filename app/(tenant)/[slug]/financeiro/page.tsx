'use client'

import { useEffect, useMemo, useState } from 'react'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { AppointmentCard } from '@/components/domain/appointment-card'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppointmentListSkeleton } from '@/components/shared/loading-skeleton'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import { formatCurrency } from '@/lib/constants'
import type { Agendamento, AppointmentStatus, PaymentStatus } from '@/types'

function formatDateHeading(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`)
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

type AtendimentoFilter = AppointmentStatus | 'todos'
type PagamentoFilter = PaymentStatus | 'todos'

export default function AdminFinanceiroPage() {
  const { slug, base } = useTenantAdminBase()

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

      const barbeariaIdResolved = await resolveAdminBarbeariaId(supabase, user.id, { slug })

      if (!barbeariaIdResolved) {
        setError('Barbearia não encontrada para este usuário')
        setIsLoading(false)
        return
      }

      setBarbeariaId(barbeariaIdResolved)
    }

    loadInitialData()
  }, [slug])

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

  const financeSummary = useMemo(() => {
    let recebido = 0
    let pendente = 0
    for (const a of agendamentos) {
      if (a.status_pagamento === 'pago') recebido += Number(a.valor) || 0
      else pendente += Number(a.valor) || 0
    }
    return {
      recebido,
      pendente,
      itens: agendamentos.length,
    }
  }, [agendamentos])

  const groupedByDate = useMemo(() => {
    const byDay = new Map<string, Agendamento[]>()
    for (const a of agendamentos) {
      const list = byDay.get(a.data) ?? []
      list.push(a)
      byDay.set(a.data, list)
    }
    const order: string[] = []
    const seen = new Set<string>()
    for (const a of agendamentos) {
      if (!seen.has(a.data)) {
        seen.add(a.data)
        order.push(a.data)
      }
    }
    return order.map((dateKey) => ({
      dateKey,
      items: byDay.get(dateKey) ?? [],
    }))
  }, [agendamentos])

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader
        title="Financeiro"
        subtitle="Histórico de pagamentos por atendimento"
        profileHref={`${base}/configuracoes`}
        avatarFallback="A"
      />

      <PageContent className="space-y-4">
        {!isLoading && !error && agendamentos.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 lg:gap-4">
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">Recebido (lista)</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <p className="text-lg font-semibold text-success">{formatCurrency(financeSummary.recebido)}</p>
                <p className="text-xs text-muted-foreground">Soma dos itens com status Pago</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">Pendente (lista)</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <p className="text-lg font-semibold text-warning-foreground">{formatCurrency(financeSummary.pendente)}</p>
                <p className="text-xs text-muted-foreground">Ainda não marcado como pago</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">Atendimentos</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 pt-0">
                <p className="text-lg font-semibold">{financeSummary.itens}</p>
                <p className="text-xs text-muted-foreground">Com os filtros atuais</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:max-w-3xl lg:gap-4">
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
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3 xl:gap-5">
            <AppointmentListSkeleton count={6} className="contents" />
          </div>
        ) : agendamentos.length > 0 ? (
          <div className="space-y-6 md:space-y-8">
            {groupedByDate.map(({ dateKey, items }) => (
              <section key={dateKey} className="space-y-3">
                <h2 className="border-b pb-1 text-sm font-semibold capitalize text-foreground md:text-base">
                  {formatDateHeading(dateKey)}
                </h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3 xl:gap-5">
                  {items.map((agendamento) => (
                    <AppointmentCard
                      key={agendamento.id}
                      appointment={agendamento}
                      showActions
                      onMarkPaid={handleMarkPaid}
                    />
                  ))}
                </div>
              </section>
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
    </TenantPanelPageContainer>
  )
}
