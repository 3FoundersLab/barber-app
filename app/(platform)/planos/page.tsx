'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { PageContainer, PageContent, PageTitle } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { SuperGridEntityListSkeleton } from '@/components/shared/loading-skeleton'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { linhasBeneficiosPlano, parsePlanoBeneficios } from '@/lib/plano-beneficios'
import type { Plano } from '@/types'

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const
type PlanosPageSize = (typeof PAGE_SIZE_OPTIONS)[number]

const PLANOS_SORT_OPTIONS = [
  { value: 'nome_asc', label: 'Nome (A–Z)' },
  { value: 'nome_desc', label: 'Nome (Z–A)' },
  { value: 'preco_asc', label: 'Preço (menor)' },
  { value: 'preco_desc', label: 'Preço (maior)' },
] as const
type PlanosSort = (typeof PLANOS_SORT_OPTIONS)[number]['value']

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

type BeneficioFormRow = { key: string; texto: string; ativo: boolean }

function newBeneficioRow(partial?: Partial<Pick<BeneficioFormRow, 'texto' | 'ativo'>>): BeneficioFormRow {
  return {
    key: globalThis.crypto?.randomUUID?.() ?? `b-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    texto: partial?.texto ?? '',
    ativo: partial?.ativo ?? true,
  }
}

function planoToBeneficioRows(plano: Plano): BeneficioFormRow[] {
  const parsed = parsePlanoBeneficios(plano.beneficios)
  if (parsed.length === 0) return []
  return parsed.map((b) => newBeneficioRow({ texto: b.texto, ativo: b.ativo }))
}

const emptyForm = {
  nome: '',
  preco_mensal: '',
  beneficios: [] as BeneficioFormRow[],
  ativo: true,
}

export default function SuperPlanosPage() {
  const router = useRouter()
  const [planos, setPlanos] = useState<Plano[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PlanosPageSize>(10)
  const [sortBy, setSortBy] = useState<PlanosSort>('preco_asc')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlano, setEditingPlano] = useState<Plano | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Plano | null>(null)
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    let rows = planos
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      rows = rows.filter((p) => {
        if (p.nome.toLowerCase().includes(q)) return true
        return parsePlanoBeneficios(p.beneficios).some((b) => b.texto.toLowerCase().includes(q))
      })
    }
    return [...rows].sort((a, b) => {
      if (sortBy === 'nome_asc' || sortBy === 'nome_desc') {
        const cmp = (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' })
        return sortBy === 'nome_asc' ? cmp : -cmp
      }
      const pa = a.preco_mensal ?? 0
      const pb = b.preco_mensal ?? 0
      return sortBy === 'preco_asc' ? pa - pb : pb - pa
    })
  }, [planos, search, sortBy])

  const totalPages =
    filtered.length === 0 ? 0 : Math.ceil(filtered.length / pageSize)
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  const pageItems = useMemo(
    () => (totalPages > 0 ? pageNumberItems(currentPage, totalPages) : []),
    [currentPage, totalPages],
  )

  useEffect(() => {
    loadPlanos()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, sortBy])

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  async function loadPlanos() {
    const supabase = createClient()
    setError(null)

    const { data, error: queryError } = await supabase
      .from('planos')
      .select('*')
      .order('preco_mensal')

    if (queryError) {
      setError('Não foi possível carregar os planos')
      setPlanos([])
    } else {
      setPlanos(data || [])
    }

    setIsLoading(false)
  }

  function openCreate() {
    setEditingPlano(null)
    setForm(emptyForm)
    setIsDialogOpen(true)
  }

  function openEdit(plano: Plano) {
    setEditingPlano(plano)
    setForm({
      nome: plano.nome,
      preco_mensal: String(plano.preco_mensal),
      beneficios: planoToBeneficioRows(plano),
      ativo: plano.ativo,
    })
    setIsDialogOpen(true)
  }

  function handleDialogOpenChange(open: boolean) {
    setIsDialogOpen(open)
    if (!open) setEditingPlano(null)
  }

  async function handleSave() {
    if (!form.nome || !form.preco_mensal) return
    setIsSaving(true)
    setError(null)

    const supabase = createClient()
    const beneficios = form.beneficios
      .map((b) => ({ texto: b.texto.trim(), ativo: b.ativo }))
      .filter((b) => b.texto.length > 0)

    const payload = {
      nome: form.nome,
      preco_mensal: Number(form.preco_mensal),
      beneficios,
      ativo: form.ativo,
    }

    if (editingPlano) {
      const { error: updateError } = await supabase.from('planos').update(payload).eq('id', editingPlano.id)
      if (updateError) {
        setError('Não foi possível atualizar o plano')
        setIsSaving(false)
        return
      }
    } else {
      const { error: insertError } = await supabase.from('planos').insert(payload)
      if (insertError) {
        setError('Não foi possível criar o plano')
        setIsSaving(false)
        return
      }
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    setEditingPlano(null)
    setForm(emptyForm)
    loadPlanos()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    setError(null)
    const supabase = createClient()
    const { error: deleteError } = await supabase.from('planos').delete().eq('id', deleteTarget.id)
    setIsDeleting(false)
    if (deleteError) {
      setError(
        deleteError.code === '23503'
          ? 'Este plano está em uso e não pode ser excluído'
          : 'Não foi possível excluir o plano',
      )
      setDeleteTarget(null)
      return
    }
    setDeleteTarget(null)
    loadPlanos()
  }

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
            <PageTitle className="min-w-0 truncate">Planos</PageTitle>
          </div>
          <Button
            type="button"
            className="w-full shrink-0 sm:w-auto"
            onClick={openCreate}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo plano
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex w-full shrink-0 flex-wrap items-center gap-x-3 gap-y-2 sm:w-auto sm:justify-end">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-initial sm:min-w-0">
              <Label
                htmlFor="planos-sort"
                className="text-sm text-muted-foreground whitespace-nowrap"
              >
                Ordenar
              </Label>
              <Select
                value={sortBy}
                onValueChange={(v) => {
                  const opt = PLANOS_SORT_OPTIONS.find((o) => o.value === v)
                  if (opt) setSortBy(opt.value)
                }}
              >
                <SelectTrigger
                  id="planos-sort"
                  className="h-9 min-w-[9.5rem] flex-1 sm:flex-initial sm:min-w-[10rem]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANOS_SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="planos-page-size"
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
                <SelectTrigger id="planos-page-size" className="h-9 w-[4.5rem]">
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
          <SuperGridEntityListSkeleton
            count={6}
            listClassName="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          />
        ) : planos.length === 0 ? (
          <Card className="border-dashed border-border/60 bg-transparent shadow-none">
            <CardContent className="py-14 text-center text-sm text-muted-foreground">
              Nenhum plano cadastrado
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed border-border/60 bg-transparent shadow-none">
            <CardContent className="py-14 text-center text-sm text-muted-foreground">
              Nenhum plano corresponde à pesquisa
            </CardContent>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.map((plano) => (
              <li key={plano.id}>
                <article
                  className={cn(
                    'flex h-full flex-col rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.04] transition-shadow duration-200 hover:shadow-md dark:ring-white/[0.06]',
                    !plano.ativo && 'opacity-[0.72]',
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{plano.nome}</h2>
                    <p className="text-sm font-medium tabular-nums text-muted-foreground">
                      {formatCurrency(plano.preco_mensal)}
                      <span className="font-normal text-muted-foreground/80"> / mês</span>
                    </p>
                    <ul className="pt-2 text-xs leading-relaxed text-muted-foreground/90">
                      {linhasBeneficiosPlano(plano).length === 0 ? (
                        <li className="list-none text-muted-foreground/70">Nenhum benefício ativo</li>
                      ) : (
                        linhasBeneficiosPlano(plano).map((linha, idx) => (
                          <li key={`${plano.id}-${idx}`} className="flex items-start gap-2">
                            <Check
                              className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                              strokeWidth={2.5}
                              aria-hidden
                            />
                            <span>{linha}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/50 pt-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                        plano.ativo
                          ? 'bg-emerald-500/[0.12] text-emerald-800 dark:text-emerald-400'
                          : 'bg-red-500/[0.1] text-red-800 dark:text-red-400',
                      )}
                    >
                      <span
                        className={cn('size-1.5 shrink-0 rounded-full', plano.ativo ? 'bg-emerald-500' : 'bg-red-500')}
                        aria-hidden
                      />
                      {plano.ativo ? 'Ativo' : 'Inativo'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 rounded-lg border-border/80 bg-background px-2.5 font-normal shadow-none hover:bg-muted hover:text-foreground dark:hover:bg-muted/80"
                        onClick={() => openEdit(plano)}
                      >
                        <Pencil className="size-3.5" strokeWidth={1.75} />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="size-8 rounded-lg border-border/80 bg-background shadow-none hover:border-destructive/40 hover:bg-destructive/10 hover:[&_svg]:text-destructive dark:hover:border-destructive/50 dark:hover:bg-destructive/15"
                        onClick={() => setDeleteTarget(plano)}
                        aria-label={`Excluir ${plano.nome}`}
                      >
                        <Trash2 className="size-3.5 text-muted-foreground transition-colors" strokeWidth={1.75} />
                      </Button>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ul>
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
                {filtered.length === 1 ? 'plano' : 'planos'}
              </p>
            </Pagination>
          </div>
        ) : null}
      </PageContent>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="flex max-h-[90vh] flex-col rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlano ? 'Editar plano' : 'Novo plano'}</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="preco">Preço mensal</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                value={form.preco_mensal}
                onChange={(e) => setForm((p) => ({ ...p, preco_mensal: e.target.value }))}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <Label className="text-foreground">Benefícios</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg"
                  onClick={() =>
                    setForm((p) => ({ ...p, beneficios: [...p.beneficios, newBeneficioRow()] }))
                  }
                >
                  <Plus className="mr-1 size-3.5" />
                  Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Escreva cada benefício (ex.: até 10 barbeiros). Marque a caixa para incluí-lo no plano com check.
              </p>
              {form.beneficios.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-center text-sm text-muted-foreground">
                  Nenhum item. Use &quot;Adicionar&quot; para incluir benefícios.
                </p>
              ) : (
                <ul className="space-y-2">
                  {form.beneficios.map((row, index) => (
                    <li
                      key={row.key}
                      className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/20 p-2"
                    >
                      <div className="pt-2">
                        <Checkbox
                          checked={row.ativo}
                          onCheckedChange={(checked) =>
                            setForm((p) => ({
                              ...p,
                              beneficios: p.beneficios.map((b, i) =>
                                i === index ? { ...b, ativo: checked === true } : b,
                              ),
                            }))
                          }
                          aria-label={row.ativo ? 'Benefício ativo no plano' : 'Benefício inativo'}
                        />
                      </div>
                      <Input
                        value={row.texto}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            beneficios: p.beneficios.map((b, i) =>
                              i === index ? { ...b, texto: e.target.value } : b,
                            ),
                          }))
                        }
                        placeholder="Ex.: Até 2 unidades"
                        className="min-w-0 flex-1 rounded-lg"
                        aria-label={`Texto do benefício ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            beneficios: p.beneficios.filter((_, i) => i !== index),
                          }))
                        }
                        aria-label="Remover benefício"
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.75} />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
              <Label htmlFor="ativo" className="cursor-pointer">
                Plano ativo
              </Label>
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(checked) => setForm((p) => ({ ...p, ativo: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-lg hover:bg-muted hover:text-foreground dark:hover:bg-muted/80"
              onClick={() => handleDialogOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              className="rounded-lg"
              onClick={handleSave}
              disabled={isSaving || !form.nome || !form.preco_mensal}
            >
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Salvando...' : editingPlano ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir plano</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Tem certeza que deseja excluir “${deleteTarget.nome}”? Esta ação não pode ser desfeita.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-lg hover:bg-muted hover:text-foreground dark:hover:bg-muted/80"
              disabled={isDeleting}
            >
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="rounded-lg"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? <Spinner className="mr-2" /> : null}
              Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  )
}
