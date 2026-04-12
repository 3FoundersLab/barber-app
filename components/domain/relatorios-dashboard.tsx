'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  Activity,
  BarChart3,
} from 'lucide-react'
import { endOfDay, format, startOfDay, subDays, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import {
  intervaloAnteriorComparacao,
  intervaloPorPreset,
  textoComparativoKpi,
  toLocalDateKey,
  type RelatorioPeriodoPreset,
} from '@/lib/relatorios-range'
import { tenantBarbeariaBasePath } from '@/lib/routes'
import { RelatoriosBarbeirosPainel } from '@/components/domain/relatorios-barbeiros-painel'
import { RelatoriosClientesPainel } from '@/components/domain/relatorios-clientes-painel'
import { RelatoriosOperacaoPainel } from '@/components/domain/relatorios-operacao-painel'
import { RelatoriosProdutosRelatorioPainel } from '@/components/domain/relatorios-produtos-relatorio-painel'
import { RelatoriosTendenciasPainel } from '@/components/domain/relatorios-tendencias-painel'
import { RelatoriosVisaoGraficos } from '@/components/domain/relatorios-visao-graficos'
import { estoqueCardStatus } from '@/lib/estoque-produto-utils'
import { formatCurrency, ROLE_LABELS } from '@/lib/constants'
import {
  RELATORIOS_AUTO_REFRESH_MS,
  RELATORIOS_CACHE_MS,
  relatoriosDashboardCacheKey,
} from '@/lib/relatorios-dashboard-cache'
import { buildRelatorioPerformancePdfData } from '@/lib/relatorio-performance-pdf-data'
import { exportRelatorioPerformancePdf } from '@/lib/relatorio-performance-pdf-export'
import { RelatorioPerformancePdfDocument } from '@/components/domain/relatorio-performance-pdf-document'
import { cn } from '@/lib/utils'
import type { AgHistoricoCliente, ClienteCadastroAnalise } from '@/lib/relatorios-clientes-analise'
import { mapEstoqueRowToProduto, type EstoqueProdutoRow } from '@/lib/map-estoque-produto'
import type { VendaProdutoLinha } from '@/lib/relatorios-produtos-relatorio'
import type { Agendamento, AppointmentStatus, UserRole } from '@/types'
import type { EstoqueProduto } from '@/types/estoque-produto'

function pctChange(atual: number, anterior: number): { pct: number; up: boolean | null } {
  if (anterior === 0) return atual > 0 ? { pct: 100, up: true } : { pct: 0, up: null }
  const pct = ((atual - anterior) / anterior) * 100
  return { pct, up: pct > 0 ? true : pct < 0 ? false : null }
}

function TrendDelta({
  atual,
  anterior,
  comparar,
  textoRodape,
}: {
  atual: number
  anterior: number
  comparar: boolean
  textoRodape: string
}) {
  if (!comparar) {
    return (
      <span className="leading-snug text-muted-foreground">
        Ative &quot;Comparar com período anterior&quot; para ver variação.
      </span>
    )
  }
  const { pct, up } = pctChange(atual, anterior)
  if (up === null && Math.abs(pct) < 0.05) {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3 shrink-0" aria-hidden />
        <span>estável {textoRodape}</span>
      </span>
    )
  }
  const Icon = up ? ArrowUpRight : ArrowDownRight
  const cls = up ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-x-1 text-xs font-medium', cls)}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        {up ? '+' : ''}
        {pct.toFixed(1)}% {textoRodape}
      </span>
    </span>
  )
}

type MinhaUnidade = { id: string; nome: string; slug: string }

