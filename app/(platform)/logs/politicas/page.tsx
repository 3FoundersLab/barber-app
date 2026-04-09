'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Download,
  FileSpreadsheet,
  Search,
  ScrollText,
} from 'lucide-react'
import { PageContainer, PageContent, PageTitle } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { superPageContainerClass, superPremiumAppHeaderClass } from '@/components/super/super-ui'
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
  fetchPoliticaSistemaLogsExport,
  fetchPoliticaSistemaLogsPage,
  logsToCsv,
  type PoliticaLogsFilters,
} from '@/lib/politica-sistema-logs-query'
import type { Barbearia, PoliticaSistemaLog, PoliticaSistemaLogStatus } from '@/types'

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const

const TIPO_FILTRO_OPCOES: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'cobrança', label: 'Cobrança' },
  { value: 'expiração', label: 'Expiração' },
  { value: 'renovação', label: 'Renovação' },
  { value: 'ativação_plano', label: 'Ativação de plano' },
  { value: 'alteração_assinatura', label: 'Alteração de assinatura' },
  { value: 'cadastro_barbearia', label: 'Cadastro de barbearia' },
  { value: 'sistema', label: 'Sistema / job' },
]

const STATUS_FILTRO_OPCOES: { value: string; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'sucesso', label: 'Sucesso' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'erro', label: 'Erro' },
]

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

function labelStatus(s: PoliticaSistemaLogStatus) {
  if (s === 'sucesso') return 'Sucesso'
  if (s === 'pendente') return 'Pendente'
  return 'Erro'
}

function statusBadgeClass(s: PoliticaSistemaLogStatus) {
  if (s === 'sucesso') {
    return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200'
  }
  if (s === 'pendente') {
    return 'bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-100'
  }
  return 'bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-200'
}

function tooltipBody(log: PoliticaSistemaLog): string {
  const parts: string[] = [
    `ID: ${log.id}`,
    `Quando: ${log.created_at}`,
    `Tipo: ${log.tipo_evento}`,
    `Status: ${log.status_execucao}`,
    `Barbearia: ${log.barbearia?.nome ?? '—'} (${log.barbearia_id ?? 'n/d'})`,
    `Descrição: ${log.descricao}`,
    `Usuário: ${log.actor_profile?.nome ?? '—'} <${log.actor_profile?.email ?? '—'}>`,
  ]
  if (log.mensagem_erro) parts.push(`Erro: ${log.mensagem_erro}`)
  if (log.detalhes && Object.keys(log.detalhes).length > 0) {
    parts.push(`Detalhes:\n${JSON.stringify(log.detalhes, null, 2)}`)
  }
  return parts.join('\n\n')
}

