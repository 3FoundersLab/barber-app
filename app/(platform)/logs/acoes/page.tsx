'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Braces,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
  FileSpreadsheet,
  History,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { PageContainer, PageContent, PageTitle } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { superPageContainerClass, superPremiumAppHeaderClass } from '@/components/super/super-ui'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  fetchSistemaAcoesLogsExport,
  fetchSistemaAcoesLogsPage,
  sistemaAcoesLogsToCsv,
  type SistemaAcoesLogsFilters,
} from '@/lib/sistema-acoes-log-query'
import type { Profile, SistemaAcaoLog, SistemaAcaoTipo } from '@/types'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

const TIPO_ACAO_FILTRO: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todas as ações' },
  { value: 'criacao', label: 'Criação' },
  { value: 'edicao', label: 'Edição' },
  { value: 'exclusao', label: 'Exclusão' },
]

const ENTIDADE_FILTRO: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todas as entidades' },
  { value: 'barbearia', label: 'Barbearia' },
  { value: 'usuario', label: 'Usuário' },
  { value: 'plano', label: 'Plano' },
  { value: 'assinatura', label: 'Assinatura' },
  { value: 'outro', label: 'Outro' },
]

function entidadeLabel(key: string) {
  const row = ENTIDADE_FILTRO.find((e) => e.value === key)
  return row?.label ?? key
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

function formatDateTimeBR(iso: string) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function jsonBlock(value: Record<string, unknown> | null | undefined): string {
  if (value == null || typeof value !== 'object') return '—'
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function tipoAcaoBadgeClass(t: SistemaAcaoTipo) {
  if (t === 'criacao') {
    return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200'
  }
  if (t === 'edicao') {
    return 'bg-sky-100 text-sky-950 dark:bg-sky-950/60 dark:text-sky-100'
  }
  return 'bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-200'
}

function labelTipoAcao(t: SistemaAcaoTipo) {
  if (t === 'criacao') return 'Criação'
  if (t === 'edicao') return 'Edição'
  return 'Exclusão'
}

function TipoAcaoIcon({ tipo, className }: { tipo: SistemaAcaoTipo; className?: string }) {
  if (tipo === 'criacao') return <Plus className={cn('size-4 text-emerald-600 dark:text-emerald-400', className)} />
  if (tipo === 'edicao') return <Pencil className={cn('size-4 text-sky-600 dark:text-sky-400', className)} />
  return <Trash2 className={cn('size-4 text-red-600 dark:text-red-400', className)} />
}

export default function LogsAcoesPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Pick<Profile, 'id' | 'nome' | 'email'>[]>([])
  const [rows, setRows] = useState<SistemaAcaoLog[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [tipoAcao, setTipoAcao] = useState('todos')
  const [entidade, setEntidade] = useState('todos')
  const [actorUserId, setActorUserId] = useState<string | null>(null)
  const [usuarioComboOpen, setUsuarioComboOpen] = useState(false)
  const [minhasAcoes, setMinhasAcoes] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [detailLog, setDetailLog] = useState<SistemaAcaoLog | null>(null)
  const [jsonOpen, setJsonOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [dateFrom, dateTo, tipoAcao, entidade, actorUserId, minhasAcoes, debouncedSearch, pageSize])

  useEffect(() => {
    if (minhasAcoes) {
      setActorUserId(null)
      setUsuarioComboOpen(false)
    }
  }, [minhasAcoes])

  const filters: SistemaAcoesLogsFilters = useMemo(
    () => ({
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      tipoAcao,
      entidade,
      actorUserId: minhasAcoes ? null : actorUserId,
      onlyMyActions: minhasAcoes,
      myUserId: currentUserId,
      searchText: debouncedSearch,
    }),
    [dateFrom, dateTo, tipoAcao, entidade, actorUserId, minhasAcoes, currentUserId, debouncedSearch],
  )

  const loadSession = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    setCurrentUserId(data.user?.id ?? null)
  }, [])

  const loadProfiles = useCallback(async () => {
    const supabase = createClient()
    const { data, error: e } = await supabase
      .from('profiles')
      .select('id, nome, email')
      .order('nome', { ascending: true })
      .limit(500)
    if (!e && data) {
      setProfiles(data as Pick<Profile, 'id' | 'nome' | 'email'>[])
    }
  }, [])

  const loadLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const res = await fetchSistemaAcoesLogsPage(supabase, filters, page, pageSize)
    if (res.error) {
      setError(res.error)
      setRows([])
      setTotal(0)
    } else {
      setRows(res.rows)
      setTotal(res.total)
    }
    setIsLoading(false)
  }, [filters, page, pageSize])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  useEffect(() => {
    void loadProfiles()
  }, [loadProfiles])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize)
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages)
  const pageItems = useMemo(
    () => (totalPages > 0 ? pageNumberItems(currentPage, totalPages) : []),
    [currentPage, totalPages],
  )

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  const usuarioSelecionado = useMemo(
    () => profiles.find((p) => p.id === actorUserId),
    [profiles, actorUserId],
  )

  async function handleExport(kind: 'csv' | 'excel') {
    setExporting(true)
    setError(null)
    const supabase = createClient()
    const res = await fetchSistemaAcoesLogsExport(supabase, filters)
    if (res.error) {
      setError(res.error)
      setExporting(false)
      return
    }
    const csv = sistemaAcoesLogsToCsv(res.rows)
    const stamp = new Date().toISOString().slice(0, 10)
    const blob =
      kind === 'excel'
        ? new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8' })
        : new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = kind === 'excel' ? `logs-acoes-${stamp}.xls` : `logs-acoes-${stamp}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  function openDetail(log: SistemaAcaoLog) {
    setJsonOpen(false)
    setDetailLog(log)
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
            <PageTitle className="min-w-0 truncate">Histórico de ações</PageTitle>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              disabled={exporting || isLoading}
              onClick={() => void handleExport('csv')}
            >
              {exporting ? <Spinner className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />}
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              disabled={exporting || isLoading}
              onClick={() => void handleExport('excel')}
              title="Arquivo CSV com separador ; e BOM, abre no Excel"
            >
              {exporting ? <Spinner className="mr-2 h-4 w-4" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
              Excel
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Auditoria das alterações feitas por super administradores. Os registros ficam em{' '}
          <span className="font-mono text-xs">sistema_acoes_log</span>. Aplique o script SQL{' '}
          <span className="font-mono text-xs">031_sistema_acoes_log.sql</span> no Supabase se a tabela ainda não existir.
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

        <Card className="border-border/80 shadow-sm">
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="acoes-data-ini">Data inicial</Label>
                <Input
                  id="acoes-data-ini"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acoes-data-fim">Data final</Label>
                <Input
                  id="acoes-data-fim"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de ação</Label>
                <Select value={tipoAcao} onValueChange={setTipoAcao}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_ACAO_FILTRO.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entidade</Label>
                <Select value={entidade} onValueChange={setEntidade}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTIDADE_FILTRO.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <Label>Usuário (autor)</Label>
                <Popover open={usuarioComboOpen} onOpenChange={setUsuarioComboOpen} modal>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={usuarioComboOpen}
                      disabled={minhasAcoes}
                      className="h-10 w-full justify-between font-normal"
                    >
                      <span className="truncate text-left">
                        {minhasAcoes ? (
                          <span className="text-muted-foreground">Use o filtro &quot;Minhas ações&quot;</span>
                        ) : usuarioSelecionado ? (
                          <span className="font-medium">{usuarioSelecionado.nome}</span>
                        ) : (
                          <span className="text-muted-foreground">Todos os usuários</span>
                        )}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar por nome ou e-mail..." />
                      <CommandList>
                        <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="__all__"
                            onSelect={() => {
                              setActorUserId(null)
                              setUsuarioComboOpen(false)
                            }}
                          >
                            Todos os usuários
                          </CommandItem>
                          {profiles.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.id}
                              keywords={[p.nome, p.email].filter((x): x is string => Boolean(x))}
                              onSelect={() => {
                                setActorUserId(p.id)
                                setUsuarioComboOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4 shrink-0',
                                  actorUserId === p.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="truncate font-medium">{p.nome}</span>
                                {p.email ? (
                                  <span className="truncate text-xs text-muted-foreground">{p.email}</span>
                                ) : null}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2">
                <Checkbox
                  id="minhas-acoes"
                  checked={minhasAcoes}
                  onCheckedChange={(c) => setMinhasAcoes(c === true)}
                  disabled={!currentUserId}
                />
                <Label htmlFor="minhas-acoes" className="cursor-pointer text-sm font-normal leading-snug">
                  Minhas ações
                </Label>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Nome do usuário, nome da entidade, resumo ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Buscar no histórico"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="sr-only" htmlFor="acoes-page-size">
                  Itens por página
                </Label>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger id="acoes-page-size" className="w-full sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} por página
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="h-8 w-8 text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center text-sm text-muted-foreground">
              <History className="h-10 w-10 opacity-40" />
              <p>Nenhuma ação encontrada com os filtros atuais.</p>
              <p className="max-w-md text-xs">
                Quando super administradores criarem, editarem ou excluírem registros instrumentados (ex.: planos), as
                entradas aparecerão aqui, da mais recente para a mais antiga.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm xl:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] table-fixed border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="w-[12%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Data/Hora
                      </th>
                      <th className="w-[10%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Ação
                      </th>
                      <th className="w-[14%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Usuário
                      </th>
                      <th className="w-[12%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Entidade
                      </th>
                      <th className="w-[18%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Alvo
                      </th>
                      <th className="w-[34%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Descrição
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((log) => (
                      <tr
                        key={log.id}
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/30 last:border-0"
                        onClick={() => openDetail(log)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openDetail(log)
                          }
                        }}
                      >
                        <td className="px-3 py-3 align-top text-muted-foreground tabular-nums">
                          {formatDateTimeBR(log.created_at)}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <TipoAcaoIcon tipo={log.tipo_acao} />
                            <Badge
                              variant="outline"
                              className={cn('border-0 font-medium', tipoAcaoBadgeClass(log.tipo_acao))}
                            >
                              {labelTipoAcao(log.tipo_acao)}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className="line-clamp-2 text-muted-foreground">
                            {log.actor_profile?.nome ?? '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top font-medium text-foreground">
                          {entidadeLabel(log.entidade)}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className="line-clamp-2 break-all font-mono text-xs text-foreground">
                            {log.entidade_nome ?? log.entidade_id ?? '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <span
                                className="line-clamp-2 block cursor-help text-muted-foreground"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                <span className="font-medium text-foreground">{log.resumo_acao}</span>
                                {log.descricao ? (
                                  <span className="mt-0.5 block text-xs">{log.descricao}</span>
                                ) : null}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="max-h-80 max-w-md overflow-y-auto whitespace-pre-wrap text-left text-xs leading-snug"
                            >
                              {[log.resumo_acao, log.descricao].filter(Boolean).join('\n\n')}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 xl:hidden">
              {rows.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  className="w-full rounded-xl border border-border/80 bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/25"
                  onClick={() => openDetail(log)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatDateTimeBR(log.created_at)}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <TipoAcaoIcon tipo={log.tipo_acao} />
                      <Badge
                        variant="outline"
                        className={cn('shrink-0 border-0', tipoAcaoBadgeClass(log.tipo_acao))}
                      >
                        {labelTipoAcao(log.tipo_acao)}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2 font-semibold text-foreground">{log.resumo_acao}</p>
                  {log.descricao ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{log.descricao}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Usuário:</span>{' '}
                    {log.actor_profile?.nome ?? '—'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{entidadeLabel(log.entidade)}:</span>{' '}
                    <span className="break-all font-mono">{log.entidade_nome ?? log.entidade_id ?? '—'}</span>
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {!isLoading && total > 0 && totalPages > 0 ? (
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
                Página {currentPage} de {totalPages} · {total} {total === 1 ? 'registro' : 'registros'}
              </p>
            </Pagination>
          </div>
        ) : null}
      </PageContent>

      <Sheet open={!!detailLog} onOpenChange={(open) => !open && setDetailLog(null)}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
          <SheetHeader className="text-left">
            <SheetTitle>Detalhe da ação</SheetTitle>
            <SheetDescription>Identificador {detailLog?.id ?? ''}</SheetDescription>
          </SheetHeader>
          {detailLog ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-6">
              <div className="flex flex-wrap items-center gap-2">
                <TipoAcaoIcon tipo={detailLog.tipo_acao} />
                <Badge variant="outline" className={cn('border-0', tipoAcaoBadgeClass(detailLog.tipo_acao))}>
                  {labelTipoAcao(detailLog.tipo_acao)}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {entidadeLabel(detailLog.entidade)}
                </Badge>
              </div>

              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data/Hora</dt>
                  <dd className="mt-0.5 text-foreground">{formatDateTimeBR(detailLog.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Usuário</dt>
                  <dd className="mt-0.5 text-foreground">
                    {detailLog.actor_profile?.nome ?? '—'}
                    {detailLog.actor_profile?.email ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {detailLog.actor_profile.email}
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resumo</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{detailLog.resumo_acao}</dd>
                </div>
                {detailLog.descricao ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descrição</dt>
                    <dd className="mt-0.5 text-foreground">{detailLog.descricao}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    ID da entidade
                  </dt>
                  <dd className="mt-0.5 break-all font-mono text-xs text-foreground">
                    {detailLog.entidade_id ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Nome / rótulo da entidade
                  </dt>
                  <dd className="mt-0.5 text-foreground">{detailLog.entidade_nome ?? '—'}</dd>
                </div>
              </dl>

              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Antes e depois (diff)
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Antes</p>
                    <pre className="max-h-56 overflow-auto rounded-lg border border-border/80 bg-muted/40 p-3 text-[11px] leading-relaxed">
                      {jsonBlock(detailLog.payload_antes)}
                    </pre>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Depois</p>
                    <pre className="max-h-56 overflow-auto rounded-lg border border-border/80 bg-muted/40 p-3 text-[11px] leading-relaxed">
                      {jsonBlock(detailLog.payload_depois)}
                    </pre>
                  </div>
                </div>
              </div>

              <Collapsible open={jsonOpen} onOpenChange={setJsonOpen}>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="gap-2">
                    <Braces className="size-4" />
                    {jsonOpen ? 'Ocultar JSON completo' : 'Ver registro completo (JSON)'}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <pre className="max-h-72 overflow-auto rounded-lg border border-border/80 bg-muted/40 p-3 text-[11px] leading-relaxed">
                    {JSON.stringify(detailLog, null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </PageContainer>
  )
}
