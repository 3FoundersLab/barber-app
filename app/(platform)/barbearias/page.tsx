'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, LogIn, Pencil, Plus, Search } from 'lucide-react'
import { PageContainer, PageContent, PageTitle } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { Button } from '@/components/ui/button'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { SuperGridEntityListSkeleton } from '@/components/shared/loading-skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import { createClient } from '@/lib/supabase/client'
import { SUPER_ADMIN_BARBEARIA_STORAGE_KEY } from '@/lib/resolve-admin-barbearia-id'
import { tenantBarbeariaDashboardPath } from '@/lib/routes'
import type { Barbearia } from '@/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
type BarbeariasPageSize = (typeof PAGE_SIZE_OPTIONS)[number]

const SORT_OPTIONS = [
  { value: 'nome_asc', label: 'Nome (A–Z)' },
  { value: 'nome_desc', label: 'Nome (Z–A)' },
  { value: 'slug_asc', label: 'Slug (A–Z)' },
  { value: 'slug_desc', label: 'Slug (Z–A)' },
] as const
type BarbeariasSort = (typeof SORT_OPTIONS)[number]['value']

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

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

const emptyForm = {
  nome: '',
  slug: '',
  telefone: '',
  email: '',
  endereco: '',
  ativo: true,
}

export default function SuperBarbeariasPage() {
  const router = useRouter()
  const [barbearias, setBarbearias] = useState<Barbearia[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<BarbeariasPageSize>(10)
  const [sortBy, setSortBy] = useState<BarbeariasSort>('nome_asc')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBarbearia, setEditingBarbearia] = useState<Barbearia | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  /** Enquanto true, o slug acompanha o nome; ao editar o slug manualmente, passa a false. */
  const [slugAutofill, setSlugAutofill] = useState(true)
  /** Idem no modal de edição; inicia true só se o slug já for o derivado do nome (evita apagar slug customizado). */
  const [editSlugAutofill, setEditSlugAutofill] = useState(true)

  useEffect(() => {
    loadBarbearias()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, sortBy])

  async function loadBarbearias() {
    const supabase = createClient()
    setError(null)

    const { data, error: queryError } = await supabase
      .from('barbearias')
      .select('*')
      .order('nome', { ascending: true })

    if (queryError) {
      setError('Não foi possível carregar as barbearias')
      setBarbearias([])
    } else {
      setBarbearias(data || [])
    }

    setIsLoading(false)
  }

  async function handleCreate() {
    if (!form.nome || !form.slug) return
    setIsSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase
      .from('barbearias')
      .insert({
        nome: form.nome,
        slug: form.slug,
        telefone: form.telefone || null,
        email: form.email || null,
        endereco: form.endereco || null,
      })

    if (insertError) {
      setError('Não foi possível criar a barbearia')
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    setForm(emptyForm)
    setSlugAutofill(true)
    loadBarbearias()
  }

  function openEdit(b: Barbearia) {
    setEditingBarbearia(b)
    setEditSlugAutofill(slugify(b.nome) === b.slug)
    setEditForm({
      nome: b.nome,
      slug: b.slug,
      telefone: b.telefone ?? '',
      email: b.email ?? '',
      endereco: b.endereco ?? '',
      ativo: b.ativo !== false,
    })
  }

  async function handleSaveEdit() {
    if (!editingBarbearia || !editForm.nome || !editForm.slug) return
    setIsSavingEdit(true)
    setError(null)

    try {
      const res = await fetch('/api/platform/barbearias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBarbearia.id,
          nome: editForm.nome.trim(),
          slug: editForm.slug,
          telefone: editForm.telefone || null,
          email: editForm.email || null,
          endereco: editForm.endereco || null,
          ativo: editForm.ativo,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(
          typeof json.error === 'string'
            ? json.error
            : 'Não foi possível salvar as alterações. Verifique SUPABASE_SERVICE_ROLE_KEY no servidor ou execute scripts/015 e 017 no Supabase.',
        )
        setIsSavingEdit(false)
        return
      }
    } catch {
      setError('Não foi possível salvar as alterações.')
      setIsSavingEdit(false)
      return
    }

    setIsSavingEdit(false)
    setEditingBarbearia(null)
    setEditForm(emptyForm)
    setEditSlugAutofill(true)
    loadBarbearias()
  }

  async function handleImpersonate(barbeariaId: string, slug: string) {
    setError(null)

    const res = await fetch('/api/platform/barbearias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barbearia_id: barbeariaId }),
    })

    if (res.ok) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SUPER_ADMIN_BARBEARIA_STORAGE_KEY, barbeariaId)
      }
      router.push(tenantBarbeariaDashboardPath(slug))
      return
    }

    const json = (await res.json().catch(() => ({}))) as { error?: string }
    if (res.status === 503) {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) {
        setError('Usuário não autenticado')
        return
      }
      const { error: upsertError } = await supabase
        .from('barbearia_users')
        .upsert(
          {
            barbearia_id: barbeariaId,
            user_id: userId,
            role: 'admin',
          },
          { onConflict: 'barbearia_id,user_id' },
        )
      if (upsertError) {
        setError('Não foi possível acessar esta barbearia')
        return
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SUPER_ADMIN_BARBEARIA_STORAGE_KEY, barbeariaId)
      }
      router.push(tenantBarbeariaDashboardPath(slug))
      return
    }

    setError(
      typeof json.error === 'string'
        ? json.error
        : 'Não foi possível acessar esta barbearia',
    )
  }

  const filtered = useMemo(() => {
    let rows = barbearias
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter((b) => b.nome.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q))
    }
    return [...rows].sort((a, b) => {
      if (sortBy === 'nome_asc' || sortBy === 'nome_desc') {
        const cmp = (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
        return sortBy === 'nome_asc' ? cmp : -cmp
      }
      const cmp = (a.slug || '').localeCompare(b.slug || '', 'pt-BR', { sensitivity: 'base' })
      return sortBy === 'slug_asc' ? cmp : -cmp
    })
  }, [barbearias, search, sortBy])

  const totalPages =
    filtered.length === 0 ? 0 : Math.ceil(filtered.length / pageSize)
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  const pageItems = useMemo(
    () => (totalPages > 0 ? pageNumberItems(currentPage, totalPages) : []),
    [currentPage, totalPages],
  )

  return (
    <PageContainer>
      <AppPageHeader greetingOnly profileHref="/conta/editar" avatarFallback="S" />

      <PageContent className="space-y-4 pb-20 md:pb-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0"
              onClick={() => router.back()}
              aria-label="Voltar"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <PageTitle className="min-w-0 truncate">Barbearias</PageTitle>
          </div>
          <Button
            type="button"
            className="w-full shrink-0 sm:w-auto"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova barbearia
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex w-full shrink-0 flex-wrap items-center gap-x-3 gap-y-2 sm:w-auto sm:justify-end">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial sm:min-w-0">
              <Label
                htmlFor="barbearias-sort"
                className="text-sm text-muted-foreground whitespace-nowrap"
              >
                Ordenar
              </Label>
              <Select
                value={sortBy}
                onValueChange={(v) => {
                  const opt = SORT_OPTIONS.find((o) => o.value === v)
                  if (opt) setSortBy(opt.value)
                }}
              >
                <SelectTrigger id="barbearias-sort" className="h-9 min-w-[9.5rem] flex-1 sm:flex-initial sm:min-w-[10rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="barbearias-page-size"
                className="text-sm text-muted-foreground whitespace-nowrap"
              >
                Itens por página
              </Label>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  const n = Number(v)
                  const opt = PAGE_SIZE_OPTIONS.find((x) => x === n)
                  if (opt !== undefined) {
                    setPageSize(opt)
                    setPage(1)
                  }
                }}
              >
                <SelectTrigger id="barbearias-page-size" className="h-9 w-[4.5rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={String(opt)}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {error && (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        {isLoading ? (
          <SuperGridEntityListSkeleton count={8} />
        ) : filtered.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginated.map((barbearia) => {
              const isAtivo = barbearia.ativo !== false
              return (
                <li key={barbearia.id}>
                  <article
                    className={cn(
                      'flex h-full min-h-0 flex-col rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.04] transition-shadow duration-200 hover:shadow-md dark:ring-white/[0.06]',
                      !isAtivo && 'opacity-[0.72]',
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <h2 className="truncate text-lg font-semibold tracking-tight text-foreground">
                        {barbearia.nome}
                      </h2>
                      <p
                        className="truncate text-sm font-medium text-muted-foreground"
                        title={`/${barbearia.slug}`}
                      >
                        /{barbearia.slug}
                      </p>
                      <p className="truncate pt-2 text-xs leading-relaxed text-muted-foreground/90" title={barbearia.email ?? undefined}>
                        {barbearia.email ?? '—'}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/50 pt-4">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                          isAtivo
                            ? 'bg-emerald-500/[0.12] text-emerald-800 dark:text-emerald-400'
                            : 'bg-red-500/[0.1] text-red-800 dark:text-red-400',
                        )}
                      >
                        <span
                          className={cn(
                            'size-1.5 shrink-0 rounded-full',
                            isAtivo ? 'bg-emerald-500' : 'bg-red-500',
                          )}
                          aria-hidden
                        />
                        {isAtivo ? 'Ativo' : 'Inativo'}
                      </span>

                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 rounded-lg border-border/80 bg-background px-2.5 font-normal shadow-none hover:bg-muted hover:text-foreground dark:hover:bg-muted/80"
                          onClick={() => openEdit(barbearia)}
                        >
                          <Pencil className="size-3.5" strokeWidth={1.75} />
                          Editar
                        </Button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="default"
                              size="icon-sm"
                              className="size-8 rounded-lg border-0 bg-black text-white shadow-none hover:bg-black/80 hover:text-white focus-visible:ring-black/35 dark:bg-white dark:text-zinc-950 dark:hover:bg-white/80 dark:hover:text-zinc-950 dark:focus-visible:ring-white/40 [&_svg]:text-white dark:[&_svg]:text-zinc-950"
                              onClick={() => handleImpersonate(barbearia.id, barbearia.slug)}
                              aria-label="Acessar Barbearia"
                            >
                              <LogIn className="size-3.5" strokeWidth={1.75} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6}>
                            Acessar Barbearia
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </article>
                </li>
              )
            })}
          </ul>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma barbearia encontrada
            </CardContent>
          </Card>
        )}

        {!isLoading && filtered.length > 0 && totalPages > 0 ? (
          <div className="border-t pt-4">
            <Pagination className="mx-0 flex w-full max-w-full flex-col items-center gap-2">
              <PaginationContent className="flex h-9 flex-row flex-wrap items-center justify-center gap-1">
                <PaginationItem>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1 px-2.5"
                    disabled={currentPage <= 1}
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
                        variant={item === currentPage ? 'default' : 'ghost'}
                        size="icon"
                        className={cn(
                          'h-9 min-w-9',
                          item === currentPage && 'pointer-events-none font-semibold',
                        )}
                        onClick={() => setPage(item)}
                        aria-label={`Página ${item}`}
                        aria-current={item === currentPage ? 'page' : undefined}
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
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Próxima página"
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
              <p className="text-center text-xs text-muted-foreground">
                Página {currentPage} de {totalPages} · {filtered.length}{' '}
                {filtered.length === 1 ? 'barbearia' : 'barbearias'}
              </p>
            </Pagination>
          </div>
        ) : null}
      </PageContent>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (open) {
            setSlugAutofill(true)
            setForm(emptyForm)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Barbearia</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => {
                  const nome = e.target.value
                  setForm((prev) => ({
                    ...prev,
                    nome,
                    ...(slugAutofill ? { slug: slugify(nome) } : {}),
                  }))
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugAutofill(false)
                  setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={form.telefone}
                onChange={(e) => setForm((prev) => ({ ...prev, telefone: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={form.endereco}
                onChange={(e) => setForm((prev) => ({ ...prev, endereco: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={isSaving || !form.nome || !form.slug}>
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Salvando...' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingBarbearia}
        onOpenChange={(open) => {
          if (!open) {
            setEditingBarbearia(null)
            setEditForm(emptyForm)
            setEditSlugAutofill(true)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar barbearia</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={editForm.nome}
                onChange={(e) => {
                  const nome = e.target.value
                  setEditForm((prev) => ({
                    ...prev,
                    nome,
                    ...(editSlugAutofill ? { slug: slugify(nome) } : {}),
                  }))
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={editForm.slug}
                onChange={(e) => {
                  setEditSlugAutofill(false)
                  setEditForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-telefone">Telefone</Label>
              <Input
                id="edit-telefone"
                value={editForm.telefone}
                onChange={(e) => setEditForm((prev) => ({ ...prev, telefone: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                value={editForm.email}
                onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-endereco">Endereço</Label>
              <Input
                id="edit-endereco"
                value={editForm.endereco}
                onChange={(e) => setEditForm((prev) => ({ ...prev, endereco: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
              <div className="space-y-0.5">
                <Label htmlFor="edit-ativo" className="text-sm font-medium">
                  Barbearia ativa
                </Label>
                <p className="text-xs text-muted-foreground">
                  Inativas permanecem no sistema, mas ficam marcadas como inativas.
                </p>
              </div>
              <Switch
                id="edit-ativo"
                checked={editForm.ativo}
                onCheckedChange={(checked) =>
                  setEditForm((prev) => ({ ...prev, ativo: checked }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingBarbearia(null)
                setEditForm(emptyForm)
                setEditSlugAutofill(true)
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void handleSaveEdit()}
              disabled={isSavingEdit || !editForm.nome || !editForm.slug}
            >
              {isSavingEdit ? <Spinner className="mr-2" /> : null}
              {isSavingEdit ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
