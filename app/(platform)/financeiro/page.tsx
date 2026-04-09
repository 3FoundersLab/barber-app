'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, CreditCard, DollarSign, TrendingUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageContainer, PageContent } from '@/components/shared/page-container'
import { AppPageHeader } from '@/components/shared/app-page-header'
import { superPageContainerClass, superPremiumAppHeaderClass } from '@/components/super/super-ui'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import {
  labelAssinaturaStatus,
  PeriodicidadeBadge,
  PlanoBadge,
  statusBadgeClass,
} from '@/components/super/super-assinatura-badges'
import { formatCurrency } from '@/lib/constants'
import { fetchSuperMrrAtual } from '@/lib/mrr'
import { createClient } from '@/lib/supabase/client'
import { parsePlanoPeriodicidade, precoTotalNoPeriodo } from '@/lib/plano-periodicidade'
import { PLATFORM_PATHS } from '@/lib/routes'
import { cn } from '@/lib/utils'
import type { AssinaturaStatus, Plano } from '@/types'

const HISTORICO_PAGE_SIZE = 20

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

type RelOne<T> = T | T[] | null | undefined

function pickRel<T>(x: RelOne<T>): T | undefined {
  if (x == null) return undefined
  return Array.isArray(x) ? x[0] : x
}

function formatDateBR(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('T')[0].split('-')
  if (!y || !m || !d) return iso
  return `${d}/${m}/${y}`
}

type HistoricoPeriodoFiltro =
  | 'todos'
  | 'mes_atual'
  | 'mes_anterior'
  | 'ultimos_90_dias'
  | 'ultimos_180_dias'
  | 'ano_corrente'
  | 'mes_especifico'

function defaultMesYYYYMM(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Intervalo em `updated_at` (timestamptz) para filtro do histórico. */
function intervaloUpdatedAtParaFiltro(
  filtro: HistoricoPeriodoFiltro,
  mesYYYYMM: string,
): { de: string | null; ate: string | null } {
  const now = new Date()

  if (filtro === 'todos') {
    return { de: null, ate: null }
  }

  if (filtro === 'mes_especifico') {
    const [y, m] = mesYYYYMM.split('-').map(Number)
    if (!y || !m || m < 1 || m > 12) {
      return { de: null, ate: null }
    }
    const inicio = new Date(y, m - 1, 1, 0, 0, 0, 0)
    const fim = new Date(y, m, 0, 23, 59, 59, 999)
    return { de: inicio.toISOString(), ate: fim.toISOString() }
  }

  if (filtro === 'mes_atual') {
    const inicio = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return { de: inicio.toISOString(), ate: fim.toISOString() }
  }

  if (filtro === 'mes_anterior') {
    const ref = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const inicio = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0)
    const fim = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999)
    return { de: inicio.toISOString(), ate: fim.toISOString() }
  }

  if (filtro === 'ultimos_90_dias' || filtro === 'ultimos_180_dias') {
    const dias = filtro === 'ultimos_90_dias' ? 90 : 180
    const fim = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    const inicio = new Date(fim)
    inicio.setDate(inicio.getDate() - (dias - 1))
    inicio.setHours(0, 0, 0, 0)
    return { de: inicio.toISOString(), ate: fim.toISOString() }
  }

  const inicio = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
  const fim = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
  return { de: inicio.toISOString(), ate: fim.toISOString() }
}

type HistoricoAssinatura = {
  id: string
  status: AssinaturaStatus
  inicio_em: string
  fim_em?: string | null
  periodicidade?: string | null
  updated_at: string
  barbearia: RelOne<{ nome: string; slug: string }>
  plano: RelOne<{ nome: string; preco_mensal: number }>
}

type HistoricoLinhaView = {
  row: HistoricoAssinatura
  barbeariaNome: string
  plano: Pick<Plano, 'nome'> | null | undefined
  valorCiclo: number
}

