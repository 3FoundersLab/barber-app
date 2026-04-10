'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClientCardSkeleton } from '@/components/shared/loading-skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { maskTelefoneBr, normalizeEmailInput } from '@/lib/format-contato'
import { cn } from '@/lib/utils'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import type { Cliente } from '@/types'

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

export default function AdminClientesPage() {
  const { slug, base } = useTenantAdminBase()
  const searchParams = useSearchParams()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<ClientesPageSize>(24)
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    telefone: '',
    email: '',
    notas: '',
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
  }, [searchTerm, pageSize])

  const filteredClientes = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.telefone?.includes(searchTerm.trim()) ?? false) ||
        (c.email?.toLowerCase().includes(q) ?? false),
    )
  }, [searchTerm, clientes])

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
          setClientes(data)
        }
      }
    }

    setIsLoading(false)
  }

  const handleOpenNew = () => {
    setEditingCliente(null)
    setFormData({
      nome: '',
      telefone: '',
      email: '',
      notas: '',
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
    })
    setIsDialogOpen(true)
  }

  const solicitarExclusaoCliente = (id: string) => {
    const c = clientes.find((x) => x.id === id)
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
    if (!barbeariaId) return

    setIsSaving(true)
    const supabase = createClient()

    const clienteData = {
      barbearia_id: barbeariaId,
      nome: formData.nome,
      telefone: formData.telefone,
      email: formData.email || null,
      notas: formData.notas || null,
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
          <Button type="button" className="w-full shrink-0 sm:w-auto" size="sm" onClick={handleOpenNew}>
            <Plus className="mr-1 h-4 w-4" />
            Novo
          </Button>
        </div>

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
            isLoading || clientes.length > 0
              ? 'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 lg:grid-cols-4 lg:gap-4 xl:grid-cols-6'
              : undefined
          }
        >
          {isLoading ? (
            Array.from({ length: Math.min(pageSize, 48) }).map((_, i) => (
              <ClientCardSkeleton key={i} />
            ))
          ) : filteredClientes.length > 0 ? (
            paginatedClientes.map((cliente) => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                onEdit={handleEdit}
                onDelete={solicitarExclusaoCliente}
              />
            ))
          ) : (
            <Card className="col-span-full border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm.trim() ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                </p>
                {!searchTerm.trim() && (
                  <Button size="sm" className="mt-3" onClick={handleOpenNew}>
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar cliente
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {!isLoading && totalFiltered > 0 ? (
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
            <Button onClick={handleSave} disabled={isSaving || !formData.nome || !formData.telefone}>
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
