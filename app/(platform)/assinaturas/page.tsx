'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  CalendarOff,
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
import { superPageContainerClass, superPremiumAppHeaderClass } from '@/components/super/super-ui'
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
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  labelAssinaturaStatus,
  PeriodicidadeBadge,
  PlanoBadge,
  statusBadgeClass,
} from '@/components/super/super-assinatura-badges'
import { SuperAssinaturasPeriodicidadeChart } from '@/components/super/super-assinaturas-periodicidade-chart'
import { PlanoPeriodicidadeToggle } from '@/components/shared/plano-periodicidade-toggle'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  labelPeriodicidade,
  mesesPorPeriodicidade,
  parsePlanoPeriodicidade,
  type PlanoPeriodicidade,
} from '@/lib/plano-periodicidade'
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

function formatDateBR(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('T')[0].split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

function parseLocalDateKey(iso: string | null | undefined): Date | null {
  const part = iso?.split('T')[0]
  if (!part) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(part)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const day = Number(m[3])
  const d = new Date(y, mo - 1, day)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfTodayLocal(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateKeyLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function calcularFimPorPeriodicidade(
  inicioEm: string,
  periodicidade: PlanoPeriodicidade,
): string {
  const inicio = parseLocalDateKey(inicioEm)
  if (!inicio) return ''
  const meses = mesesPorPeriodicidade(periodicidade)
  const fim = new Date(inicio)
  fim.setMonth(fim.getMonth() + meses)
  fim.setDate(fim.getDate() - 1)
  return formatDateKeyLocal(fim)
}

/** Filtro “Vencidos”: inadimplente ou pendente com expiração já passada (renovação / cobrança). */
function isAssinaturaVencidosKpi(a: Assinatura): boolean {
  if (a.status === 'inadimplente') return true
  if (a.status !== 'pendente') return false
  const fim = parseLocalDateKey(a.fim_em)
  if (!fim) return false
  return fim < startOfTodayLocal()
}

type KpiFilter = 'pendente' | 'ativa' | 'vencidos' | null

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
    <div className="inline-flex max-w-full min-w-0 items-center">
      {wa ? (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={waLinkTableClass}>
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </div>
  )
}

export default function SuperAssinaturasPage() {
  const router = useRouter()
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [barbearias, setBarbearias] = useState<Barbearia[]>([])
  const [planos, setPlanos] = useState<Plano[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [bulkConfirming, setBulkConfirming] = useState(false)
  const [rejectState, setRejectState] = useState<
    { type: 'single'; assinatura: Assinatura } | { type: 'bulk'; ids: string[] } | null
  >(null)
  const [rejectSubmitting, setRejectSubmitting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [barbeariaComboOpen, setBarbeariaComboOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [page, setPage] = useState(1)
  const [form, setForm] = useState<{
    barbearia_id: string
    plano_id: string
    status: NovaAssinaturaFormStatus
    periodicidade: PlanoPeriodicidade
    inicio_em: string
    fim_em: string
  }>({
    barbearia_id: '',
    plano_id: '',
    status: 'ativa',
    periodicidade: 'mensal',
    inicio_em: new Date().toISOString().split('T')[0],
    fim_em: calcularFimPorPeriodicidade(new Date().toISOString().split('T')[0], 'mensal'),
  })
  const [editTarget, setEditTarget] = useState<Assinatura | null>(null)
  const [editForm, setEditForm] = useState<{
    plano_id: string
    status: AssinaturaStatus
    periodicidade: PlanoPeriodicidade
    inicio_em: string
    fim_em: string
  }>({
    plano_id: '',
    status: 'ativa',
    periodicidade: 'mensal',
    inicio_em: '',
    fim_em: '',
  })
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, pageSize, kpiFilter])

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

  const pendenteIdSet = useMemo(() => {
    const s = new Set<string>()
    for (const a of assinaturas) {
      if (a.status === 'pendente') s.add(a.id)
    }
    return s
  }, [assinaturas])

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>()
      for (const id of prev) {
        if (pendenteIdSet.has(id)) next.add(id)
      }
      if (next.size === prev.size) {
        for (const id of prev) {
          if (!next.has(id)) return next
        }
        return prev
      }
      return next
    })
  }, [pendenteIdSet])

  async function handleCreate() {
    if (!form.barbearia_id || !form.plano_id || !form.inicio_em || !form.fim_em.trim()) return
    setIsSaving(true)
    setError(null)

    const fim = form.fim_em.trim()
    const hoje = new Date().toLocaleDateString('en-CA')
    const statusInsert =
      form.status === 'ativa' && fim <= hoje ? 'pendente' : (form.status as AssinaturaStatus)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('assinaturas').insert({
      barbearia_id: form.barbearia_id,
      plano_id: form.plano_id,
      status: statusInsert,
      periodicidade: form.periodicidade,
      inicio_em: form.inicio_em,
      fim_em: fim,
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
      periodicidade: 'mensal',
      inicio_em: new Date().toISOString().split('T')[0],
      fim_em: calcularFimPorPeriodicidade(new Date().toISOString().split('T')[0], 'mensal'),
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
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(assinaturaId)
        return next
      })
      loadData()
    }
    setConfirmingId(null)
  }

  async function handleBulkConfirmar() {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    setBulkConfirming(true)
    setError(null)
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('assinaturas')
      .update({ status: 'ativa' })
      .in('id', ids)

    if (updateError) {
      setError('Não foi possível confirmar os pagamentos selecionados')
    } else {
      setSelectedIds(new Set())
      loadData()
    }
    setBulkConfirming(false)
  }

  async function handleRejeitarAssinatura() {
    if (!rejectState) return
    setRejectSubmitting(true)
    setError(null)
    const supabase = createClient()
    const ids =
      rejectState.type === 'single' ? [rejectState.assinatura.id] : rejectState.ids
    const { error: updateError } = await supabase
      .from('assinaturas')
      .update({ status: 'cancelada' })
      .in('id', ids)

    if (updateError) {
      setError(
        rejectState.type === 'bulk'
          ? 'Não foi possível rejeitar as assinaturas selecionadas'
          : 'Não foi possível rejeitar a assinatura',
      )
    } else {
      setRejectState(null)
      setSelectedIds((prev) => {
        if (rejectState.type === 'single') {
          const next = new Set(prev)
          next.delete(rejectState.assinatura.id)
          return next
        }
        return new Set()
      })
      loadData()
    }
    setRejectSubmitting(false)
  }

  function openEditAssinatura(assinatura: Assinatura) {
    setEditTarget(assinatura)
    setEditForm({
      plano_id: assinatura.plano_id,
      status: assinatura.status,
      periodicidade: parsePlanoPeriodicidade(assinatura.periodicidade),
      inicio_em: assinatura.inicio_em?.split('T')[0] ?? '',
      fim_em: assinatura.fim_em?.split('T')[0] ?? '',
    })
  }

  async function handleSaveEdit() {
    if (!editTarget || !editForm.plano_id || !editForm.inicio_em || !editForm.fim_em.trim()) return
    setEditSaving(true)
    setError(null)
    const fim = editForm.fim_em.trim()
    const hoje = new Date().toLocaleDateString('en-CA')
    const statusSalvar =
      editForm.status === 'ativa' && fim <= hoje ? 'pendente' : editForm.status
    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('assinaturas')
      .update({
        plano_id: editForm.plano_id,
        status: statusSalvar,
        periodicidade: editForm.periodicidade,
        inicio_em: editForm.inicio_em,
        fim_em: fim,
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
  const countVencidos = useMemo(
    () => assinaturas.filter((a) => isAssinaturaVencidosKpi(a)).length,
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
    let list = sorted
    if (kpiFilter === 'pendente') {
      list = list.filter((a) => a.status === 'pendente')
    } else if (kpiFilter === 'ativa') {
      list = list.filter((a) => a.status === 'ativa')
    } else if (kpiFilter === 'vencidos') {
      list = list.filter((a) => isAssinaturaVencidosKpi(a))
    }

    const tokens = searchQuery
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
    if (tokens.length === 0) return list
    return list.filter((a) => {
      const haystack = [a.barbearia?.nome, a.barbearia?.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return tokens.every((t) => haystack.includes(t))
    })
  }, [sorted, searchQuery, kpiFilter])

  const totalPages =
    filtered.length === 0 ? 0 : Math.ceil(filtered.length / pageSize)
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  const paginatedPendente = useMemo(
    () => paginated.filter((a) => a.status === 'pendente'),
    [paginated],
  )
  const allPagePendenteSelected =
    paginatedPendente.length > 0 && paginatedPendente.every((a) => selectedIds.has(a.id))
  const somePagePendenteSelected = paginatedPendente.some((a) => selectedIds.has(a.id))
  const selectedCount = selectedIds.size

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
      (bulkConfirming && selectedIds.has(assinatura.id)) ||
      (rejectSubmitting &&
        rejectState?.type === 'single' &&
        rejectState.assinatura.id === assinatura.id) ||
      (rejectSubmitting &&
        rejectState?.type === 'bulk' &&
        rejectState.ids.includes(assinatura.id)) ||
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
            onClick={() => setRejectState({ type: 'single', assinatura })}
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
      <p className="text-xs text-primary">
        Cadastro da barbearia: pagamento pendente
      </p>
    )
  }

  return (
    <PageContainer className={superPageContainerClass}>
      <AppPageHeader
        greetingOnly
        profileHref="/conta/editar"
        avatarFallback="S"
        className={superPremiumAppHeaderClass}
      />

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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button
                type="button"
                aria-pressed={kpiFilter === 'pendente'}
                aria-label={`Filtrar por pagamento pendente, ${countPendente} assinaturas. Ativar ou desativar o filtro.`}
                onClick={() => setKpiFilter((f) => (f === 'pendente' ? null : 'pendente'))}
                className={cn(
                  'rounded-xl border bg-card text-left shadow-sm transition outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  kpiFilter === 'pendente'
                    ? 'border-primary ring-2 ring-primary/25'
                    : 'border-border/80 hover:bg-muted/35',
                )}
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary dark:bg-primary/18">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Pagamento pendente</p>
                    <p className="text-2xl font-semibold tabular-nums text-foreground">{countPendente}</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                aria-pressed={kpiFilter === 'ativa'}
                aria-label={`Filtrar por assinaturas ativas, ${countAtivas} assinaturas. Ativar ou desativar o filtro.`}
                onClick={() => setKpiFilter((f) => (f === 'ativa' ? null : 'ativa'))}
                className={cn(
                  'rounded-xl border bg-card text-left shadow-sm transition outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  kpiFilter === 'ativa'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/25'
                    : 'border-border/80 hover:bg-muted/35',
                )}
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Assinaturas ativas</p>
                    <p className="text-2xl font-semibold tabular-nums text-foreground">{countAtivas}</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                aria-pressed={kpiFilter === 'vencidos'}
                aria-label={`Filtrar por vencidos, ${countVencidos} assinaturas (inadimplente ou pendente após expiração). Ativar ou desativar o filtro.`}
                onClick={() => setKpiFilter((f) => (f === 'vencidos' ? null : 'vencidos'))}
                className={cn(
                  'rounded-xl border bg-card text-left shadow-sm transition outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  kpiFilter === 'vencidos'
                    ? 'border-orange-500 ring-2 ring-orange-500/25'
                    : 'border-border/80 hover:bg-muted/35',
                )}
              >
                <div className="flex items-center gap-4 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300">
                    <CalendarOff className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">Vencidos</p>
                    <p className="text-2xl font-semibold tabular-nums text-foreground">{countVencidos}</p>
                    <p className="text-xs text-muted-foreground">Inadimplente ou pendente pós expiração</p>
                  </div>
                </div>
              </button>
            </div>

            <SuperAssinaturasPeriodicidadeChart assinaturas={assinaturas} />

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

            {selectedCount > 0 ? (
              <div className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedCount}</span>{' '}
                  {selectedCount === 1 ? 'assinatura selecionada' : 'assinaturas selecionadas'} (pagamento pendente)
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={bulkConfirming || rejectSubmitting}
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Limpar seleção
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                    disabled={bulkConfirming || rejectSubmitting}
                    onClick={() => void handleBulkConfirmar()}
                  >
                    {bulkConfirming ? <Spinner className="mr-2 h-4 w-4" /> : <Check className="mr-1.5 h-4 w-4" />}
                    Confirmar selecionadas
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={bulkConfirming || rejectSubmitting}
                    onClick={() => setRejectState({ type: 'bulk', ids: [...selectedIds] })}
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Rejeitar selecionadas
                  </Button>
                </div>
              </div>
            ) : null}

            {filtered.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  {searchQuery.trim()
                    ? kpiFilter
                      ? 'Nenhum resultado para a pesquisa neste filtro.'
                      : 'Nenhum resultado para a pesquisa.'
                    : kpiFilter
                      ? 'Nenhuma assinatura neste filtro.'
                      : 'Nenhum resultado para a pesquisa.'}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1140px] table-fixed border-separate border-spacing-0 text-sm">
                      <colgroup>
                        <col className="w-[2.75rem]" />
                        <col className="w-[16%]" />
                        <col className="w-[19%]" />
                        <col className="w-[10%]" />
                        <col className="w-[10%]" />
                        <col className="w-[11%]" />
                        <col className="w-[8%]" />
                        <col className="w-[8%]" />
                        <col className="w-[17%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="w-11 px-2 py-3 text-left align-middle">
                            <Checkbox
                              checked={
                                paginatedPendente.length === 0
                                  ? false
                                  : allPagePendenteSelected
                                    ? true
                                    : somePagePendenteSelected
                                      ? 'indeterminate'
                                      : false
                              }
                              onCheckedChange={(v) => {
                                const checked = v === true
                                setSelectedIds((prev) => {
                                  const next = new Set(prev)
                                  for (const a of paginatedPendente) {
                                    if (checked) next.add(a.id)
                                    else next.delete(a.id)
                                  }
                                  return next
                                })
                              }}
                              disabled={
                                paginatedPendente.length === 0 || bulkConfirming || rejectSubmitting
                              }
                              aria-label="Selecionar todas com pagamento pendente nesta página"
                            />
                          </th>
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
                            Periodicidade
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
                              <td className="w-11 px-2 py-3 align-top">
                                {assinatura.status === 'pendente' ? (
                                  <Checkbox
                                    checked={selectedIds.has(assinatura.id)}
                                    onCheckedChange={(v) => {
                                      const checked = v === true
                                      setSelectedIds((prev) => {
                                        const next = new Set(prev)
                                        if (checked) next.add(assinatura.id)
                                        else next.delete(assinatura.id)
                                        return next
                                      })
                                    }}
                                    disabled={
                                      rowActionsBusy(assinatura) || bulkConfirming || rejectSubmitting
                                    }
                                    aria-label={`Selecionar ${assinatura.barbearia?.nome ?? 'assinatura'}`}
                                  />
                                ) : (
                                  <span className="inline-block w-4" aria-hidden />
                                )}
                              </td>
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
                                <PeriodicidadeBadge periodicidade={assinatura.periodicidade} />
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
                            {assinatura.status === 'pendente' ? (
                              <Checkbox
                                className="mt-1 shrink-0"
                                checked={selectedIds.has(assinatura.id)}
                                onCheckedChange={(v) => {
                                  const checked = v === true
                                  setSelectedIds((prev) => {
                                    const next = new Set(prev)
                                    if (checked) next.add(assinatura.id)
                                    else next.delete(assinatura.id)
                                    return next
                                  })
                                }}
                                disabled={
                                  rowActionsBusy(assinatura) || bulkConfirming || rejectSubmitting
                                }
                                aria-label={`Selecionar ${assinatura.barbearia?.nome ?? 'assinatura'}`}
                              />
                            ) : null}
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
                            <div className="flex items-center justify-between gap-2">
                              <dt className="text-muted-foreground">Periodicidade</dt>
                              <dd className="flex justify-end">
                                <PeriodicidadeBadge periodicidade={assinatura.periodicidade} />
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
        open={!!rejectState}
        onOpenChange={(open) => {
          if (!open && !rejectSubmitting) setRejectState(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {rejectState?.type === 'bulk'
                ? `Rejeitar ${rejectState.ids.length} assinaturas?`
                : 'Rejeitar assinatura?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {rejectState?.type === 'bulk' ? (
                <>
                  As <span className="font-medium text-foreground">{rejectState.ids.length}</span> assinaturas
                  selecionadas serão marcadas como canceladas. O pagamento não será confirmado e o painel completo de
                  cada barbearia continuará bloqueado até existir uma assinatura ativa.
                </>
              ) : (
                <>
                  A assinatura de{' '}
                  <span className="font-medium text-foreground">
                    {rejectState?.type === 'single'
                      ? (rejectState.assinatura.barbearia?.nome ?? 'esta barbearia')
                      : 'esta barbearia'}
                  </span>{' '}
                  será marcada como cancelada. O pagamento não será confirmado e o painel completo continuará bloqueado
                  até existir uma assinatura ativa.
                </>
              )}
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
              periodicidade: 'mensal',
              inicio_em: new Date().toISOString().split('T')[0],
              fim_em: calcularFimPorPeriodicidade(new Date().toISOString().split('T')[0], 'mensal'),
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

            <div className="space-y-2">
              <Label>Periodicidade de cobrança</Label>
              <p className="text-xs text-muted-foreground">
                Registro do ciclo contratado; a validade e calculada automaticamente a partir do inicio.
              </p>
              <PlanoPeriodicidadeToggle
                idPrefix="nova-assinatura-periodicidade"
                value={form.periodicidade}
                onChange={(periodicidade) =>
                  setForm((p) => ({
                    ...p,
                    periodicidade,
                    fim_em: calcularFimPorPeriodicidade(p.inicio_em, periodicidade),
                  }))
                }
                disabled={isSaving}
                size="compact"
              />
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
                  onChange={(e) =>
                    setForm((p) => {
                      const inicio_em = e.target.value
                      return {
                        ...p,
                        inicio_em,
                        fim_em: calcularFimPorPeriodicidade(inicio_em, p.periodicidade),
                      }
                    })
                  }
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
                  readOnly
                  aria-readonly
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

            <div className="space-y-2">
              <Label>Periodicidade de cobrança</Label>
              <PlanoPeriodicidadeToggle
                idPrefix="edit-assinatura-periodicidade"
                value={editForm.periodicidade}
                onChange={(periodicidade) =>
                  setEditForm((p) => ({
                    ...p,
                    periodicidade,
                    fim_em: calcularFimPorPeriodicidade(p.inicio_em, periodicidade),
                  }))
                }
                disabled={editSaving}
                size="compact"
              />
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
                  onChange={(e) =>
                    setEditForm((p) => {
                      const inicio_em = e.target.value
                      return {
                        ...p,
                        inicio_em,
                        fim_em: calcularFimPorPeriodicidade(inicio_em, p.periodicidade),
                      }
                    })
                  }
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
                  readOnly
                  aria-readonly
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
