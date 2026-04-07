'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  X,
} from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import { Spinner } from '@/components/ui/spinner'
import { SuperAssinaturasPageSkeleton } from '@/components/shared/loading-skeleton'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Assinatura, AssinaturaStatus, Barbearia, Plano } from '@/types'

const NOVA_ASSINATURA_STATUS_OPTIONS = ['pendente', 'ativa', 'inadimplente', 'cancelada'] as const
type NovaAssinaturaFormStatus = (typeof NOVA_ASSINATURA_STATUS_OPTIONS)[number]

/** Todos os status editáveis pelo super admin. */
const EDIT_ASSINATURA_STATUS_OPTIONS: AssinaturaStatus[] = [
  'pendente',
  'ativa',
  'inadimplente',
  'cancelada',
]

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

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

function labelAssinaturaStatus(status: string) {
  const map: Record<string, string> = {
    pendente: 'Pagamento pendente',
    ativa: 'Ativa',
    inadimplente: 'Inadimplente',
    cancelada: 'Cancelada',
  }
  return map[status] ?? status
}

function formatDateBR(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('T')[0].split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function whatsappHref(telefone?: string | null) {
  const digits = telefone?.replace(/\D/g, '') ?? ''
  if (digits.length < 10) return null
  return `https://wa.me/${digits}`
}

const waLinkTableClass =
  'inline-flex shrink-0 items-center gap-1 rounded-md border border-emerald-600/30 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60'

function ContatoBarbeariaBlock({
  email,
  telefone,
  layout,
}: {
  email?: string | null
  telefone?: string | null
  layout: 'table' | 'card'
}) {
  const wa = whatsappHref(telefone)
  if (layout === 'card') {
    return (
      <div className="inline-flex max-w-full min-w-0 items-center gap-1.5">
        <p
          className="min-w-0 max-w-[min(100%,240px)] truncate text-xs text-muted-foreground sm:max-w-[min(100%,320px)]"
          title={email ?? undefined}
        >
          {email ?? '—'}
        </p>
        {wa ? (
          <Button variant="outline" size="sm" className="h-8 shrink-0 px-3" asChild>
            <a href={wa} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              WhatsApp
            </a>
          </Button>
        ) : null}
      </div>
    )
  }
  return (
    <div className="inline-flex max-w-full min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-1.5">
      <p
        className="min-w-0 max-w-[min(100%,14rem)] truncate text-xs text-muted-foreground sm:max-w-[min(100%,20rem)]"
        title={email ?? undefined}
      >
        {email ?? '—'}
      </p>
      {wa ? (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={waLinkTableClass}>
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>
      ) : null}
    </div>
  )
}

const PLANO_BADGE_PALETTE = [
  'rounded-full border-transparent bg-orange-100 text-orange-950 dark:bg-orange-950/50 dark:text-orange-100',
  'rounded-full border-transparent bg-violet-100 text-violet-950 dark:bg-violet-950/50 dark:text-violet-100',
  'rounded-full border-transparent bg-rose-100 text-rose-950 dark:bg-rose-950/50 dark:text-rose-100',
  'rounded-full border-transparent bg-cyan-100 text-cyan-950 dark:bg-cyan-950/50 dark:text-cyan-100',
  'rounded-full border-transparent bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100',
] as const

function planoBadgeClass(planoId: string | undefined) {
  if (!planoId) return 'rounded-full border-transparent bg-muted text-muted-foreground'
  let h = 0
  for (let i = 0; i < planoId.length; i++) h = (h + planoId.charCodeAt(i) * (i + 1)) % 997
  return PLANO_BADGE_PALETTE[h % PLANO_BADGE_PALETTE.length]
}

function PlanoBadge({ plano }: { plano?: Plano | null }) {
  if (!plano?.nome) {
    return <span className="text-muted-foreground">—</span>
  }
  return (
    <Badge variant="outline" className={cn('border-0 font-medium', planoBadgeClass(plano.id))}>
      {plano.nome}
    </Badge>
  )
}

function statusBadgeClass(status: AssinaturaStatus) {
  switch (status) {
    case 'pendente':
      return 'rounded-full border-transparent bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100'
    case 'ativa':
      return 'rounded-full border-transparent bg-emerald-100 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100'
    case 'inadimplente':
      return 'rounded-full border-transparent bg-red-100 text-red-950 dark:bg-red-950/50 dark:text-red-100'
    case 'cancelada':
    default:
      return 'rounded-full border-transparent bg-muted text-muted-foreground'
  }
}

export default function SuperAssinaturasPage() {
  const router = useRouter()
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [barbearias, setBarbearias] = useState<Barbearia[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Assinatura | null>(null)
  const [rejectSubmitting, setRejectSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [barbeariaComboOpen, setBarbeariaComboOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<{
    barbearia_id: string
    plano_id: string
    status: NovaAssinaturaFormStatus
    inicio_em: string
    fim_em: string
  }>({
    barbearia_id: '',
    plano_id: '',
    status: 'ativa',
    inicio_em: new Date().toISOString().split('T')[0],
    fim_em: '',
  })
  const [editTarget, setEditTarget] = useState<Assinatura | null>(null)
  const [editForm, setEditForm] = useState<{
    plano_id: string
    status: AssinaturaStatus
    inicio_em: string
    fim_em: string
  }>({
    plano_id: '',
    status: 'ativa',
    inicio_em: '',
    fim_em: '',
  })
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, pageSize])

  async function loadData() {
    const supabase = createClient()
    setError(null)

    const [assinaturasRes, barbeariasRes, planosRes] = await Promise.all([
      supabase
        .from('assinaturas')
        .select(`
          *,
          barbearia:barbearias(*),
          plano:planos(*)
        `)
        .order('created_at', { ascending: false }),
      supabase.from('barbearias').select('*').order('nome'),
      supabase.from('planos').select('*').eq('ativo', true).order('nome'),
    ])

    if (assinaturasRes.error || barbeariasRes.error || planosRes.error) {
      setError('Não foi possível carregar os dados de assinaturas')
      setIsLoading(false)
      return
    }

    const list = (assinaturasRes.data || []) as Assinatura[]
    list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
    setAssinaturas(list)
    setBarbearias(barbeariasRes.data || [])
    setPlanos(planosRes.data || [])
    setIsLoading(false)
  }

  async function handleCreate() {
    if (!form.barbearia_id || !form.plano_id || !form.inicio_em || !form.fim_em.trim()) return
    setIsSaving(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('assinaturas').insert({
      barbearia_id: form.barbearia_id,
      plano_id: form.plano_id,
      status: form.status as AssinaturaStatus,
      inicio_em: form.inicio_em,
      fim_em: form.fim_em.trim(),
    })

    if (insertError) {
      setError('Não foi possível criar a assinatura')
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    setIsDialogOpen(false)
    setForm({
      barbearia_id: '',
      plano_id: '',
      status: 'ativa',
      inicio_em: new Date().toISOString().split('T')[0],
      fim_em: '',
    })
    loadData()
  }

  async function handleConfirmarPagamento(assinaturaId: string) {
    setConfirmingId(assinaturaId)
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('assinaturas')
      .update({ status: 'ativa' })
      .eq('id', assinaturaId)

    if (updateError) {
      setError('Não foi possível confirmar o pagamento')
    } else {
      loadData()
    }
    setConfirmingId(null)
  }

  async function handleRejeitarAssinatura() {
    if (!rejectTarget) return
    setRejectSubmitting(true)
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('assinaturas')
      .update({ status: 'cancelada' })
      .eq('id', rejectTarget.id)

    if (updateError) {
      setError('Não foi possível rejeitar a assinatura')
    } else {
      setRejectTarget(null)
      loadData()
    }
    setRejectSubmitting(false)
  }

  function openEditAssinatura(assinatura: Assinatura) {
    setEditTarget(assinatura)
    setEditForm({
      plano_id: assinatura.plano_id,
      status: assinatura.status,
      inicio_em: assinatura.inicio_em?.split('T')[0] ?? '',
      fim_em: assinatura.fim_em?.split('T')[0] ?? '',
    })
  }

  async function handleSaveEdit() {
    if (!editTarget || !editForm.plano_id || !editForm.inicio_em || !editForm.fim_em.trim()) return
    setEditSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('assinaturas')
      .update({
        plano_id: editForm.plano_id,
        status: editForm.status,
        inicio_em: editForm.inicio_em,
        fim_em: editForm.fim_em.trim(),
      })
      .eq('id', editTarget.id)

    if (updateError) {
      setError('Não foi possível salvar a assinatura')
    } else {
      setEditTarget(null)
      loadData()
    }
    setEditSaving(false)
  }

  const countPendente = useMemo(
    () => assinaturas.filter((a) => a.status === 'pendente').length,
    [assinaturas],
  )
  const countAtivas = useMemo(
    () => assinaturas.filter((a) => a.status === 'ativa').length,
    [assinaturas],
  )

  const barbeariaSelecionada = useMemo(
    () => barbearias.find((b) => b.id === form.barbearia_id),
    [barbearias, form.barbearia_id],
  )

  const planosForEdit = useMemo(() => {
    const ids = new Set(planos.map((p) => p.id))
    const list = [...planos]
    if (editTarget?.plano_id && !ids.has(editTarget.plano_id) && editTarget.plano) {
      list.push(editTarget.plano)
    }
    return list.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [planos, editTarget])

  const sorted = useMemo(() => {
    return [...assinaturas].sort((a, b) => {
      const pa = a.status === 'pendente' ? 0 : 1
      const pb = b.status === 'pendente' ? 0 : 1
      if (pa !== pb) return pa - pb
      return (b.created_at || '').localeCompare(a.created_at || '')
    })
  }, [assinaturas])

  const filtered = useMemo(() => {
    const tokens = searchQuery
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
    if (tokens.length === 0) return sorted
    return sorted.filter((a) => {
      const haystack = [a.barbearia?.nome, a.barbearia?.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return tokens.every((t) => haystack.includes(t))
    })
  }, [sorted, searchQuery])

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
    if (totalPages > 0 && page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  function rowActionsBusy(assinatura: Assinatura) {
    return (
      confirmingId === assinatura.id ||
      (rejectSubmitting && rejectTarget?.id === assinatura.id) ||
      (editSaving && editTarget?.id === assinatura.id)
    )
  }

  function renderRowActions(assinatura: Assinatura, layout: 'table' | 'card' = 'table') {
    const busy = rowActionsBusy(assinatura)
    const wrap =
      layout === 'table'
        ? 'flex shrink-0 flex-wrap items-center justify-end gap-2'
        : 'flex w-full flex-wrap gap-2'

    if (assinatura.status === 'pendente') {
      return (
        <div className={wrap}>
          <Button
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            disabled={busy}
            onClick={() => handleConfirmarPagamento(assinatura.id)}
          >
            {confirmingId === assinatura.id ? <Spinner className="mr-2 h-4 w-4" /> : <Check className="mr-1.5 h-4 w-4" />}
            Confirmar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={busy}
            onClick={() => setRejectTarget(assinatura)}
          >
            <X className="mr-1.5 h-4 w-4" />
            Rejeitar
          </Button>
        </div>
      )
    }

    return (
      <div className={wrap}>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => openEditAssinatura(assinatura)}
        >
          {editSaving && editTarget?.id === assinatura.id ? (
            <Spinner className="mr-1.5 h-4 w-4" />
          ) : (
            <Pencil className="mr-1.5 h-4 w-4" />
          )}
          Editar
        </Button>
      </div>
    )
  }

  function renderCadastroHint(assinatura: Assinatura) {
    if (assinatura.barbearia?.status_cadastro !== 'pagamento_pendente') return null
    return (
      <p className="text-xs text-amber-700 dark:text-amber-500">
        Cadastro da barbearia: pagamento pendente
      </p>
    )
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
            <PageTitle className="min-w-0 truncate">Assinaturas</PageTitle>
          </div>
          <Button
            type="button"
            className="w-full shrink-0 sm:w-auto"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova assinatura
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Barbearias cadastradas em <span className="font-medium text-foreground">/cadastro/barbearia</span> aparecem
          com assinatura em <span className="font-medium text-foreground">pagamento pendente</span>. Confirme o
          pagamento na lista para liberar o painel completo da barbearia.
        </p>

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
          <SuperAssinaturasPageSkeleton count={5} />
        ) : assinaturas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Card className="border-border/80 shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Pagamento pendente</p>
                    <p className="text-2xl font-semibold tabular-nums text-foreground">{countPendente}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/80 shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Assinaturas ativas</p>
                    <p className="text-2xl font-semibold tabular-nums text-foreground">{countAtivas}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Pesquisar por nome ou e-mail da barbearia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Pesquisar assinaturas por barbearia ou e-mail"
                />
              </div>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v))}
              >
                <SelectTrigger className="w-full sm:w-[140px]" aria-label="Itens">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} itens
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum resultado para a pesquisa
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] table-fixed border-separate border-spacing-0 text-sm">
                      <colgroup>
                        <col className="w-[18%]" />
                        <col className="w-[22%]" />
                        <col className="w-[11%]" />
                        <col className="w-[12%]" />
                        <col className="w-[9%]" />
                        <col className="w-[9%]" />
                        <col className="w-[19%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Barbearia
                          </th>
                          <th className="min-w-0 px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Contato
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Plano
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Status
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Início
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Expiração
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated.map((assinatura) => {
                          return (
                            <tr key={assinatura.id} className="border-b border-border/60 last:border-0">
                              <td className="px-3 py-3 align-top">
                                <div className="min-w-0 space-y-1">
                                  <p className="font-semibold text-foreground">
                                    {assinatura.barbearia?.nome || 'Barbearia'}
                                  </p>
                                  {renderCadastroHint(assinatura)}
                                </div>
                              </td>
                              <td className="min-w-0 px-3 py-3 align-top">
                                <ContatoBarbeariaBlock
                                  layout="table"
                                  email={assinatura.barbearia?.email}
                                  telefone={assinatura.barbearia?.telefone}
                                />
                              </td>
                              <td className="px-3 py-3 align-top">
                                <PlanoBadge plano={assinatura.plano} />
                              </td>
                              <td className="px-3 py-3 align-top">
                                <Badge
                                  variant="outline"
                                  className={cn('border-0', statusBadgeClass(assinatura.status))}
                                >
                                  {labelAssinaturaStatus(assinatura.status)}
                                </Badge>
                              </td>
                              <td className="px-3 py-3 align-top text-muted-foreground tabular-nums">
                                {formatDateBR(assinatura.inicio_em)}
                              </td>
                              <td className="px-3 py-3 align-top text-muted-foreground tabular-nums">
                                {formatDateBR(assinatura.fim_em ?? '')}
                              </td>
                              <td className="px-3 py-3 text-right align-top">
                                {renderRowActions(assinatura, 'table')}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3 lg:hidden">
                  {paginated.map((assinatura) => {
                    return (
                      <Card key={assinatura.id} className="overflow-hidden border-border/80 shadow-sm">
                        <CardContent className="space-y-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground">
                                {assinatura.barbearia?.nome || 'Barbearia'}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn('shrink-0 border-0', statusBadgeClass(assinatura.status))}
                            >
                              {labelAssinaturaStatus(assinatura.status)}
                            </Badge>
                          </div>
                          <ContatoBarbeariaBlock
                            layout="card"
                            email={assinatura.barbearia?.email}
                            telefone={assinatura.barbearia?.telefone}
                          />
                          <dl className="grid gap-2 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <dt className="text-muted-foreground">Plano</dt>
                              <dd className="flex justify-end">
                                <PlanoBadge plano={assinatura.plano} />
                              </dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-muted-foreground">Início</dt>
                              <dd className="tabular-nums text-foreground">
                                {formatDateBR(assinatura.inicio_em)}
                              </dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-muted-foreground">Expiração</dt>
                              <dd className="tabular-nums text-foreground">
                                {formatDateBR(assinatura.fim_em ?? '')}
                              </dd>
                            </div>
                          </dl>
                          {renderCadastroHint(assinatura)}
                          <div className="pt-1">{renderRowActions(assinatura, 'card')}</div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {filtered.length > 0 && totalPages > 0 ? (
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
                        {filtered.length === 1 ? 'assinatura' : 'assinaturas'}
                      </p>
                    </Pagination>
                  </div>
                ) : null}
              </>
            )}
          </>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma assinatura cadastrada
            </CardContent>
          </Card>
        )}
      </PageContent>

      <AlertDialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open && !rejectSubmitting) setRejectTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              A assinatura de{' '}
              <span className="font-medium text-foreground">
                {rejectTarget?.barbearia?.nome ?? 'esta barbearia'}
              </span>{' '}
              será marcada como cancelada. O pagamento não será confirmado e o painel completo continuará bloqueado até
              existir uma assinatura ativa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectSubmitting}>Voltar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={rejectSubmitting}
              onClick={() => void handleRejeitarAssinatura()}
            >
              {rejectSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Rejeitar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (open) {
            setForm({
              barbearia_id: '',
              plano_id: '',
              status: 'ativa',
              inicio_em: new Date().toISOString().split('T')[0],
              fim_em: '',
            })
            setBarbeariaComboOpen(false)
          }
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton>
          <div className="border-b border-border/80 bg-muted/30 px-6 py-4">
            <DialogHeader className="gap-2 space-y-0 text-left">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border/60">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <DialogTitle className="text-base sm:text-lg">Nova assinatura</DialogTitle>
              </div>
              <DialogDescription>
                Vincule uma barbearia a um plano e informe o período da assinatura. O status define se o painel já fica
                liberado ou se permanece aguardando pagamento.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="nova-assinatura-barbearia">
                Barbearia <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Pesquise pelo nome da unidade ou pelo e-mail cadastrado da barbearia.
              </p>
              <Popover open={barbeariaComboOpen} onOpenChange={setBarbeariaComboOpen} modal>
                <PopoverTrigger asChild>
                  <Button
                    id="nova-assinatura-barbearia"
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={barbeariaComboOpen}
                    className="h-10 w-full justify-between font-normal"
                  >
                    <span className="truncate text-left">
                      {barbeariaSelecionada ? (
                        <span className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                          <span className="font-medium">{barbeariaSelecionada.nome}</span>
                          {barbeariaSelecionada.email ? (
                            <span className="truncate text-xs font-normal text-muted-foreground">
                              {barbeariaSelecionada.email}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Selecione a barbearia...</span>
                      )}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Nome ou e-mail da barbearia..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma barbearia encontrada.</CommandEmpty>
                      <CommandGroup>
                        {barbearias.map((b) => (
                          <CommandItem
                            key={b.id}
                            value={b.id}
                            keywords={[b.nome, b.email].filter((x): x is string => Boolean(x))}
                            onSelect={() => {
                              setForm((prev) => ({ ...prev, barbearia_id: b.id }))
                              setBarbeariaComboOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'h-4 w-4 shrink-0',
                                form.barbearia_id === b.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="truncate font-medium">{b.nome}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {b.email || 'Sem e-mail cadastrado'}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="nova-assinatura-plano">
                Plano <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">Somente planos ativos no catálogo.</p>
              <Select
                value={form.plano_id}
                onValueChange={(v) => setForm((p) => ({ ...p, plano_id: v }))}
              >
                <SelectTrigger id="nova-assinatura-plano" className="h-10 w-full">
                  <SelectValue placeholder="Selecione o plano..." />
                </SelectTrigger>
                <SelectContent>
                  {planos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nova-assinatura-status">
                Status inicial <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Use <span className="font-medium text-foreground">Pagamento pendente</span> para espelhar o fluxo do
                cadastro público; use <span className="font-medium text-foreground">Ativa</span> se o pagamento já foi
                confirmado fora do sistema.
              </p>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, status: v as NovaAssinaturaFormStatus }))
                }
              >
                <SelectTrigger id="nova-assinatura-status" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOVA_ASSINATURA_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {labelAssinaturaStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nova-assinatura-inicio">
                  Início <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nova-assinatura-inicio"
                  type="date"
                  required
                  value={form.inicio_em}
                  onChange={(e) => setForm((p) => ({ ...p, inicio_em: e.target.value }))}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nova-assinatura-fim">
                  Expiração <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nova-assinatura-fim"
                  type="date"
                  required
                  value={form.fim_em}
                  onChange={(e) => setForm((p) => ({ ...p, fim_em: e.target.value }))}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/80 bg-muted/20 px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={
                isSaving ||
                !form.barbearia_id ||
                !form.plano_id ||
                !form.inicio_em ||
                !form.fim_em.trim()
              }
            >
              {isSaving ? <Spinner className="mr-2" /> : null}
              {isSaving ? 'Salvando...' : 'Criar assinatura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open && !editSaving) setEditTarget(null)
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton>
          <div className="border-b border-border/80 bg-muted/30 px-6 py-4">
            <DialogHeader className="gap-2 space-y-0 text-left">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background shadow-sm ring-1 ring-border/60">
                  <Pencil className="h-4 w-4 text-muted-foreground" />
                </div>
                <DialogTitle className="text-base sm:text-lg">Editar assinatura</DialogTitle>
              </div>
              <DialogDescription>
                Altere plano, status e datas. A barbearia vinculada não pode ser alterada por aqui.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div className="space-y-1 rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Barbearia</p>
              <p className="text-sm font-semibold text-foreground">
                {editTarget?.barbearia?.nome ?? '—'}
              </p>
              {editTarget?.barbearia?.email ? (
                <p className="truncate text-xs text-muted-foreground">{editTarget.barbearia.email}</p>
              ) : null}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="edit-assinatura-plano">
                Plano <span className="text-destructive">*</span>
              </Label>
              <Select
                value={editForm.plano_id}
                onValueChange={(v) => setEditForm((p) => ({ ...p, plano_id: v }))}
              >
                <SelectTrigger id="edit-assinatura-plano" className="h-10 w-full">
                  <SelectValue placeholder="Selecione o plano..." />
                </SelectTrigger>
                <SelectContent>
                  {planosForEdit.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-assinatura-status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={editForm.status}
                onValueChange={(v) =>
                  setEditForm((p) => ({ ...p, status: v as AssinaturaStatus }))
                }
              >
                <SelectTrigger id="edit-assinatura-status" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDIT_ASSINATURA_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {labelAssinaturaStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-assinatura-inicio">
                  Início <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-assinatura-inicio"
                  type="date"
                  required
                  value={editForm.inicio_em}
                  onChange={(e) => setEditForm((p) => ({ ...p, inicio_em: e.target.value }))}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-assinatura-fim">
                  Expiração <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-assinatura-fim"
                  type="date"
                  required
                  value={editForm.fim_em}
                  onChange={(e) => setEditForm((p) => ({ ...p, fim_em: e.target.value }))}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-border/80 bg-muted/20 px-6 py-4 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)} disabled={editSaving}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleSaveEdit()}
              disabled={editSaving || !editForm.plano_id || !editForm.inicio_em || !editForm.fim_em.trim()}
            >
              {editSaving ? <Spinner className="mr-2" /> : null}
              {editSaving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
