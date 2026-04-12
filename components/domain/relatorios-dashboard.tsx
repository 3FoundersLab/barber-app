'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  ChevronLeft,
  Download,
  Minus,
  RefreshCw,
  TrendingUp,
  Users,
  UserCircle,
  Package,
  Scissors,
  Activity,
  BarChart3,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import {
  intervaloAnteriorComparacao,
  intervaloPorPreset,
  toLocalDateKey,
  type RelatorioPeriodoPreset,
} from '@/lib/relatorios-range'
import { estoqueCardStatus } from '@/lib/estoque-produto-utils'
import { formatCurrency } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Agendamento, AppointmentStatus } from '@/types'
import type { EstoqueProduto } from '@/types/estoque-produto'

function pctChange(atual: number, anterior: number): { pct: number; up: boolean | null } {
  if (anterior === 0) return atual > 0 ? { pct: 100, up: true } : { pct: 0, up: null }
  const pct = ((atual - anterior) / anterior) * 100
  return { pct, up: pct > 0 ? true : pct < 0 ? false : null }
}

function TrendDelta({ atual, anterior }: { atual: number; anterior: number }) {
  const { pct, up } = pctChange(atual, anterior)
  if (up === null && Math.abs(pct) < 0.05) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" aria-hidden />
        estável
      </span>
    )
  }
  const Icon = up ? ArrowUpRight : ArrowDownRight
  const cls = up ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', cls)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {up ? '+' : ''}
      {pct.toFixed(1)}% vs período anterior
    </span>
  )
}

function agendamentosNoIntervalo(rows: Agendamento[], startKey: string, endKey: string) {
  return rows.filter((a) => a.data >= startKey && a.data <= endKey)
}

function horaDoAgendamento(horario: string): number {
  const [h] = horario.split(':').map(Number)
  return Number.isFinite(h) ? h : 0
}

function resumoOperacional(list: Agendamento[]) {
  const total = list.length
  const concluidos = list.filter((a) => a.status === 'concluido').length
  const cancelados = list.filter((a) => a.status === 'cancelado').length
  const faltas = list.filter((a) => a.status === 'faltou').length
  const agendadosOuEm = list.filter((a) => a.status === 'agendado' || a.status === 'em_atendimento').length
  const fatConcluido = list
    .filter((a) => a.status === 'concluido')
    .reduce((s, a) => s + (Number(a.valor) || 0), 0)
  const ticketMedio = concluidos > 0 ? fatConcluido / concluidos : 0
  const realizacao = total > 0 ? (concluidos / total) * 100 : 0
  return { total, concluidos, cancelados, faltas, agendadosOuEm, fatConcluido, ticketMedio, realizacao }
}

function porBarbeiro(list: Agendamento[]) {
  const m = new Map<string, { nome: string; q: number; concl: number; fat: number }>()
  for (const a of list) {
    const id = a.barbeiro_id
    const nome = a.barbeiro?.nome ?? '—'
    const cur = m.get(id) ?? { nome, q: 0, concl: 0, fat: 0 }
    cur.q += 1
    if (a.status === 'concluido') {
      cur.concl += 1
      cur.fat += Number(a.valor) || 0
    }
    m.set(id, cur)
  }
  return [...m.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.fat - a.fat)
}

function porCliente(list: Agendamento[]) {
  const m = new Map<string, { nome: string; visitas: number; fat: number }>()
  for (const a of list) {
    const id = a.cliente_id
    const nome = a.cliente?.nome ?? '—'
    const cur = m.get(id) ?? { nome, visitas: 0, fat: 0 }
    cur.visitas += 1
    if (a.status === 'concluido') cur.fat += Number(a.valor) || 0
    m.set(id, cur)
  }
  return [...m.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.visitas - a.visitas)
    .slice(0, 20)
}

function porServico(list: Agendamento[]) {
  const m = new Map<string, { nome: string; q: number; fat: number }>()
  for (const a of list) {
    const id = a.servico_id
    const nome = a.servico?.nome ?? 'Serviço'
    const cur = m.get(id) ?? { nome, q: 0, fat: 0 }
    cur.q += 1
    if (a.status === 'concluido') cur.fat += Number(a.valor) || 0
    m.set(id, cur)
  }
  return [...m.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.q - a.q)
}