interface Kpis {
  mrr: number
  ativas: number
  pendentes: number
  inadimplentes: number
}

function toHistoricoLinhaView(row: HistoricoAssinatura): HistoricoLinhaView {
  const barbearia = pickRel(row.barbearia)
  const plano = pickRel(row.plano)
  const per = parsePlanoPeriodicidade(row.periodicidade)
  const precoMensal = Number(plano?.preco_mensal) || 0
  const valorCiclo = precoTotalNoPeriodo(precoMensal, per)
  return {
    row,
    barbeariaNome: barbearia?.nome ?? 'Barbearia',
    plano,
    valorCiclo,
  }
}

export default function SuperFinanceiroPage() {
  const [kpis, setKpis] = useState<Kpis>({
    mrr: 0,
    ativas: 0,
    pendentes: 0,
    inadimplentes: 0,
  })
  const [historico, setHistorico] = useState<HistoricoAssinatura[]>([])
  const [kpisLoading, setKpisLoading] = useState(true)
  const [historicoLoading, setHistoricoLoading] = useState(true)
  const [kpiError, setKpiError] = useState<string | null>(null)
  const [historicoError, setHistoricoError] = useState<string | null>(null)
  const [periodoFiltro, setPeriodoFiltro] = useState<HistoricoPeriodoFiltro>('todos')
  const [mesEspecifico, setMesEspecifico] = useState(defaultMesYYYYMM)
  const [historicoPage, setHistoricoPage] = useState(1)
  const [historicoTotalCount, setHistoricoTotalCount] = useState(0)

  const errorAlert = [kpiError, historicoError].filter(Boolean).join(' ') || null

  const historicoTotalPages = Math.max(1, Math.ceil(historicoTotalCount / HISTORICO_PAGE_SIZE))
  const historicoPageItems = useMemo(
    () => pageNumberItems(historicoPage, historicoTotalPages),
    [historicoPage, historicoTotalPages],
  )

  useEffect(() => {
    let cancelled = false

    async function loadKpis() {
      const supabase = createClient()
      setKpisLoading(true)
      setKpiError(null)

      const [mrrResult, ativasCountRes, pendentesRes, inadimplentesRes] = await Promise.all([
        fetchSuperMrrAtual(supabase),
        supabase.from('assinaturas').select('id', { count: 'exact', head: true }).eq('status', 'ativa'),
        supabase.from('assinaturas').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('assinaturas').select('id', { count: 'exact', head: true }).eq('status', 'inadimplente'),
      ])

      if (cancelled) return

      setKpiError(mrrResult.error ?? null)
      setKpis({
        mrr: mrrResult.mrr,
        ativas: ativasCountRes.count ?? 0,
        pendentes: pendentesRes.count ?? 0,
        inadimplentes: inadimplentesRes.count ?? 0,
      })
      setKpisLoading(false)
    }

    void loadKpis()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadHistorico() {
      const supabase = createClient()
      setHistoricoLoading(true)
      setHistoricoError(null)

      const { de, ate } = intervaloUpdatedAtParaFiltro(periodoFiltro, mesEspecifico)
      const rangeFrom = (historicoPage - 1) * HISTORICO_PAGE_SIZE
      const rangeTo = rangeFrom + HISTORICO_PAGE_SIZE - 1

      let query = supabase
        .from('assinaturas')
        .select(
          `
            id,
            status,
            inicio_em,
            fim_em,
            periodicidade,
            updated_at,
            barbearia:barbearias(nome, slug),
            plano:planos(nome, preco_mensal)
          `,
          { count: 'exact' },
        )
        .order('updated_at', { ascending: false })

      if (de) {
        query = query.gte('updated_at', de)
      }
      if (ate) {
        query = query.lte('updated_at', ate)
      }

      const historicoRes = await query.range(rangeFrom, rangeTo)

      if (cancelled) return

      if (historicoRes.error) {
        setHistorico([])
        setHistoricoTotalCount(0)
        setHistoricoError('Não foi possível carregar o histórico de assinaturas')
      } else {
        setHistorico((historicoRes.data as HistoricoAssinatura[]) ?? [])
        setHistoricoTotalCount(historicoRes.count ?? 0)
        const totalPages = Math.max(1, Math.ceil((historicoRes.count ?? 0) / HISTORICO_PAGE_SIZE))
        if (historicoPage > totalPages) {
          setHistoricoPage(totalPages)
        }
      }

      setHistoricoLoading(false)
    }

    void loadHistorico()
    return () => {
      cancelled = true
    }
  }, [periodoFiltro, mesEspecifico, historicoPage])

  const groupedHistorico = useMemo(() => {
    const map = new Map<string, { label: string; items: HistoricoAssinatura[] }>()
    for (const row of historico) {
      const key = row.updated_at.slice(0, 7)
      if (!map.has(key)) {
        const [y, mo] = key.split('-').map(Number)
        const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
          new Date(y, mo - 1, 1),
        )
        map.set(key, { label: label.charAt(0).toUpperCase() + label.slice(1), items: [] })
      }
      map.get(key)!.items.push(row)
    }
    const keys = [...map.keys()].sort((a, b) => b.localeCompare(a))
    return keys.map((k) => {
      const { label, items } = map.get(k)!
      return {
        key: k,
        label,
        linhas: items.map(toHistoricoLinhaView),
      }
    })
  }, [historico])

  return (
    <PageContainer className={superPageContainerClass}>
      <AppPageHeader
        title="Financeiro"
        subtitle="Indicadores de assinaturas e últimas atualizações"
        profileHref={PLATFORM_PATHS.contaEditar}
        avatarFallback="S"
        className={superPremiumAppHeaderClass}
      />

      <PageContent className="space-y-4">
        {errorAlert ? (
          <Alert
            variant="danger"
            onClose={() => {
              setKpiError(null)
              setHistoricoError(null)
            }}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{errorAlert}</AlertTitle>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Para criar ou alterar cobranças, use a tela de assinaturas.
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link href={PLATFORM_PATHS.assinaturas}>
              Assinaturas
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">MRR (ativas)</span>
              </div>
              {kpisLoading ? (
                <Skeleton className="mt-1 h-8 w-24" />
              ) : (
                <p className="text-xl font-bold">{formatCurrency(kpis.mrr)}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">Soma do preço mensal dos planos ativos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span className="text-xs">Assinaturas ativas</span>
              </div>
              {kpisLoading ? (
                <Skeleton className="mt-1 h-8 w-10" />
              ) : (
                <p className="text-xl font-bold">{kpis.ativas}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Pagamento pendente</span>
              </div>
              {kpisLoading ? (
                <Skeleton className="mt-1 h-8 w-10" />
              ) : (
                <p className="text-xl font-bold">{kpis.pendentes}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Inadimplentes</span>
              </div>
              {kpisLoading ? (
                <Skeleton className="mt-1 h-8 w-10" />
              ) : (
                <p className="text-xl font-bold">{kpis.inadimplentes}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <h2 className="text-sm font-semibold text-foreground">Histórico recente</h2>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
              <div className="min-w-0 space-y-2 sm:min-w-[220px]">
                <Label htmlFor="financeiro-periodo" className="text-xs text-muted-foreground">
                  Período (por data de atualização)
                </Label>
                <Select
                  value={periodoFiltro}
                  onValueChange={(v) => {
                    setPeriodoFiltro(v as HistoricoPeriodoFiltro)
                    setHistoricoPage(1)
                  }}
                >
                  <SelectTrigger id="financeiro-periodo" className="w-full sm:w-[260px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="mes_atual">Mês atual</SelectItem>
                    <SelectItem value="mes_anterior">Mês anterior</SelectItem>
                    <SelectItem value="ultimos_90_dias">Últimos 90 dias</SelectItem>
                    <SelectItem value="ultimos_180_dias">Últimos 180 dias</SelectItem>
                    <SelectItem value="ano_corrente">Ano corrente</SelectItem>
                    <SelectItem value="mes_especifico">Mês específico…</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Lista paginada: {HISTORICO_PAGE_SIZE} registros por página (ordenados por atualização).
                </p>
              </div>
              {periodoFiltro === 'mes_especifico' ? (
                <div className="space-y-2">
                  <Label htmlFor="financeiro-mes" className="text-xs text-muted-foreground">
                    Mês
                  </Label>
                  <Input
                    id="financeiro-mes"
                    type="month"
                    className="w-full sm:w-[180px]"
                    value={mesEspecifico}
                    onChange={(e) => {
                      setMesEspecifico(e.target.value)
                      setHistoricoPage(1)
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>

          {historicoLoading ? (
            <>
              <div className="space-y-3 lg:hidden">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
              <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm lg:block">
                <div className="overflow-x-auto p-4">
                  <Skeleton className="mb-3 h-10 w-full" />
                  {['a', 'b', 'c', 'd'].map((k) => (
                    <Skeleton key={k} className="mb-2 h-12 w-full min-w-[960px]" />
                  ))}
                </div>
              </div>
            </>
          ) : !historicoLoading && historicoTotalCount === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Nenhum registro neste período (com base na data de atualização da assinatura).
              </CardContent>
            </Card>
          ) : (
            <>
              {!historicoLoading && historicoTotalCount > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Mostrando{' '}
                  <span className="font-medium text-foreground">
                    {(historicoPage - 1) * HISTORICO_PAGE_SIZE + 1}–
                    {(historicoPage - 1) * HISTORICO_PAGE_SIZE + historico.length}
                  </span>{' '}
                  de <span className="font-medium text-foreground">{historicoTotalCount}</span>
                </p>
              ) : null}

              {groupedHistorico.map(({ key, label, linhas }) => (
              <section key={key} className="space-y-3">
                <h3 className="border-b pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                  <span className="ml-2 font-normal normal-case text-muted-foreground">
                    · {linhas.length} {linhas.length === 1 ? 'registro' : 'registros'} nesta página
                  </span>
                </h3>

                <div className="space-y-3 lg:hidden">
                  {linhas.map(({ row, barbeariaNome, plano, valorCiclo }) => (
                    <Card key={row.id} className="overflow-hidden border-border/80 shadow-sm">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground">{barbeariaNome}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn('shrink-0 border-0', statusBadgeClass(row.status))}
                          >
                            {labelAssinaturaStatus(row.status)}
                          </Badge>
                        </div>
                        <dl className="grid gap-2 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <dt className="text-muted-foreground">Plano</dt>
                            <dd className="flex justify-end">
                              <PlanoBadge plano={plano ?? undefined} />
                            </dd>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <dt className="text-muted-foreground">Periodicidade</dt>
                            <dd className="flex justify-end">
                              <PeriodicidadeBadge periodicidade={row.periodicidade} />
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">Valor do ciclo</dt>
                            <dd className="tabular-nums text-foreground">{formatCurrency(valorCiclo)}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">Início</dt>
                            <dd className="tabular-nums text-foreground">{formatDateBR(row.inicio_em)}</dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">Expiração</dt>
                            <dd className="tabular-nums text-foreground">
                              {row.fim_em ? formatDateBR(row.fim_em) : '—'}
                            </dd>
                          </div>
                          <div className="flex justify-between gap-2">
                            <dt className="text-muted-foreground">Atualizado</dt>
                            <dd className="tabular-nums text-foreground">{formatDateBR(row.updated_at)}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="hidden overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm lg:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[960px] table-fixed border-separate border-spacing-0 text-sm">
                      <colgroup>
                        <col className="w-[20%]" />
                        <col className="w-[13%]" />
                        <col className="w-[13%]" />
                        <col className="w-[13%]" />
                        <col className="w-[12%]" />
                        <col className="w-[9%]" />
                        <col className="w-[10%]" />
                        <col className="w-[10%]" />
                      </colgroup>
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Barbearia
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
                            Valor ciclo
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Início
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Expiração
                          </th>
                          <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Atualizado
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {linhas.map(({ row, barbeariaNome, plano, valorCiclo }) => (
                            <tr key={row.id} className="border-b border-border/60 last:border-0">
                              <td className="px-3 py-3 align-top">
                                <div className="min-w-0 space-y-1">
                                  <p className="font-semibold text-foreground">{barbeariaNome}</p>
                                </div>
                              </td>
                              <td className="px-3 py-3 align-top">
                                <PlanoBadge plano={plano ?? undefined} />
                              </td>
                              <td className="px-3 py-3 align-top">
                                <PeriodicidadeBadge periodicidade={row.periodicidade} />
                              </td>
                              <td className="px-3 py-3 align-top">
                                <Badge
                                  variant="outline"
                                  className={cn('border-0', statusBadgeClass(row.status))}
                                >
                                  {labelAssinaturaStatus(row.status)}
                                </Badge>
                              </td>
                              <td className="px-3 py-3 align-top tabular-nums text-foreground">
                                {formatCurrency(valorCiclo)}
                              </td>
                              <td className="px-3 py-3 align-top text-muted-foreground tabular-nums">
                                {formatDateBR(row.inicio_em)}
                              </td>
                              <td className="px-3 py-3 align-top text-muted-foreground tabular-nums">
                                {formatDateBR(row.fim_em ?? '')}
                              </td>
                              <td className="px-3 py-3 align-top text-muted-foreground tabular-nums">
                                {formatDateBR(row.updated_at)}
                              </td>
                            </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
              ))}

              {!historicoLoading && historicoTotalPages > 1 ? (
                <div className="border-t border-border/60 pt-4">
                  <Pagination className="mx-0 flex w-full max-w-full flex-col items-center gap-2">
                    <PaginationContent className="flex h-9 flex-row flex-wrap items-center justify-center gap-1">
                      <PaginationItem>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 gap-1 px-2.5"
                          disabled={historicoPage <= 1}
                          onClick={() => setHistoricoPage((p) => Math.max(1, p - 1))}
                          aria-label="Página anterior"
                        >
                          <ChevronLeft className="h-4 w-4 shrink-0" />
                          <span className="hidden sm:inline">Anterior</span>
                        </Button>
                      </PaginationItem>
                      {historicoPageItems.map((item, idx) =>
                        item === 'ellipsis' ? (
                          <PaginationItem key={`e-${idx}`} className="flex h-9 items-center">
                            <PaginationEllipsis className="size-9" />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={item} className="flex h-9 items-center">
                            <Button
                              type="button"
                              variant={item === historicoPage ? 'default' : 'ghost'}
                              size="icon"
                              className={cn(
                                'h-9 min-w-9',
                                item === historicoPage && 'pointer-events-none font-semibold',
                              )}
                              onClick={() => setHistoricoPage(item)}
                              aria-label={`Página ${item}`}
                              aria-current={item === historicoPage ? 'page' : undefined}
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
                          disabled={historicoPage >= historicoTotalPages}
                          onClick={() =>
                            setHistoricoPage((p) => Math.min(historicoTotalPages, p + 1))
                          }
                          aria-label="Próxima página"
                        >
                          <span className="hidden sm:inline">Próxima</span>
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                    <p className="text-center text-xs text-muted-foreground">
                      Página {historicoPage} de {historicoTotalPages} · {historicoTotalCount}{' '}
                      {historicoTotalCount === 1 ? 'assinatura' : 'assinaturas'} no filtro
                    </p>
                  </Pagination>
                </div>
              ) : null}
            </>
          )}
        </div>
      </PageContent>
    </PageContainer>
  )
}
