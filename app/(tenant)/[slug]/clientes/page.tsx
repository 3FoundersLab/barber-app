'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, Search, Users } from 'lucide-react'
import { PageContent, PageTitle } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { ClienteCard } from '@/components/domain/cliente-card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClientCardSkeleton } from '@/components/shared/loading-skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import { getClientesDemoForBarbearia } from '@/lib/clientes-demo-data'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { maskTelefoneBr, normalizeEmailInput } from '@/lib/format-contato'
import {
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatCurrency,
  formatDate,
  formatTime,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import type { Agendamento, AppointmentStatus, Cliente, PaymentStatus } from '@/types'

const CLIENTES_PAGE_SIZE_OPTIONS = [12, 24, 36, 48] as const
type ClientesPageSize = (typeof CLIENTES_PAGE_SIZE_OPTIONS)[number]

function pageNumberItems(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  const set = new Set<number>([1, total])
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) set.add(i)
  }
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | 'ellipsis')[] = []
  let prev = 0
  for (const p of sorted) {
    if (p - prev > 1) out.push('ellipsis')
    out.push(p)
    prev = p
  }
  return out
}

type ClienteHistoricoRow = Pick<
  Agendamento,
  'id' | 'data' | 'horario' | 'status' | 'status_pagamento' | 'valor'
> & {
  servico: { nome: string } | null
  barbeiro: { nome: string } | null
}

function formatAgendamentoDataLocal(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return ymd
  return formatDate(new Date(y, m - 1, d))
}