function parseMinhasUnidades(
  rows: { barbearias?: MinhaUnidade | MinhaUnidade[] | null }[] | null,
): MinhaUnidade[] {
  const byId = new Map<string, MinhaUnidade>()
  for (const row of rows ?? []) {
    const raw = row.barbearias
    const b = Array.isArray(raw) ? raw[0] : raw
    if (b?.id && b.slug) {
      byId.set(b.id, { id: b.id, nome: b.nome?.trim() || b.slug, slug: b.slug })
    }
  }
  return [...byId.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
}

function KpiVisaoCard({
  titulo,
  valorExibido,
  atual,
  anterior,
  textoRodape,
  dica,
  onDrill,
}: {
  titulo: string
  valorExibido: string
  atual: number
  anterior: number
  textoRodape: string
  /** Texto do tooltip (acessível + contexto). */
  dica: string
  /** Drill-down: ex. mudar de aba. */
  onDrill?: () => void
}) {
  const card = (
    <Card
      className={cn(
        'min-w-0',
        onDrill &&
          'cursor-pointer transition-colors hover:border-primary/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
      onClick={onDrill}
      role={onDrill ? 'button' : undefined}
      tabIndex={onDrill ? 0 : undefined}
      onKeyDown={
        onDrill
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onDrill()
              }
            }
          : undefined
      }
    >
      <CardHeader className="pb-2">
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className="text-2xl tabular-nums tracking-tight">{valorExibido}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-[44px] text-xs text-muted-foreground">
        <TrendDelta comparar={true} atual={atual} anterior={anterior} textoRodape={textoRodape} />
      </CardContent>
    </Card>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{card}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[min(100vw-1rem,20rem)] text-balance">
        {dica}
        {onDrill ? <span className="mt-1 block text-[10px] opacity-90">Clique para abrir o detalhe sugerido.</span> : null}
      </TooltipContent>
    </Tooltip>
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
  const router = useRouter()
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [unidades, setUnidades] = useState<MinhaUnidade[]>([])
  const [preset, setPreset] = useState<RelatorioPeriodoPreset>('7d')
  const [personalizadoInicio, setPersonalizadoInicio] = useState<Date | null>(null)
  const [personalizadoFim, setPersonalizadoFim] = useState<Date | null>(null)
  const fetchCacheRef = useRef<{ key: string; at: number } | null>(null)
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
  const [clientesNovosAnt, setClientesNovosAnt] = useState(0)
  /** Soma (preço × qtd) de `comanda_produtos` em comandas fechadas, por `referencia_data`. */
  const [receitaProdutosPorDia, setReceitaProdutosPorDia] = useState<Record<string, number>>({})
  const [produtosConsumidosRank, setProdutosConsumidosRank] = useState<{ nome: string; qtd: number }[]>([])
  /** Até 36 meses para análise de público (RFV, coorte, LTV). */
  const [agHistClienteAnalise, setAgHistClienteAnalise] = useState<AgHistoricoCliente[]>([])
  const [clientesAnalise, setClientesAnalise] = useState<ClienteCadastroAnalise[]>([])
  const [receitaProdutosPorBarbeiro, setReceitaProdutosPorBarbeiro] = useState<Record<string, number>>({})
  const [vendasProdutos120d, setVendasProdutos120d] = useState<VendaProdutoLinha[]>([])
  const [receitaProdutoPorMesHist, setReceitaProdutoPorMesHist] = useState<Record<string, number>>({})
  const [receitaProdutoPorDiaHist, setReceitaProdutoPorDiaHist] = useState<Record<string, number>>({})
  const [barbeariaMeta, setBarbeariaMeta] = useState<{ nome: string; logo: string | null } | null>(null)
  const [pdfUsuario, setPdfUsuario] = useState<{ nome: string; papel: string } | null>(null)
  const [pdfExportPhase, setPdfExportPhase] = useState<'idle' | 'generating' | 'done'>('idle')

  const { inicio, fim } = useMemo(
    () => intervaloPorPreset(preset, personalizadoInicio, personalizadoFim),
    [preset, personalizadoInicio, personalizadoFim],
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

  const textoRodapeKpi = useMemo(() => textoComparativoKpi(inicio, fim), [inicio, fim])

  const load = useCallback(async (options?: { force?: boolean }) => {
    if (!barbeariaId) return
    const sk = toLocalDateKey(inicio)
    const ek = toLocalDateKey(fim)
    const cacheKey = relatoriosDashboardCacheKey(barbeariaId, sk, ek)
    if (
      !options?.force &&
      fetchCacheRef.current?.key === cacheKey &&
      Date.now() - fetchCacheRef.current.at < RELATORIOS_CACHE_MS
    ) {
      return
    }

    setError(null)
    setRefreshing(true)
    try {
      const supabase = createClient()
      const i0 = inicio
      const f0 = fim
      const { inicio: ia, fim: fa } = intervaloAnteriorComparacao(i0, f0)
      const ska = toLocalDateKey(ia)
      const eka = toLocalDateKey(fa)

      const sel = `
      *,
      cliente:clientes(*),
      barbeiro:barbeiros(*),
      servico:servicos(*)
    `

      const rAtual = await supabase
        .from('agendamentos')
        .select(sel)
        .eq('barbearia_id', barbeariaId)
        .gte('data', sk)
        .lte('data', ek)
        .order('data', { ascending: true })
        .order('horario', { ascending: true })

      const [rAnt, rNovosAnt] = await Promise.all([
        supabase
          .from('agendamentos')
          .select(sel)
          .eq('barbearia_id', barbeariaId)
          .gte('data', ska)
          .lte('data', eka),
        supabase
          .from('clientes')
          .select('id', { count: 'exact', head: true })
          .eq('barbearia_id', barbeariaId)
          .gte('created_at', ia.toISOString())
          .lte('created_at', fa.toISOString()),
      ])
      if (rAnt.error) setAgAnterior([])
      else setAgAnterior((rAnt.data ?? []) as Agendamento[])
      setClientesNovosAnt(rNovosAnt.count ?? 0)

      const histIni = toLocalDateKey(subMonths(startOfDay(new Date()), 36))
      const histFim = toLocalDateKey(endOfDay(new Date()))

      const cut120d = toLocalDateKey(subDays(startOfDay(new Date()), 120))

      const [rCli, rNovos, rEst, rComProd, rAgHist, rCliMeta, rCom120] = await Promise.all([
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('barbearia_id', barbeariaId),
        supabase
          .from('clientes')
          .select('id', { count: 'exact', head: true })
          .eq('barbearia_id', barbeariaId)
          .gte('created_at', i0.toISOString())
          .lte('created_at', f0.toISOString()),
        supabase.from('estoque_produtos').select('*').eq('barbearia_id', barbeariaId).order('nome'),
        supabase
          .from('comandas')
          .select(
            'referencia_data, barbeiro_id, comanda_produtos(produto_estoque_id, nome, preco_unitario, quantidade)',
          )
          .eq('barbearia_id', barbeariaId)
          .eq('status', 'fechada')
          .gte('referencia_data', sk)
          .lte('referencia_data', ek),
        supabase
          .from('agendamentos')
          .select(
            `
            cliente_id,
            data,
            horario,
            status,
            valor,
            servico_id,
            barbeiro_id,
            servico:servicos(nome),
            barbeiro:barbeiros(nome)
          `,
          )
          .eq('barbearia_id', barbeariaId)
          .gte('data', histIni)
          .lte('data', histFim),
        supabase
          .from('clientes')
          .select('id, nome, created_at, origem_canal, data_nascimento')
          .eq('barbearia_id', barbeariaId),
        supabase
          .from('comandas')
          .select(
            'referencia_data, barbeiro_id, comanda_produtos(produto_estoque_id, nome, preco_unitario, quantidade)',
          )
          .eq('barbearia_id', barbeariaId)
          .eq('status', 'fechada')
          .gte('referencia_data', histIni)
          .lte('referencia_data', histFim),
      ])

      type ComandaProdRow = {
        referencia_data: string
        barbeiro_id: string
        comanda_produtos?:
          | {
              produto_estoque_id?: string | null
              nome: string
              preco_unitario: number
              quantidade: number
            }[]
          | null
      }
      const receitaProd: Record<string, number> = {}
      const prodQtd = new Map<string, number>()
      const receitaPorBarbeiro: Record<string, number> = {}
      if (rComProd.error) {
        setReceitaProdutosPorDia({})
        setProdutosConsumidosRank([])
        setReceitaProdutosPorBarbeiro({})
      } else if (rComProd.data) {
        for (const row of rComProd.data as ComandaProdRow[]) {
          const dk = row.referencia_data
          const bid = row.barbeiro_id
          const lines = row.comanda_produtos
          if (!lines?.length) continue
          for (const l of lines) {
            const qty = Math.max(0, Math.floor(Number(l.quantidade) || 0))
            const sub = Number(l.preco_unitario) * qty
            receitaProd[dk] = (receitaProd[dk] ?? 0) + sub
            if (bid) {
              receitaPorBarbeiro[bid] = (receitaPorBarbeiro[bid] ?? 0) + sub
            }
            const nomeP = (l.nome && String(l.nome).trim()) || 'Produto'
            prodQtd.set(nomeP, (prodQtd.get(nomeP) ?? 0) + qty)
          }
        }
        setReceitaProdutosPorDia(receitaProd)
        setReceitaProdutosPorBarbeiro(receitaPorBarbeiro)
        setProdutosConsumidosRank(
          [...prodQtd.entries()]
            .map(([nome, qtd]) => ({ nome, qtd }))
            .sort((a, b) => b.qtd - a.qtd)
            .slice(0, 40),
        )
      } else {
        setReceitaProdutosPorDia({})
        setProdutosConsumidosRank([])
        setReceitaProdutosPorBarbeiro({})
      }

      if (rCom120.error) {
        setVendasProdutos120d([])
        setReceitaProdutoPorMesHist({})
        setReceitaProdutoPorDiaHist({})
      } else if (rCom120.data) {
        const linhas120: VendaProdutoLinha[] = []
        const prodMes: Record<string, number> = {}
        const prodDia: Record<string, number> = {}
        for (const row of rCom120.data as ComandaProdRow[]) {
          const dk = row.referencia_data
          const ym = dk.slice(0, 7)
          for (const l of row.comanda_produtos ?? []) {
            const pid = l.produto_estoque_id
            const qty = Math.max(0, Math.floor(Number(l.quantidade) || 0))
            if (qty <= 0) continue
            const sub = Number(l.preco_unitario) * qty
            prodMes[ym] = (prodMes[ym] ?? 0) + sub
            prodDia[dk] = (prodDia[dk] ?? 0) + sub
            if (pid && dk >= cut120d) {
              linhas120.push({
                produto_estoque_id: String(pid),
                nome: (l.nome && String(l.nome).trim()) || 'Produto',
                referencia_data: dk,
                quantidade: qty,
                receita: sub,
              })
            }
          }
        }
        setVendasProdutos120d(linhas120)
        setReceitaProdutoPorMesHist(prodMes)
        setReceitaProdutoPorDiaHist(prodDia)
      } else {
        setVendasProdutos120d([])
        setReceitaProdutoPorMesHist({})
        setReceitaProdutoPorDiaHist({})
      }

      if (rAtual.error) {
        setError('Não foi possível carregar agendamentos do período.')
        setAgAtual([])
      } else {
        setAgAtual((rAtual.data ?? []) as Agendamento[])
      }

      setTotalClientes(rCli.count ?? 0)
      setClientesNovos(rNovos.count ?? 0)
      if (rEst.error) setEstoque([])
      else
        setEstoque((rEst.data ?? []).map((row) => mapEstoqueRowToProduto(row as EstoqueProdutoRow)))

      if (rAgHist.error) setAgHistClienteAnalise([])
      else setAgHistClienteAnalise((rAgHist.data ?? []) as unknown as AgHistoricoCliente[])

      if (rCliMeta.error) {
        const rFallback = await supabase
          .from('clientes')
          .select('id, nome, created_at')
          .eq('barbearia_id', barbeariaId)
        if (!rFallback.error && rFallback.data) {
          setClientesAnalise(
            (rFallback.data as { id: string; nome: string; created_at: string }[]).map((c) => ({
              ...c,
              origem_canal: null,
              data_nascimento: null,
            })),
          )
        } else {
          setClientesAnalise([])
        }
      } else {
        setClientesAnalise((rCliMeta.data ?? []) as ClienteCadastroAnalise[])
      }

      if (!rAtual.error) {
        fetchCacheRef.current = { key: cacheKey, at: Date.now() }
      }
    } finally {
      setRefreshing(false)
      setDadosProntos(true)
    }
  }, [barbeariaId, inicio, fim])

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
    let cancelled = false
    async function loadUnidades() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data: buRows } = await supabase
        .from('barbearia_users')
        .select('barbearias ( id, nome, slug )')
        .eq('user_id', user.id)
      if (!cancelled) setUnidades(parseMinhasUnidades(buRows))
    }
    void loadUnidades()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!barbeariaId) return
    void load()
  }, [barbeariaId, load])

  useEffect(() => {
    if (!barbeariaId) return
    const id = window.setInterval(() => {
      void load({ force: true })
    }, RELATORIOS_AUTO_REFRESH_MS)
    return () => window.clearInterval(id)
  }, [barbeariaId, load])

  useEffect(() => {
    if (!barbeariaId) return
    let cancelled = false
    void (async () => {
      const supabase = createClient()
      const { data } = await supabase.from('barbearias').select('nome, logo').eq('id', barbeariaId).maybeSingle()
      if (cancelled) return
      if (data) {
        const row = data as { nome?: string | null; logo?: string | null }
        setBarbeariaMeta({
          nome: (row.nome && String(row.nome).trim()) || 'Barbearia',
          logo: row.logo && String(row.logo).trim() ? String(row.logo).trim() : null,
        })
      } else {
        setBarbeariaMeta(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [barbeariaId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return
      const { data } = await supabase.from('profiles').select('nome, role').eq('id', user.id).maybeSingle()
      if (cancelled) return
      if (data) {
        const row = data as { nome?: string | null; role?: UserRole | null }
        const nome = (row.nome && String(row.nome).trim()) || 'Usuário'
        const papel = row.role ? ROLE_LABELS[row.role] ?? String(row.role) : '—'
        setPdfUsuario({ nome, papel })
      } else {
        setPdfUsuario(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

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

  const insightProativos = useMemo(() => {
    const out: { id: string; tipo: 'positivo' | 'alerta' | 'oportunidade'; titulo: string; descricao: string }[] = []
    const vFat = pctChange(resAtual.fatConcluido, resAnt.fatConcluido)
    if (vFat.pct <= -10) {
      out.push({
        id: 'fat-down',
        tipo: 'alerta',
        titulo: 'Queda forte no faturamento',
        descricao: `Receita de serviços concluídos caiu ${Math.abs(vFat.pct).toFixed(1)}% vs período anterior equivalente.`,
      })
    } else if (vFat.pct >= 10) {
      out.push({
        id: 'fat-up',
        tipo: 'positivo',
        titulo: 'Faturamento em alta',
        descricao: `Receita subiu ${vFat.pct.toFixed(1)}% em relação ao período anterior.`,
      })
    }
    const vAg = pctChange(resAtual.total, resAnt.total)
    if (vAg.pct <= -10) {
      out.push({
        id: 'ag-down',
        tipo: 'alerta',
        titulo: 'Menos movimento na agenda',
        descricao: `Agendamentos totais caíram ${Math.abs(vAg.pct).toFixed(1)}% vs período equivalente.`,
      })
    }
    const cancA = resAtual.cancelados + resAtual.faltas
    const cancP = resAnt.cancelados + resAnt.faltas
    if (resAtual.total >= 12 && cancP > 0 && cancA > cancP) {
      const vC = pctChange(cancA, cancP)
      if (vC.pct >= 15) {
        out.push({
          id: 'canc-up',
          tipo: 'alerta',
          titulo: 'Cancelamentos e faltas em subida',
          descricao: `Cancelamentos + faltas aumentaram ${vC.pct.toFixed(0)}% vs período anterior. Vale reforçar confirmação e política de falta.`,
        })
      }
    }
    return out
  }, [resAtual, resAnt])

  const nomeBarbeariaPdf = barbeariaMeta?.nome ?? unidades.find((u) => u.slug === slug)?.nome ?? 'Barbearia'
  const logoBarbeariaPdf = barbeariaMeta?.logo ?? null

  const pdfData = useMemo(() => {
    if (!dadosProntos) return null
    return buildRelatorioPerformancePdfData({
      barbeariaNome: nomeBarbeariaPdf,
      barbeariaLogoUrl: logoBarbeariaPdf,
      inicio,
      fim,
      geradoEm: new Date(),
      geradoPorNome: pdfUsuario?.nome ?? 'Usuário',
      geradoPorPapel: pdfUsuario?.papel ?? '—',
      compararComAnterior: true,
      textoRodapeKpi,
      periodoLabel,
      atualFiltrado,
      resAtual: resAtual,
      resAnt: resAnt,
      clientesNovos,
      clientesNovosAnt,
      totalClientes,
      estoqueAlerta,
      statusDistribuicao: statusDistribuicao.map((s) => ({ k: s.k, n: s.n, pct: s.pct })),
      statusLabel: STATUS_LABEL,
      picos,
      servicosRank,
      receitaProdutosPorBarbeiro,
      receitaProdutosPorDia,
      produtosConsumidosRank,
      agHistClienteAnalise,
      clientesAnalise,
    })
  }, [
    dadosProntos,
    nomeBarbeariaPdf,
    logoBarbeariaPdf,
    inicio,
    fim,
    pdfUsuario,
    textoRodapeKpi,
    periodoLabel,
    atualFiltrado,
    resAtual,
    resAnt,
    clientesNovos,
    clientesNovosAnt,
    totalClientes,
    estoqueAlerta,
    statusDistribuicao,
    picos,
    servicosRank,
    receitaProdutosPorBarbeiro,
    receitaProdutosPorDia,
    produtosConsumidosRank,
    agHistClienteAnalise,
    clientesAnalise,
  ])

  useEffect(() => {
    if (pdfExportPhase !== 'done') return
    const t = window.setTimeout(() => setPdfExportPhase('idle'), 3000)
    return () => window.clearTimeout(t)
  }, [pdfExportPhase])

  const handleExportPdf = useCallback(async () => {
    if (!pdfData || pdfExportPhase === 'generating') return
    setPdfExportPhase('generating')
    setError(null)
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      const el = document.getElementById('relatorio-performance-pdf-root')
      if (!el) throw new Error('Elemento PDF não encontrado')
      await exportRelatorioPerformancePdf(el)
      setPdfExportPhase('done')
    } catch {
      setPdfExportPhase('idle')
      setError('Não foi possível gerar o PDF. Tente novamente ou verifique bloqueadores de download.')
    }
  }, [pdfData, pdfExportPhase])

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
            size="sm"
            disabled={!pdfData || refreshing || pdfExportPhase === 'generating'}
            className="print:hidden flex items-center gap-2 bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-60"
            onClick={() => void handleExportPdf()}
          >
            {pdfExportPhase === 'generating' ? (
              <>
                <Spinner className="h-4 w-4 text-white" />
                Gerando…
              </>
            ) : pdfExportPhase === 'done' ? (
              <>Download pronto!</>
            ) : (
              <>
                <Download className="h-4 w-4" aria-hidden />
                Exportar PDF
              </>
            )}
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

        <div className="space-y-4 rounded-xl border border-border/80 bg-muted/20 p-3 md:p-4 print:border-0 print:bg-transparent">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Filtros globais
              </span>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Período rápido</Label>
                  <Select
                    value={preset}
                    onValueChange={(v) => {
                      const p = v as RelatorioPeriodoPreset
                      setPreset(p)
                      if (p === 'personalizado') {
                        setPersonalizadoInicio((prev) => prev ?? startOfDay(subDays(new Date(), 6)))
                        setPersonalizadoFim((prev) => prev ?? endOfDay(new Date()))
                      }
                    }}
                    disabled={!barbeariaId}
                  >
                    <SelectTrigger className="h-9 w-[min(100%,13.5rem)] sm:w-[220px]">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="ontem">Ontem</SelectItem>
                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                      <SelectItem value="mes">Este mês</SelectItem>
                      <SelectItem value="mes_anterior">Mês passado</SelectItem>
                      <SelectItem value="personalizado">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {preset === 'personalizado' ? (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="rel-dt-ini" className="text-[11px] text-muted-foreground">
                        Início
                      </Label>
                      <Input
                        id="rel-dt-ini"
                        type="date"
                        className="h-9 w-[10.5rem]"
                        value={personalizadoInicio ? format(personalizadoInicio, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const t = e.target.value
                          if (!t) {
                            setPersonalizadoInicio(null)
                            return
                          }
                          setPersonalizadoInicio(startOfDay(new Date(`${t}T12:00:00`)))
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rel-dt-fim" className="text-[11px] text-muted-foreground">
                        Fim
                      </Label>
                      <Input
                        id="rel-dt-fim"
                        type="date"
                        className="h-9 w-[10.5rem]"
                        value={personalizadoFim ? format(personalizadoFim, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const t = e.target.value
                          if (!t) {
                            setPersonalizadoFim(null)
                            return
                          }
                          setPersonalizadoFim(endOfDay(new Date(`${t}T12:00:00`)))
                        }}
                      />
                    </div>
                  </>
                ) : null}
                <span className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-2.5 py-1 text-sm text-muted-foreground">
                  <CalendarRange className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                  <span className="font-medium text-foreground">{periodoLabel}</span>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
              {unidades.length > 1 ? (
                <div className="space-y-1 sm:min-w-[12rem]">
                  <Label className="text-[11px] text-muted-foreground">Unidade</Label>
                  <Select
                    value={slug}
                    onValueChange={(nextSlug) =>
                      router.push(`${tenantBarbeariaBasePath(nextSlug)}/relatorios`)
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades.map((u) => (
                        <SelectItem key={u.id} value={u.slug}>
                          {u.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <p className="max-w-[14rem] text-[11px] leading-snug text-muted-foreground">
                Variação dos KPIs compara sempre com o período anterior de mesma duração.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 shrink-0 gap-1.5"
                disabled={!barbeariaId || refreshing}
                onClick={() => void load({ force: true })}
              >
                {refreshing ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" aria-hidden />}
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        {!dadosProntos ? (
          <div className="space-y-4 py-6 print:hidden" aria-busy="true" aria-label="A carregar relatórios">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[118px] rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-24 w-full max-w-2xl rounded-xl" />
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-[min(280px,50vw)] rounded-xl" />
              <Skeleton className="h-[min(280px,50vw)] rounded-xl" />
            </div>
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
                Faturamento: {formatCurrency(resAtual.fatConcluido)} · Atendimentos: {resAtual.total} · Ocupação:{' '}
                {resAtual.realizacao.toFixed(0)}% · Ticket médio: {formatCurrency(resAtual.ticketMedio)} · Novos
                clientes: {clientesNovos}
              </p>
            </div>

            <TabsContent value="visao" className="mt-0 space-y-4 print:block">
              {tab === 'visao' ? (
                <>
                  <div>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground print:hidden">
                      Visão geral
                    </h2>
                    <TooltipProvider delayDuration={280}>
                      <motion.div
                        className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      >
                        <KpiVisaoCard
                          titulo="Faturamento"
                          valorExibido={formatCurrency(resAtual.fatConcluido)}
                          atual={resAtual.fatConcluido}
                          anterior={resAnt.fatConcluido}
                          textoRodape={textoRodapeKpi}
                          dica="Soma dos valores de agendamentos concluídos no período. Clique para ver a aba Operação."
                          onDrill={() => setTab('operacao')}
                        />
                        <KpiVisaoCard
                          titulo="Atendimentos"
                          valorExibido={String(resAtual.total)}
                          atual={resAtual.total}
                          anterior={resAnt.total}
                          textoRodape={textoRodapeKpi}
                          dica="Total de linhas na agenda (todos os estados). Clique para distribuição por status."
                          onDrill={() => setTab('operacao')}
                        />
                        <KpiVisaoCard
                          titulo="Ocupação"
                          valorExibido={`${resAtual.realizacao.toFixed(0)}%`}
                          atual={resAtual.realizacao}
                          anterior={resAnt.realizacao}
                          textoRodape={textoRodapeKpi}
                          dica="Concluídos ÷ total de agendamentos no período. Clique para volume por hora."
                          onDrill={() => setTab('operacao')}
                        />
                        <KpiVisaoCard
                          titulo="Ticket médio"
                          valorExibido={formatCurrency(resAtual.ticketMedio)}
                          atual={resAtual.ticketMedio}
                          anterior={resAnt.ticketMedio}
                          textoRodape={textoRodapeKpi}
                          dica="Faturamento de concluídos dividido pelo número de concluídos."
                          onDrill={() => setTab('operacao')}
                        />
                        <KpiVisaoCard
                          titulo="Novos clientes"
                          valorExibido={String(clientesNovos)}
                          atual={clientesNovos}
                          anterior={clientesNovosAnt}
                          textoRodape={textoRodapeKpi}
                          dica="Cadastros novos no intervalo (created_at). Clique para análise de clientes."
                          onDrill={() => setTab('clientes')}
                        />
                      </motion.div>
                    </TooltipProvider>
                  </div>
                  {insightProativos.length > 0 ? (
                    <Card className="border-amber-200/70 bg-amber-50/50 print:hidden dark:border-amber-900/45 dark:bg-amber-950/25">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Alertas inteligentes</CardTitle>
                        <CardDescription>
                          Deteção automática de mudanças fortes vs período anterior equivalente.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {insightProativos.map((it) => (
                          <div
                            key={it.id}
                            role="status"
                            className={cn(
                              'rounded-lg border px-3 py-2 text-sm',
                              it.tipo === 'alerta' && 'border-destructive/45 bg-destructive/5',
                              it.tipo === 'positivo' && 'border-emerald-500/35 bg-emerald-500/8',
                              it.tipo === 'oportunidade' && 'border-primary/35 bg-primary/5',
                            )}
                          >
                            <p className="font-medium">{it.titulo}</p>
                            <p className="text-xs leading-snug text-muted-foreground">{it.descricao}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ) : null}
                  <Card className="border-dashed print:hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Contexto</CardTitle>
                      <CardDescription>
                        Base total: <span className="font-medium text-foreground">{totalClientes}</span> clientes ·
                        Concluídos no período: {resAtual.concluidos} · Alertas de estoque:{' '}
                        <span className="font-medium text-foreground">
                          {estoqueAlerta.baixo + estoqueAlerta.esgotado}
                        </span>{' '}
                        ({estoqueAlerta.esgotado} esgot., {estoqueAlerta.baixo} abaixo do mín.)
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  {atualFiltrado.length === 0 ? (
                    <Empty className="mx-auto max-w-md border print:hidden">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <BarChart3 className="size-6" aria-hidden />
                        </EmptyMedia>
                        <EmptyTitle>Sem agendamentos no período</EmptyTitle>
                        <EmptyDescription>
                          Altere o período rápido ou as datas personalizadas. Os gráficos aparecem quando houver dados na
                          agenda.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <div className="print:hidden">
                      <RelatoriosVisaoGraficos
                        inicio={inicio}
                        fim={fim}
                        agendamentosPeriodo={atualFiltrado}
                        receitaProdutosPorDia={receitaProdutosPorDia}
                      />
                    </div>
                  )}
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="operacao" className="mt-0 space-y-4 print:hidden">
              {tab === 'operacao' ? (
                <>
                  <RelatoriosOperacaoPainel
                    agendamentos={atualFiltrado}
                    servicosRank={servicosRank}
                    produtosConsumidos={produtosConsumidosRank}
                  />
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
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="clientes" className="mt-0 space-y-4 print:hidden">
              {tab === 'clientes' ? (
                <>
                  <RelatoriosClientesPainel
                    totalClientes={totalClientes}
                    agHistorico={agHistClienteAnalise}
                    clientesCadastro={clientesAnalise}
                    notaHistorico="Agendamentos analisados: últimos 36 meses."
                  />
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
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="barbeiros" className="mt-0 space-y-4 print:hidden">
              {tab === 'barbeiros' ? (
                <RelatoriosBarbeirosPainel
                  agendamentos={atualFiltrado}
                  receitaProdutosPorBarbeiro={receitaProdutosPorBarbeiro}
                  inicio={inicio}
                  fim={fim}
                />
              ) : null}
            </TabsContent>

            <TabsContent value="produtos" className="mt-0 space-y-4 print:hidden">
              {tab === 'produtos' ? (
                <>
                  <RelatoriosProdutosRelatorioPainel
                    estoque={estoque}
                    vendasProdutos120d={vendasProdutos120d}
                    servicosRankNomes={servicosRank.map((s) => ({ nome: s.nome, q: s.q }))}
                  />
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
                </>
              ) : null}
            </TabsContent>

            <TabsContent value="tendencias" className="mt-0 space-y-4 print:hidden">
              {tab === 'tendencias' ? (
                <>
                  <RelatoriosTendenciasPainel
                    agHistorico={agHistClienteAnalise}
                    receitaProdutoPorMesHist={receitaProdutoPorMesHist}
                    receitaProdutoPorDiaHist={receitaProdutoPorDiaHist}
                  />
                  <Card>
                <CardHeader>
                  <CardTitle className="text-base">Comparativo com período anterior</CardTitle>
                  <CardDescription>
                    Janela de comparação: {format(iniAnt, 'dd/MM/yyyy', { locale: ptBR })} –{' '}
                    {format(fimAnt, 'dd/MM/yyyy', { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/70 p-4">
                    <p className="text-sm font-medium">Faturamento (concluídos)</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{formatCurrency(resAtual.fatConcluido)}</p>
                    <p className="text-xs text-muted-foreground">antes {formatCurrency(resAnt.fatConcluido)}</p>
                    <div className="mt-2">
                      <TrendDelta
                        comparar
                        atual={resAtual.fatConcluido}
                        anterior={resAnt.fatConcluido}
                        textoRodape={textoRodapeKpi}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 p-4">
                    <p className="text-sm font-medium">Atendimentos totais</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{resAtual.total}</p>
                    <p className="text-xs text-muted-foreground">antes {resAnt.total}</p>
                    <div className="mt-2">
                      <TrendDelta
                        comparar
                        atual={resAtual.total}
                        anterior={resAnt.total}
                        textoRodape={textoRodapeKpi}
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 p-4">
                    <p className="text-sm font-medium">Taxa de realização</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{resAtual.realizacao.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">antes {resAnt.realizacao.toFixed(1)}%</p>
                    <div className="mt-2">
                      <TrendDelta
                        comparar
                        atual={resAtual.realizacao}
                        anterior={resAnt.realizacao}
                        textoRodape={textoRodapeKpi}
                      />
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
                        comparar
                        atual={resAtual.cancelados + resAtual.faltas}
                        anterior={resAnt.cancelados + resAnt.faltas}
                        textoRodape={textoRodapeKpi}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
                </>
              ) : null}
            </TabsContent>
          </Tabs>
        )}
      </PageContent>

      <RelatorioPerformancePdfDocument data={pdfData} />
    </TenantPanelPageContainer>
  )
}