export default function LogsPoliticasPage() {
  const router = useRouter()
  const [barbearias, setBarbearias] = useState<Barbearia[]>([])
  const [rows, setRows] = useState<PoliticaSistemaLog[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [tipoEvento, setTipoEvento] = useState('todos')
  const [status, setStatus] = useState('todos')
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [barbeariaComboOpen, setBarbeariaComboOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [detailLog, setDetailLog] = useState<PoliticaSistemaLog | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [dateFrom, dateTo, tipoEvento, status, barbeariaId, debouncedSearch, pageSize])

  const filters: PoliticaLogsFilters = useMemo(
    () => ({
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      tipoEvento,
      status,
      barbeariaId,
      searchText: debouncedSearch,
    }),
    [dateFrom, dateTo, tipoEvento, status, barbeariaId, debouncedSearch],
  )

  const loadBarbearias = useCallback(async () => {
    const supabase = createClient()
    const { data, error: e } = await supabase.from('barbearias').select('*').order('nome')
    if (!e && data) setBarbearias(data as Barbearia[])
  }, [])

  const loadLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const res = await fetchPoliticaSistemaLogsPage(supabase, filters, page, pageSize)
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
    void loadBarbearias()
  }, [loadBarbearias])

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

  const barbeariaSelecionada = useMemo(
    () => barbearias.find((b) => b.id === barbeariaId),
    [barbearias, barbeariaId],
  )

  async function handleExport(kind: 'csv' | 'excel') {
    setExporting(true)
    setError(null)
    const supabase = createClient()
    const res = await fetchPoliticaSistemaLogsExport(supabase, filters)
    if (res.error) {
      setError(res.error)
      setExporting(false)
      return
    }
    const csv = logsToCsv(res.rows)
    const stamp = new Date().toISOString().slice(0, 10)
    const blob =
      kind === 'excel'
        ? new Blob([csv], { type: 'application/vnd.ms-excel;charset=utf-8' })
        : new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = kind === 'excel' ? `logs-politicas-${stamp}.xls` : `logs-politicas-${stamp}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
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
            <PageTitle className="min-w-0 truncate">Logs de políticas</PageTitle>
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
          Auditoria de alterações e execuções automáticas (cobrança, expiração, planos). Os registros são gravados na
          tabela <span className="font-mono text-xs">politica_sistema_logs</span>.
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
                <Label htmlFor="log-data-ini">Data inicial</Label>
                <Input
                  id="log-data-ini"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="log-data-fim">Data final</Label>
                <Input
                  id="log-data-fim"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de evento</Label>
                <Select value={tipoEvento} onValueChange={setTipoEvento}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPO_FILTRO_OPCOES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTRO_OPCOES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Barbearia</Label>
              <Popover open={barbeariaComboOpen} onOpenChange={setBarbeariaComboOpen} modal>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={barbeariaComboOpen}
                    className="h-10 w-full justify-between font-normal"
                  >
                    <span className="truncate text-left">
                      {barbeariaSelecionada ? (
                        <span className="font-medium">{barbeariaSelecionada.nome}</span>
                      ) : (
                        <span className="text-muted-foreground">Todas as barbearias</span>
                      )}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar barbearia..." />
                    <CommandList>
                      <CommandEmpty>Nenhuma barbearia encontrada.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__all__"
                          onSelect={() => {
                            setBarbeariaId(null)
                            setBarbeariaComboOpen(false)
                          }}
                        >
                          Todas as barbearias
                        </CommandItem>
                        {barbearias.map((b) => (
                          <CommandItem
                            key={b.id}
                            value={b.id}
                            keywords={[b.nome, b.email].filter((x): x is string => Boolean(x))}
                            onSelect={() => {
                              setBarbeariaId(b.id)
                              setBarbeariaComboOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4 shrink-0',
                                barbeariaId === b.id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="truncate font-medium">{b.nome}</span>
                              {b.email ? (
                                <span className="truncate text-xs text-muted-foreground">{b.email}</span>
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar na descrição, tipo, erro ou nome da barbearia..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Buscar nos logs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="sr-only" htmlFor="logs-page-size">
                  Itens por página
                </Label>
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger id="logs-page-size" className="w-full sm:w-[140px]">
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
              <ScrollText className="h-10 w-10 opacity-40" />
              <p>Nenhum log encontrado com os filtros atuais.</p>
              <p className="max-w-md text-xs">
                Quando jobs ou ações do super admin registrarem eventos em{' '}
                <span className="font-mono">politica_sistema_logs</span>, eles aparecerão aqui ordenados do mais recente
                para o mais antigo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] table-fixed border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="w-[14%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Data/Hora
                      </th>
                      <th className="w-[12%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Tipo
                      </th>
                      <th className="w-[16%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Barbearia
                      </th>
                      <th className="w-[30%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Descrição
                      </th>
                      <th className="w-[10%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Status
                      </th>
                      <th className="w-[18%] px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Usuário
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
                        onClick={() => setDetailLog(log)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setDetailLog(log)
                          }
                        }}
                      >
                        <td className="px-3 py-3 align-top text-muted-foreground tabular-nums">
                          {formatDateTimeBR(log.created_at)}
                        </td>
                        <td className="px-3 py-3 align-top font-medium text-foreground">{log.tipo_evento}</td>
                        <td className="px-3 py-3 align-top">
                          <span className="line-clamp-2 text-foreground">
                            {log.barbearia?.nome ?? '—'}
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
                                {log.descricao}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              className="max-h-80 max-w-md overflow-y-auto whitespace-pre-wrap text-left font-mono text-[11px] leading-snug"
                            >
                              {tooltipBody(log)}
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Badge
                            variant="outline"
                            className={cn('border-0', statusBadgeClass(log.status_execucao))}
                          >
                            {labelStatus(log.status_execucao)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <span className="line-clamp-2 text-muted-foreground">
                            {log.actor_profile?.nome ?? '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 lg:hidden">
              {rows.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  className="w-full rounded-xl border border-border/80 bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/25"
                  onClick={() => setDetailLog(log)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatDateTimeBR(log.created_at)}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn('shrink-0 border-0', statusBadgeClass(log.status_execucao))}
                    >
                      {labelStatus(log.status_execucao)}
                    </Badge>
                  </div>
                  <p className="mt-2 font-semibold text-foreground">{log.tipo_evento}</p>
                  <p className="mt-1 line-clamp-3 text-left text-sm text-muted-foreground">{log.descricao}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Barbearia:</span>{' '}
                    {log.barbearia?.nome ?? '—'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Usuário:</span>{' '}
                    {log.actor_profile?.nome ?? '—'}
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
                Página {currentPage} de {totalPages} · {total}{' '}
                {total === 1 ? 'registro' : 'registros'}
              </p>
            </Pagination>
          </div>
        ) : null}
      </PageContent>

      <Sheet open={!!detailLog} onOpenChange={(open) => !open && setDetailLog(null)}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
          <SheetHeader className="text-left">
            <SheetTitle>Detalhe do log</SheetTitle>
            <SheetDescription>Identificador {detailLog?.id ?? ''}</SheetDescription>
          </SheetHeader>
          {detailLog ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-6">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Data/Hora</dt>
                  <dd className="mt-0.5 text-foreground">{formatDateTimeBR(detailLog.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo</dt>
                  <dd className="mt-0.5 font-medium text-foreground">{detailLog.tipo_evento}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Barbearia</dt>
                  <dd className="mt-0.5 text-foreground">{detailLog.barbearia?.nome ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descrição</dt>
                  <dd className="mt-0.5 text-foreground">{detailLog.descricao}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</dt>
                  <dd className="mt-0.5">
                    <Badge
                      variant="outline"
                      className={cn('border-0', statusBadgeClass(detailLog.status_execucao))}
                    >
                      {labelStatus(detailLog.status_execucao)}
                    </Badge>
                  </dd>
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
                {detailLog.mensagem_erro ? (
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Mensagem de erro
                    </dt>
                    <dd className="mt-0.5 text-destructive">{detailLog.mensagem_erro}</dd>
                  </div>
                ) : null}
              </dl>
              {detailLog.detalhes && Object.keys(detailLog.detalhes).length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Detalhes (JSON)</p>
                  <pre className="max-h-64 overflow-auto rounded-lg border border-border/80 bg-muted/40 p-3 text-xs">
                    {JSON.stringify(detailLog.detalhes, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </PageContainer>
  )
}