export default function AdminClientesPage() {
  const { slug, base } = useTenantAdminBase()
  const searchParams = useSearchParams()

  const [clientesReais, setClientesReais] = useState<Cliente[]>([])
  const [useDemoData, setUseDemoData] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<ClientesPageSize>(12)
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null)
  const [historicoCliente, setHistoricoCliente] = useState<Cliente | null>(null)
  const [historicoRows, setHistoricoRows] = useState<ClienteHistoricoRow[]>([])
  const [historicoLoading, setHistoricoLoading] = useState(false)
  const [historicoError, setHistoricoError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    notas: '',
    origem_canal: '',
    data_nascimento: '',
  })

  useEffect(() => {
    loadClientes()
  }, [slug])

  useEffect(() => {
    const q = searchParams.get('q')?.trim()
    if (q) setSearchTerm(q)
  }, [searchParams])

  useEffect(() => {
    setPage(1)
  }, [searchTerm, pageSize, useDemoData])

  const clientesExibidos = useMemo(() => {
    if (useDemoData && barbeariaId) return getClientesDemoForBarbearia(barbeariaId)
    return clientesReais
  }, [useDemoData, barbeariaId, clientesReais])

  const filteredClientes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return clientesExibidos
    return clientesExibidos.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.telefone?.includes(searchTerm.trim()) ?? false) ||
        (c.email?.toLowerCase().includes(q) ?? false),
    )
  }, [searchTerm, clientesExibidos])

  const totalFiltered = filteredClientes.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const paginatedClientes = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredClientes.slice(start, start + pageSize)
  }, [filteredClientes, page, pageSize])

  const rangeStart = totalFiltered === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, totalFiltered)
  const pageItems = useMemo(() => pageNumberItems(page, totalPages), [page, totalPages])

  async function loadClientes() {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const barbeariaIdResolved = await resolveAdminBarbeariaId(supabase, user.id, { slug })

      if (barbeariaIdResolved) {
        setBarbeariaId(barbeariaIdResolved)

        const { data } = await supabase
          .from('clientes')
          .select('*')
          .eq('barbearia_id', barbeariaIdResolved)
          .order('nome')

        if (data) {
          setClientesReais(data)
        }
      }
    }

    setIsLoading(false)
  }

  const showClientesSkeleton = isLoading && !(useDemoData && barbeariaId)

  const loadHistoricoCliente = useCallback(
    async (clienteId: string) => {
      if (!barbeariaId) return
      setHistoricoLoading(true)
      setHistoricoError(null)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('agendamentos')
        .select(
          `
          id,
          data,
          horario,
          status,
          status_pagamento,
          valor,
          servico:servicos(nome),
          barbeiro:barbeiros(nome)
        `,
        )
        .eq('barbearia_id', barbeariaId)
        .eq('cliente_id', clienteId)
        .order('data', { ascending: false })
        .order('horario', { ascending: false })
        .limit(150)

      setHistoricoLoading(false)
      if (error) {
        setHistoricoError('Não foi possível carregar o histórico de agendamentos.')
        setHistoricoRows([])
        return
      }
      setHistoricoRows((data ?? []) as unknown as ClienteHistoricoRow[])
    },
    [barbeariaId],
  )

  const handleOpenHistorico = (cliente: Cliente) => {
    setHistoricoCliente(cliente)
    setHistoricoRows([])
    setHistoricoError(null)
    void loadHistoricoCliente(cliente.id)
  }

  const handleOpenNew = () => {
    setEditingCliente(null)
    setFormData({
      nome: '',
      telefone: '',
      email: '',
      notas: '',
      origem_canal: '',
      data_nascimento: '',
    })
    setIsDialogOpen(true)
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setFormData({
      nome: cliente.nome,
      telefone: maskTelefoneBr(cliente.telefone || ''),
      email: normalizeEmailInput(cliente.email || ''),
      notas: cliente.notas || '',
      origem_canal: cliente.origem_canal ?? '',
      data_nascimento: cliente.data_nascimento ? cliente.data_nascimento.slice(0, 10) : '',
    })
    setIsDialogOpen(true)
  }

  const solicitarExclusaoCliente = (id: string) => {
    const c = clientesReais.find((x) => x.id === id)
    if (c) setClienteParaExcluir(c)
  }

  const confirmarExclusaoCliente = async () => {
    if (!clienteParaExcluir) return
    const supabase = createClient()
    await supabase.from('clientes').delete().eq('id', clienteParaExcluir.id)
    setClienteParaExcluir(null)
    loadClientes()
  }

  const handleSave = async () => {
    if (!barbeariaId || useDemoData) return

    setIsSaving(true)
    const supabase = createClient()

    const clienteData = {
      barbearia_id: barbeariaId,
      nome: formData.nome,
      telefone: formData.telefone,
      email: formData.email || null,
      notas: formData.notas || null,
      origem_canal: formData.origem_canal?.trim() ? formData.origem_canal.trim().toLowerCase() : null,
      data_nascimento: formData.data_nascimento?.trim() ? formData.data_nascimento.trim() : null,
    }

    if (editingCliente) {
      await supabase.from('clientes').update(clienteData).eq('id', editingCliente.id)
    } else {
      await supabase.from('clientes').insert(clienteData)
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    loadClientes()
  }

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader greetingOnly profileHref={`${base}/configuracoes`} avatarFallback="A" />

      <PageContent className="space-y-4 md:space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <PageTitle className="min-w-0 truncate">Clientes</PageTitle>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5">
              <Switch
                id="clientes-demo-data"
                checked={useDemoData}
                onCheckedChange={setUseDemoData}
                aria-label="Usar dados fictícios de demonstração"
              />
              <Label htmlFor="clientes-demo-data" className="cursor-pointer text-xs font-medium">
                Dados fictícios
              </Label>
            </div>
            <Button
              type="button"
              className="w-full shrink-0 sm:w-auto"
              size="sm"
              onClick={handleOpenNew}
              disabled={useDemoData}
              title={useDemoData ? 'Desative dados fictícios para cadastrar clientes reais' : undefined}
            >
              <Plus className="mr-1 h-4 w-4" aria-hidden />
              Novo cliente
            </Button>
          </div>
        </div>

        {useDemoData ? (
          <Alert variant="info">
            <AlertTitle>
              Modo demonstração: lista com 15 clientes fictícios (somente visualização). Desligue o interruptor para
              ver e editar os clientes reais desta barbearia.
            </AlertTitle>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
            <Label
              htmlFor="clientes-page-size"
              className="shrink-0 whitespace-nowrap text-sm text-muted-foreground"
            >
              Itens
            </Label>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v) as ClientesPageSize)}
            >
              <SelectTrigger id="clientes-page-size" className="h-9 w-[4.75rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENTES_PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          className={
            showClientesSkeleton || clientesExibidos.length > 0
              ? 'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4 xl:gap-4 2xl:grid-cols-6'
              : undefined
          }
        >
          {showClientesSkeleton ? (
            Array.from({ length: Math.min(pageSize, 48) }).map((_, i) => (
              <ClientCardSkeleton key={i} />
            ))
          ) : filteredClientes.length > 0 ? (
            paginatedClientes.map((cliente) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                {...(useDemoData
                  ? {}
                  : {
                      onHistorico: handleOpenHistorico,
                      onEdit: handleEdit,
                      onDelete: solicitarExclusaoCliente,
                    })}
              />
            ))
          ) : (
            <Card className="col-span-full overflow-hidden border-dashed bg-gradient-to-b from-muted/50 via-background to-muted/30 shadow-none">
              <CardContent className="px-4 py-12 sm:px-8 sm:py-16">
                <Empty className="min-h-[14rem] border-0 p-0 md:min-h-[16rem] md:p-0">
                  <EmptyHeader className="max-w-md gap-3">
                    <EmptyMedia variant="icon" className="mb-0 size-12 rounded-xl bg-primary/10 text-primary">
                      {searchTerm.trim() ? (
                        <Search className="size-6" strokeWidth={1.75} aria-hidden />
                      ) : (
                        <Users className="size-6" strokeWidth={1.75} aria-hidden />
                      )}
                    </EmptyMedia>
                    {searchTerm.trim() ? (
                      <>
                        <EmptyTitle>Nenhum cliente encontrado</EmptyTitle>
                        <EmptyDescription>
                          Não há resultados para &ldquo;{searchTerm.trim()}&rdquo;. Confira a grafia ou use parte do
                          nome, telefone ou e-mail.
                        </EmptyDescription>
                      </>
                    ) : (
                      <>
                        <EmptyTitle>Sua base de clientes está vazia</EmptyTitle>
                        <EmptyDescription>
                          Cadastre quem costuma agendar com vocês para agilizar o atendimento, manter histórico e
                          oferecer um serviço mais personalizado.
                        </EmptyDescription>
                      </>
                    )}
                  </EmptyHeader>
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                    {searchTerm.trim() ? (
                      <Button type="button" variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                        Limpar busca
                      </Button>
                    ) : null}
                    {!searchTerm.trim() && !useDemoData ? (
                      <Button
                        type="button"
                        size="sm"
                        className="bg-[#E05A2A] text-white hover:bg-[#C44D22]"
                        onClick={handleOpenNew}
                      >
                        <Plus className="mr-1 size-4" aria-hidden />
                        Cadastrar primeiro cliente
                      </Button>
                    ) : null}
                  </div>
                </Empty>
              </CardContent>
            </Card>
          )}
        </div>

        {!showClientesSkeleton && totalFiltered > 0 ? (
          <div className="border-t border-border/60 pt-4">
            <Pagination className="mx-0 flex w-full max-w-full flex-col items-center gap-2">
              <PaginationContent className="flex h-9 flex-row flex-wrap items-center justify-center gap-1">
                <PaginationItem>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1 px-2.5"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>
                </PaginationItem>
                {pageItems.map((item, idx) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`e-${idx}`} className="flex h-9 items-center">
                      <PaginationEllipsis className="size-9" />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item} className="flex h-9 items-center">
                      <Button
                        type="button"
                        variant={item === page ? 'default' : 'ghost'}
                        size="icon"
                        className={cn(
                          'h-9 min-w-9',
                          item === page && 'pointer-events-none font-semibold',
                        )}
                        onClick={() => setPage(item)}
                        aria-label={`Página ${item}`}
                        aria-current={item === page ? 'page' : undefined}
                      >
                        {item}
                      </Button>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1 px-2.5"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Próxima página"
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
              <p className="text-center text-xs text-muted-foreground">
                {rangeStart}–{rangeEnd} de {totalFiltered}{' '}
                {totalFiltered === 1 ? 'cliente' : 'clientes'} · Página {page} de {totalPages}
              </p>
            </Pagination>
          </div>
        ) : null}
      </PageContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg lg:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-x-4 lg:gap-y-4 lg:space-y-0">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: maskTelefoneBr(e.target.value) })}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: normalizeEmailInput(e.target.value) })
                }
                placeholder="email@exemplo.com"
                inputMode="email"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="origem">Canal de origem (opcional)</Label>
              <Select
                value={formData.origem_canal || '__nao__'}
                onValueChange={(v) =>
                  setFormData({ ...formData, origem_canal: v === '__nao__' ? '' : v })
                }
              >
                <SelectTrigger id="origem">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__nao__">Não informado</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="walk_in">Walk-in</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nascimento">Data de nascimento (opcional)</Label>
              <Input
                id="nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="notas">Notas (opcional)</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Observações sobre o cliente"
                className="min-h-[100px] lg:min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.nome || !formData.telefone || useDemoData}
            >
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet
        open={historicoCliente != null}
        onOpenChange={(open) => {
          if (!open) {
            setHistoricoCliente(null)
            setHistoricoRows([])
            setHistoricoError(null)
          }
        }}
      >
        <SheetContent
          side="right"
          className="flex h-full max-h-screen w-full flex-col gap-0 overflow-hidden border-l p-0 sm:max-w-md"
        >
          <SheetHeader className="shrink-0 space-y-1 border-b border-border/60 px-6 py-4 pr-14 text-left">
            <SheetTitle>Histórico de agendamentos</SheetTitle>
            {historicoCliente ? (
              <p className="text-sm font-medium text-foreground">{historicoCliente.nome}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">Até 150 registros mais recentes nesta unidade.</p>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-3">
            {historicoLoading ? (
              <div className="flex flex-1 items-center justify-center py-12">
                <Spinner className="size-8" />
              </div>
            ) : historicoError ? (
              <p className="py-6 text-center text-sm text-destructive">{historicoError}</p>
            ) : historicoRows.length === 0 ? (
              <p className="flex-1 py-10 text-center text-sm text-muted-foreground">
                Nenhum agendamento encontrado para este cliente.
              </p>
            ) : (
              <ScrollArea className="min-h-0 flex-1 pr-3">
                <ul className="space-y-3 pb-4">
                  {historicoRows.map((row) => {
                    const st = row.status as AppointmentStatus
                    const pay = row.status_pagamento as PaymentStatus
                    const stColors = APPOINTMENT_STATUS_COLORS[st]
                    return (
                      <li
                        key={row.id}
                        className="rounded-xl border border-border/70 bg-muted/20 px-3 py-2.5 dark:bg-muted/10"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-sm font-semibold text-foreground">
                              {formatAgendamentoDataLocal(row.data)} · {formatTime(row.horario)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {row.servico?.nome ?? 'Serviço'} · {row.barbeiro?.nome ?? 'Profissional'}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                            {formatCurrency(row.valor)}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span
                            className={cn(
                              'inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                              stColors.bg,
                              stColors.text,
                            )}
                          >
                            {APPOINTMENT_STATUS_LABELS[st]}
                          </span>
                          <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {PAYMENT_STATUS_LABELS[pay]}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </ScrollArea>
            )}
          </div>
          <SheetFooter className="shrink-0 border-t border-border/60 sm:flex-row sm:justify-center">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Fechar
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={clienteParaExcluir != null}
        onOpenChange={(open) => {
          if (!open) setClienteParaExcluir(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              {clienteParaExcluir
                ? `“${clienteParaExcluir.nome}” será removido dos clientes. Esta ação não pode ser desfeita.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmarExclusaoCliente()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TenantPanelPageContainer>
  )
}