function picosPorHora(list: Agendamento[]) {
  const h = new Array(24).fill(0)
  for (const a of list) {
    h[horaDoAgendamento(a.horario)] += 1
  }
  const max = Math.max(1, ...h)
  return h.map((v, i) => ({ hora: i, v, pct: (v / max) * 100 }))
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  agendado: 'Agendado',
  em_atendimento: 'Em atendimento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  faltou: 'Falta',
}

interface RelatoriosDashboardProps {
  slug: string
  base: string
}

export function RelatoriosDashboard({ slug, base }: RelatoriosDashboardProps) {
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [preset, setPreset] = useState<RelatorioPeriodoPreset>('7d')
  const [tab, setTab] = useState('visao')
  /** Primeira carga (ou troca de unidade) concluída — evita sumir o grid quando o período vem vazio. */
  const [dadosProntos, setDadosProntos] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [agAtual, setAgAtual] = useState<Agendamento[]>([])
  const [agAnterior, setAgAnterior] = useState<Agendamento[]>([])
  const [estoque, setEstoque] = useState<EstoqueProduto[]>([])
  const [totalClientes, setTotalClientes] = useState(0)
  const [clientesNovos, setClientesNovos] = useState(0)

  const { inicio, fim } = useMemo(
    () => intervaloPorPreset(preset, null, null),
    [preset],
  )
  const startKey = toLocalDateKey(inicio)
  const endKey = toLocalDateKey(fim)
  const { inicio: iniAnt, fim: fimAnt } = useMemo(
    () => intervaloAnteriorComparacao(inicio, fim),
    [inicio, fim],
  )
  const startKeyAnt = toLocalDateKey(iniAnt)
  const endKeyAnt = toLocalDateKey(fimAnt)

  const periodoLabel = useMemo(
    () =>
      `${format(inicio, "dd/MM/yyyy", { locale: ptBR })} – ${format(fim, "dd/MM/yyyy", { locale: ptBR })}`,
    [inicio, fim],
  )

  const load = useCallback(async () => {
    if (!barbeariaId) return
    setError(null)
    setRefreshing(true)
    try {
    const supabase = createClient()
    const { inicio: i0, fim: f0 } = intervaloPorPreset(preset, null, null)
    const sk = toLocalDateKey(i0)
    const ek = toLocalDateKey(f0)
    const { inicio: ia, fim: fa } = intervaloAnteriorComparacao(i0, f0)
    const ska = toLocalDateKey(ia)
    const eka = toLocalDateKey(fa)

    const sel = `
      *,
      cliente:clientes(*),
      barbeiro:barbeiros(*),
      servico:servicos(*)
    `

    const [
      rAtual,
      rAnt,
      rCli,
      rNovos,
      rEst,
    ] = await Promise.all([
      supabase
        .from('agendamentos')
        .select(sel)
        .eq('barbearia_id', barbeariaId)
        .gte('data', sk)
        .lte('data', ek)
        .order('data', { ascending: true })
        .order('horario', { ascending: true }),
      supabase
        .from('agendamentos')
        .select(sel)
        .eq('barbearia_id', barbeariaId)
        .gte('data', ska)
        .lte('data', eka),
      supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('barbearia_id', barbeariaId),
      supabase
        .from('clientes')
        .select('id', { count: 'exact', head: true })
        .eq('barbearia_id', barbeariaId)
        .gte('created_at', i0.toISOString())
        .lte('created_at', f0.toISOString()),
      supabase.from('estoque_produtos').select('*').eq('barbearia_id', barbeariaId).order('nome'),
    ])

    if (rAtual.error) {
      setError('Não foi possível carregar agendamentos do período.')
      setAgAtual([])
    } else {
      setAgAtual((rAtual.data ?? []) as Agendamento[])
    }
    if (rAnt.error) setAgAnterior([])
    else setAgAnterior((rAnt.data ?? []) as Agendamento[])

    setTotalClientes(rCli.count ?? 0)
    setClientesNovos(rNovos.count ?? 0)
    if (rEst.error) setEstoque([])
    else setEstoque((rEst.data ?? []) as EstoqueProduto[])
    } finally {
      setRefreshing(false)
      setDadosProntos(true)
    }
  }, [barbeariaId, preset])

  useEffect(() => {
    let cancelled = false
    async function init() {
      setDadosProntos(false)
      setBarbeariaId(null)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        setError('Usuário não autenticado')
        setDadosProntos(true)
        return
      }
      const id = await resolveAdminBarbeariaId(supabase, user.id, { slug })
      if (cancelled) return
      if (!id) {
        setError('Barbearia não encontrada')
        setDadosProntos(true)
        return
      }
      setBarbeariaId(id)
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [slug])

  useEffect(() => {
    if (!barbeariaId) return
    void load()
  }, [barbeariaId, load])

  const atualFiltrado = useMemo(
    () => agendamentosNoIntervalo(agAtual, startKey, endKey),
    [agAtual, startKey, endKey],
  )
  const anteriorFiltrado = useMemo(
    () => agendamentosNoIntervalo(agAnterior, startKeyAnt, endKeyAnt),
    [agAnterior, startKeyAnt, endKeyAnt],
  )

  const resAtual = useMemo(() => resumoOperacional(atualFiltrado), [atualFiltrado])
  const resAnt = useMemo(() => resumoOperacional(anteriorFiltrado), [anteriorFiltrado])

  const barbeirosRank = useMemo(() => porBarbeiro(atualFiltrado), [atualFiltrado])
  const clientesRank = useMemo(() => porCliente(atualFiltrado), [atualFiltrado])
  const servicosRank = useMemo(() => porServico(atualFiltrado), [atualFiltrado])
  const picos = useMemo(() => picosPorHora(atualFiltrado), [atualFiltrado])

  const estoqueAlerta = useMemo(() => {
    let baixo = 0
    let esgotado = 0
    for (const p of estoque) {
      const s = estoqueCardStatus(p.quantidade, p.minimo)
      if (s === 'esgotado') esgotado += 1
      else if (s === 'baixo') baixo += 1
    }
    return { baixo, esgotado, total: estoque.length }
  }, [estoque])

  const statusDistribuicao = useMemo(() => {
    const keys: AppointmentStatus[] = [
      'concluido',
      'agendado',
      'em_atendimento',
      'cancelado',
      'faltou',
    ]
    const m = new Map<AppointmentStatus, number>()
    for (const k of keys) m.set(k, 0)
    for (const a of atualFiltrado) {
      m.set(a.status, (m.get(a.status) ?? 0) + 1)
    }
    const total = atualFiltrado.length || 1
    return keys.map((k) => ({
      k,
      n: m.get(k) ?? 0,
      pct: ((m.get(k) ?? 0) / total) * 100,
    }))
  }, [atualFiltrado])

  const handlePrint = () => {
    window.print()
  }

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader
        title="Relatórios"
        subtitle="Visão holística da operação — diferente do Financeiro (fluxo e cobranças)."
        profileHref={`${base}/configuracoes`}
        avatarFallback="A"
        headingActions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 print:hidden"
            onClick={handlePrint}
          >
            <Download className="h-4 w-4" aria-hidden />
            Exportar PDF
          </Button>
        }
      />

      <PageContent className="space-y-5">
        {error ? (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 print:hidden sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Button variant="ghost" size="sm" className="w-fit gap-1 px-2 text-muted-foreground" asChild>
            <Link href={`${base}/dashboard`}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Voltar
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/20 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:p-4 print:border-0 print:bg-transparent">
          <div className="flex min-w-0 flex-col gap-1.5 sm:flex-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Período</span>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={preset}
                onValueChange={(v) => setPreset(v as RelatorioPeriodoPreset)}
                disabled={!barbeariaId}
              >
                <SelectTrigger className="h-9 w-full min-w-[10rem] sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="mes">Este mês</SelectItem>
                  <SelectItem value="mes_anterior">Mês anterior</SelectItem>
                </SelectContent>
              </Select>
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarRange className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                <span className="font-medium text-foreground">{periodoLabel}</span>
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 gap-1.5"
            disabled={!barbeariaId || refreshing}
            onClick={() => void load()}
          >
            {refreshing ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" aria-hidden />}
            Atualizar
          </Button>
        </div>

        {!dadosProntos ? (
          <div className="flex justify-center py-20">
            <Spinner className="h-10 w-10 text-primary" />
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="space-y-4 print:block">
            <TabsList className="no-scrollbar flex h-auto w-full flex-wrap justify-start gap-1 overflow-x-auto bg-muted/40 p-1 print:hidden">
              <TabsTrigger value="visao" className="gap-1">
                <BarChart3 className="h-3.5 w-3.5" />
                Visão geral
              </TabsTrigger>
              <TabsTrigger value="operacao" className="gap-1">
                <Activity className="h-3.5 w-3.5" />
                Operação
              </TabsTrigger>
              <TabsTrigger value="clientes" className="gap-1">
                <Users className="h-3.5 w-3.5" />
                Clientes
              </TabsTrigger>
              <TabsTrigger value="barbeiros" className="gap-1">
                <UserCircle className="h-3.5 w-3.5" />
                Barbeiros
              </TabsTrigger>
              <TabsTrigger value="produtos" className="gap-1">
                <Package className="h-3.5 w-3.5" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="tendencias" className="gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                Tendências
              </TabsTrigger>
            </TabsList>

            <div className="hidden print:block print:space-y-2">
              <p className="text-sm font-semibold">Relatório executivo — {periodoLabel}</p>
              <p className="text-xs text-muted-foreground">
                Atendimentos: {resAtual.total} · Concluídos: {resAtual.concluidos} · Faturamento (concluídos):{' '}
                {formatCurrency(resAtual.fatConcluido)}
              </p>
            </div>

            <TabsContent value="visao" className="mt-0 space-y-4 print:block">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Atendimentos no período</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">{resAtual.total}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    <TrendDelta atual={resAtual.total} anterior={resAnt.total} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Concluídos</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">{resAtual.concluidos}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    Taxa de realização: {resAtual.realizacao.toFixed(1)}%
                    <br />
                    <TrendDelta atual={resAtual.concluidos} anterior={resAnt.concluidos} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Faturamento (concluídos)</CardDescription>
                    <CardTitle className="text-2xl tabular-nums text-primary">
                      {formatCurrency(resAtual.fatConcluido)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    <TrendDelta atual={resAtual.fatConcluido} anterior={resAnt.fatConcluido} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Ticket médio</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">{formatCurrency(resAtual.ticketMedio)}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    <TrendDelta atual={resAtual.ticketMedio} anterior={resAnt.ticketMedio} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Base de clientes</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">{totalClientes}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    Novos no período: <span className="font-medium text-foreground">{clientesNovos}</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Estoque (alertas)</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">
                      {estoqueAlerta.baixo + estoqueAlerta.esgotado}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {estoqueAlerta.esgotado} esgotado(s) · {estoqueAlerta.baixo} abaixo do mínimo ·{' '}
                    {estoqueAlerta.total} SKU
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumo</CardTitle>
                  <CardDescription>
                    Visão 360°: operação (agendamentos), receita realizada em concluídos, base de clientes e risco em
                    estoque. Use as abas para detalhar.
                  </CardDescription>
                </CardHeader>
              </Card>
            </TabsContent>

            <TabsContent value="operacao" className="mt-0 space-y-4 print:hidden">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Distribuição por status</CardTitle>
                    <CardDescription>Proporção dos agendamentos no período</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {statusDistribuicao.map(({ k, n, pct }) => (
                      <div key={k} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{STATUS_LABEL[k]}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {n} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Volume por hora do dia</CardTitle>
                    <CardDescription>Início do agendamento (hora local)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex h-28 items-end justify-between gap-0.5">
                      {picos.map(({ hora, v, pct }) => (
                        <div key={hora} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                          <div
                            className="w-full rounded-t bg-primary/70 dark:bg-primary/50"
                            style={{ height: `${Math.max(6, pct)}%` }}
                            title={`${hora}h — ${v} agend.`}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-center text-[10px] text-muted-foreground">0h – 23h</p>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Indicadores rápidos</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/60 p-3 text-sm">
                    <p className="text-muted-foreground">Cancelamentos</p>
                    <p className="text-xl font-semibold">{resAtual.cancelados}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3 text-sm">
                    <p className="text-muted-foreground">Faltas</p>
                    <p className="text-xl font-semibold">{resAtual.faltas}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3 text-sm">
                    <p className="text-muted-foreground">Futuros / em curso</p>
                    <p className="text-xl font-semibold">{resAtual.agendadosOuEm}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clientes" className="mt-0 print:hidden">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Clientes mais frequentes</CardTitle>
                  <CardDescription>Ordenado por número de agendamentos no período (top 20)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[min(420px,55vh)] pr-3">
                    <ul className="space-y-2">
                      {clientesRank.map((c, i) => (
                        <li
                          key={c.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                        >
                          <span className="min-w-0 truncate">
                            <span className="text-muted-foreground">{i + 1}. </span>
                            {c.nome}
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {c.visitas} visita(s) · {formatCurrency(c.fat)}
                          </span>
                        </li>
                      ))}
                      {clientesRank.length === 0 ? (
                        <li className="text-sm text-muted-foreground">Nenhum agendamento no período.</li>
                      ) : null}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="barbeiros" className="mt-0 print:hidden">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Produtividade por profissional</CardTitle>
                  <CardDescription>Concluídos e faturamento associado no período</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[min(420px,55vh)] pr-3">
                    <ul className="space-y-2">
                      {barbeirosRank.map((b, i) => (
                        <li
                          key={b.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                        >
                          <span className="min-w-0 truncate font-medium">
                            <span className="text-muted-foreground">{i + 1}. </span>
                            {b.nome}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {b.concl} concl. · {formatCurrency(b.fat)}
                          </span>
                        </li>
                      ))}
                      {barbeirosRank.length === 0 ? (
                        <li className="text-sm text-muted-foreground">Nenhum dado no período.</li>
                      ) : null}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="produtos" className="mt-0 space-y-4 print:hidden">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scissors className="h-4 w-4" aria-hidden />
                    Serviços mais vendidos
                  </CardTitle>
                  <CardDescription>Quantidade de agendamentos e receita em concluídos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {servicosRank.slice(0, 15).map((s, i) => (
                      <li
                        key={s.id}
                        className="flex justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate">
                          {i + 1}. {s.nome}
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {s.q} · {formatCurrency(s.fat)}
                        </span>
                      </li>
                    ))}
                    {servicosRank.length === 0 ? (
                      <li className="text-sm text-muted-foreground">Nenhum serviço no período.</li>
                    ) : null}
                  </ul>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" aria-hidden />
                    Estoque (SKU)
                  </CardTitle>
                  <CardDescription>Resumo de risco — detalhe na página Estoque</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-muted/40 p-3 text-center">
                    <p className="text-2xl font-bold">{estoqueAlerta.total}</p>
                    <p className="text-xs text-muted-foreground">Itens cadastrados</p>
                  </div>
                  <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-3 text-center dark:border-amber-900/50 dark:bg-amber-950/30">
                    <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{estoqueAlerta.baixo}</p>
                    <p className="text-xs text-amber-800/90 dark:text-amber-200/90">Abaixo do mínimo</p>
                  </div>
                  <div className="rounded-lg border border-red-200/80 bg-red-50/80 p-3 text-center dark:border-red-900/50 dark:bg-red-950/30">
                    <p className="text-2xl font-bold text-red-900 dark:text-red-100">{estoqueAlerta.esgotado}</p>
                    <p className="text-xs text-red-800/90 dark:text-red-200/90">Esgotados</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tendencias" className="mt-0 space-y-4 print:hidden">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Comparativo com período anterior</CardTitle>
                  <CardDescription>
                    Anterior: {format(iniAnt, 'dd/MM/yyyy', { locale: ptBR })} –{' '}
                    {format(fimAnt, 'dd/MM/yyyy', { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/70 p-4">
                    <p className="text-sm font-medium">Faturamento (concluídos)</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(resAtual.fatConcluido)}</p>
                    <p className="text-xs text-muted-foreground">antes {formatCurrency(resAnt.fatConcluido)}</p>
                    <div className="mt-2">
                      <TrendDelta atual={resAtual.fatConcluido} anterior={resAnt.fatConcluido} />
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 p-4">
                    <p className="text-sm font-medium">Atendimentos totais</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{resAtual.total}</p>
                    <p className="text-xs text-muted-foreground">antes {resAnt.total}</p>
                    <div className="mt-2">
                      <TrendDelta atual={resAtual.total} anterior={resAnt.total} />
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 p-4">
                    <p className="text-sm font-medium">Taxa de realização</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{resAtual.realizacao.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">antes {resAnt.realizacao.toFixed(1)}%</p>
                    <div className="mt-2">
                      <TrendDelta atual={resAtual.realizacao} anterior={resAnt.realizacao} />
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 p-4">
                    <p className="text-sm font-medium">Cancelamentos + faltas</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">
                      {resAtual.cancelados + resAtual.faltas}
                    </p>
                    <p className="text-xs text-muted-foreground">antes {resAnt.cancelados + resAnt.faltas}</p>
                    <div className="mt-2">
                      <TrendDelta
                        atual={resAtual.cancelados + resAtual.faltas}
                        anterior={resAnt.cancelados + resAnt.faltas}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </PageContent>
    </TenantPanelPageContainer>
  )
}
