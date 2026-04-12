'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Banknote,
  ChevronDown,
  ChevronLeft,
  CreditCard,
  Minus,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Smartphone,
  Trash2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  COMANDA_DEMO_ID_FECHADA,
  getDemoEditorStateFechada,
  getDemoEstoqueParaComanda,
  getDemoProdutoLinhasIniciais,
  getDemoServicoQtyInicial,
  getDemoServicosCatalogo,
} from '@/lib/comanda-demo-data'
import { planAjusteProdutoLinhas } from '@/lib/comanda-produto-estoque-ui'
import { calcularTotaisComanda } from '@/lib/comanda-totais'
import { mapEstoqueRowToProduto, type EstoqueProdutoRow } from '@/lib/map-estoque-produto'
import { restaurarEstoqueELimparProdutosComanda, syncComandaLinhas } from '@/lib/sync-comanda-linhas'
import { toUserFriendlyErrorMessage } from '@/lib/to-user-friendly-error'
import { ProdutoCatalogo } from '@/components/domain/produto-catalogo'
import { ResumoComanda } from '@/components/domain/resumo-comanda'
import { ServicoAgendaIcon } from '@/lib/agenda-service-icons'
import { estoqueCirculoCategoriaClass, estoqueIconeCategoria } from '@/lib/estoque-categoria-icons'
import { formatCurrency } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import type { Comanda, ComandaDescontoModo, ComandaFormaPagamento } from '@/types/comanda'
import type { EstoqueProduto } from '@/types/estoque-produto'
import type { Servico } from '@/types'

function num(v: unknown): number {
  if (typeof v === 'string') return parseFloat(v) || 0
  if (typeof v === 'number') return v
  return 0
}

interface ComandaEditorSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  comanda: Comanda | null
  onSaved: () => void
  /** Comanda fictícia: carrega catálogo/linhas locais e não persiste alterações. */
  demoMode?: boolean
}

export function ComandaEditorSheet({
  open,
  onOpenChange,
  comanda,
  onSaved,
  demoMode = false,
}: ComandaEditorSheetProps) {
  const [loading, setLoading] = useState(true)
  const [quietRefreshing, setQuietRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Indicador leve de auto-save (debounce 1s após última edição). */
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')

  const [servicosCatalogo, setServicosCatalogo] = useState<Servico[]>([])
  const [estoqueList, setEstoqueList] = useState<EstoqueProduto[]>([])
  const [servicoQty, setServicoQty] = useState<Record<string, number>>({})
  const [produtoLinhas, setProdutoLinhas] = useState<
    Array<{ produtoEstoqueId: string; nome: string; precoUnitario: number; quantidade: number }>
  >([])

  const [mesa, setMesa] = useState('')
  const [descontoModo, setDescontoModo] = useState<ComandaDescontoModo>('nenhum')
  const [descontoValor, setDescontoValor] = useState('')
  const [taxaServicoAplicar, setTaxaServicoAplicar] = useState(false)
  const [taxaServicoPct, setTaxaServicoPct] = useState('10')
  const [formaPagamento, setFormaPagamento] = useState<ComandaFormaPagamento | ''>('')

  const [buscaProduto, setBuscaProduto] = useState('')
  /** Comanda fechada/cancelada: edição só após tocar no lápis (evita alteração acidental). */
  const [modoCorrecaoFechadaCancelada, setModoCorrecaoFechadaCancelada] = useState(false)
  const [categoriaFiltroEstoque, setCategoriaFiltroEstoque] = useState<string>('todas')
  /** Quantidade já reservada na comanda ao abrir (para calcular teto: estoque DB + committed). */
  const [committedProduto, setCommittedProduto] = useState<Record<string, number>>({})

  const comandaRef = useRef(comanda)
  comandaRef.current = comanda

  const lastSavedDraftFingerprintRef = useRef<string | null>(null)
  const draftFingerprintRef = useRef('')

  const loadData = useCallback(async (options?: { quiet?: boolean }) => {
    const c = comandaRef.current
    if (!c) return
    const quiet = options?.quiet ?? false
    if (quiet) {
      setQuietRefreshing(true)
    } else {
      lastSavedDraftFingerprintRef.current = null
      setLoading(true)
      setError(null)
    }

    if (demoMode) {
      if (quiet) {
        setQuietRefreshing(false)
        return
      }
      const catalog = getDemoServicosCatalogo(c.barbearia_id)
      setServicosCatalogo(catalog)
      setEstoqueList(getDemoEstoqueParaComanda())

      if (c.id === COMANDA_DEMO_ID_FECHADA) {
        const st = getDemoEditorStateFechada(c.barbearia_id)
        setServicoQty(st.servicoQty)
        setProdutoLinhas(st.produtoLinhas)
        setCommittedProduto(st.committed)
      } else {
        const qty: Record<string, number> = {}
        for (const s of catalog) qty[s.id] = 0
        Object.assign(qty, getDemoServicoQtyInicial())
        setServicoQty(qty)
        const { linhas, committed } = getDemoProdutoLinhasIniciais()
        setProdutoLinhas(linhas)
        setCommittedProduto(committed)
      }

      setMesa(c.mesa ?? '')
      setDescontoModo(c.desconto_modo)
      setDescontoValor(
        c.desconto_modo === 'nenhum' ? '' : String(num(c.desconto_valor)),
      )
      setTaxaServicoAplicar(c.taxa_servico_aplicar)
      setTaxaServicoPct(String(num(c.taxa_servico_percentual) || 10))
      setFormaPagamento((c.forma_pagamento as ComandaFormaPagamento) || '')
      setBuscaProduto('')
      setCategoriaFiltroEstoque('todas')
      setLoading(false)
      return
    }

    const supabase = createClient()

    const [{ data: servRows, error: e1 }, { data: estRows, error: e2 }, { data: linS, error: e3 }, { data: linP, error: e4 }] =
      await Promise.all([
        supabase.from('servicos').select('*').eq('barbearia_id', c.barbearia_id).eq('ativo', true).order('nome'),
        supabase.from('estoque_produtos').select('*').eq('barbearia_id', c.barbearia_id).order('nome'),
        supabase.from('comanda_servicos').select('*').eq('comanda_id', c.id),
        supabase.from('comanda_produtos').select('*').eq('comanda_id', c.id),
      ])

    if (e1 || e2 || e3 || e4) {
      setError('Não foi possível carregar dados da comanda. Verifique se o script 032_comandas_estoque.sql foi aplicado no Supabase.')
      if (!quiet) setLoading(false)
      setQuietRefreshing(false)
      return
    }

    setServicosCatalogo((servRows ?? []) as Servico[])
    setEstoqueList((estRows ?? []).map((r) => mapEstoqueRowToProduto(r as EstoqueProdutoRow)))

    const qtyMap: Record<string, number> = {}
    for (const s of servRows ?? []) {
      qtyMap[(s as Servico).id] = 0
    }
    for (const row of linS ?? []) {
      const sid = row.servico_id as string | null
      if (sid) qtyMap[sid] = Math.max(1, Math.floor(num(row.quantidade)))
    }
    if ((linS ?? []).length === 0 && c.agendamento?.servico_id) {
      const sid = c.agendamento.servico_id
      if (sid && qtyMap[sid] !== undefined) qtyMap[sid] = Math.max(qtyMap[sid], 1)
    }
    setServicoQty(qtyMap)

    const committed: Record<string, number> = {}
    for (const row of linP ?? []) {
      const pid = row.produto_estoque_id as string
      const q = Math.max(0, Math.floor(num(row.quantidade)))
      committed[pid] = (committed[pid] ?? 0) + q
    }
    setCommittedProduto(committed)

    setProdutoLinhas(
      (linP ?? []).map((row) => ({
        produtoEstoqueId: row.produto_estoque_id as string,
        nome: row.nome as string,
        precoUnitario: num(row.preco_unitario),
        quantidade: Math.max(1, Math.floor(num(row.quantidade))),
      })),
    )

    setMesa(c.mesa ?? '')
    setDescontoModo(c.desconto_modo)
    setDescontoValor(
      c.desconto_modo === 'nenhum' ? '' : String(num(c.desconto_valor)),
    )
    setTaxaServicoAplicar(c.taxa_servico_aplicar)
    setTaxaServicoPct(String(num(c.taxa_servico_percentual) || 10))
    setFormaPagamento((c.forma_pagamento as ComandaFormaPagamento) || '')
    setBuscaProduto('')
    setCategoriaFiltroEstoque('todas')

    if (!quiet) setLoading(false)
    setQuietRefreshing(false)
  }, [demoMode])

  useEffect(() => {
    if (open && comanda) void loadData()
  }, [open, comanda, demoMode, loadData])

  const subtotalServicos = useMemo(() => {
    let t = 0
    for (const s of servicosCatalogo) {
      const q = servicoQty[s.id] ?? 0
      if (q > 0) t += q * num(s.preco)
    }
    return t
  }, [servicosCatalogo, servicoQty])

  const subtotalProdutos = useMemo(() => {
    return produtoLinhas.reduce((acc, l) => acc + l.quantidade * l.precoUnitario, 0)
  }, [produtoLinhas])

  const totais = useMemo(() => {
    const dv = parseFloat(descontoValor.replace(',', '.')) || 0
    return calcularTotaisComanda({
      subtotalServicos,
      subtotalProdutos,
      descontoModo,
      descontoValor: dv,
      taxaServicoAplicar,
      taxaServicoPercentual: parseFloat(taxaServicoPct.replace(',', '.')) || 0,
    })
  }, [
    subtotalServicos,
    subtotalProdutos,
    descontoModo,
    descontoValor,
    taxaServicoAplicar,
    taxaServicoPct,
  ])

  /** Lista do catálogo (inclui esgotados) para chips, grupos e linhas “+ Add”. */
  const produtosPickerLista = useMemo(() => {
    const q = buscaProduto.trim().toLowerCase()
    return estoqueList.filter((p) => {
      if (categoriaFiltroEstoque !== 'todas' && p.categoria !== categoriaFiltroEstoque) return false
      if (q && !p.nome.toLowerCase().includes(q) && !p.categoria.toLowerCase().includes(q)) return false
      return true
    })
  }, [estoqueList, buscaProduto, categoriaFiltroEstoque])

  const categoriasEstoque = useMemo(() => {
    const s = new Set<string>()
    for (const p of estoqueList) s.add(p.categoria)
    return [...s].sort((a, b) => a.localeCompare(b, 'pt'))
  }, [estoqueList])

  const produtosPorCategoriaPicker = useMemo(() => {
    const map = new Map<string, EstoqueProduto[]>()
    for (const p of produtosPickerLista) {
      const arr = map.get(p.categoria) ?? []
      arr.push(p)
      map.set(p.categoria, arr)
    }
    for (const arr of map.values()) arr.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'))
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt'))
  }, [produtosPickerLista])

  const servicosLinhasAtivas = useMemo(() => {
    return servicosCatalogo
      .map((s) => ({ s, q: servicoQty[s.id] ?? 0 }))
      .filter(({ q }) => q > 0)
  }, [servicosCatalogo, servicoQty])

  const qtyProdutoNaComanda = useMemo(() => {
    const m: Record<string, number> = {}
    for (const l of produtoLinhas) {
      m[l.produtoEstoqueId] = (m[l.produtoEstoqueId] ?? 0) + l.quantidade
    }
    return m
  }, [produtoLinhas])

  const totalUnidadesProdutos = useMemo(
    () => produtoLinhas.reduce((acc, l) => acc + l.quantidade, 0),
    [produtoLinhas],
  )

  const setServicoQuantidade = (servicoId: string, value: number) => {
    setServicoQty((prev) => ({ ...prev, [servicoId]: Math.max(0, Math.floor(value)) }))
  }

  const adjustProdutoQuantidade = useCallback((p: EstoqueProduto, delta: number) => {
    if (delta === 0) return
    const committed = committedProduto[p.id] ?? 0
    setProdutoLinhas((prev) => {
      const { next, feedback } = planAjusteProdutoLinhas(prev, p, delta, {
        committedNaComanda: committed,
        demoMode,
      })
      if (feedback) {
        queueMicrotask(() => toast(feedback))
      }
      return next
    })
  }, [committedProduto, demoMode])

  const setProdutoQty = (index: number, q: number) => {
    setProdutoLinhas((prev) => {
      if (!prev[index]) return prev
      const pid = prev[index].produtoEstoqueId
      const est = estoqueList.find((e) => e.id === pid)
      const db = est?.quantidade ?? 0
      const maxLinha = demoMode ? 9999 : db + (committedProduto[pid] ?? 0)
      const requested = Math.floor(q)
      const n = Math.min(maxLinha, Math.max(0, requested))
      if (!demoMode && requested > maxLinha) {
        queueMicrotask(() =>
          toast({
            variant: 'destructive',
            title: 'Quantidade máxima',
            description: `Máximo disponível na comanda: ${maxLinha} unidade(s).`,
          }),
        )
      }
      if (n <= 0) return prev.filter((_, i) => i !== index)
      const next = [...prev]
      next[index] = { ...next[index], quantidade: n }
      return next
    })
  }

  const removeProdutoLinha = (index: number) => {
    setProdutoLinhas((prev) => prev.filter((_, i) => i !== index))
  }

  const montarPayloadServicos = () => {
    return servicosCatalogo
      .filter((s) => (servicoQty[s.id] ?? 0) > 0)
      .map((s) => ({
        servico_id: s.id,
        nome: s.nome,
        preco_unitario: num(s.preco),
        quantidade: servicoQty[s.id] ?? 0,
      }))
  }

  const montarPayloadProdutos = () => {
    return produtoLinhas.map((l) => ({
      produto_estoque_id: l.produtoEstoqueId,
      nome: l.nome,
      preco_unitario: l.precoUnitario,
      quantidade: l.quantidade,
    }))
  }

  const persistirCabecalho = async () => {
    if (!comanda) return
    const supabase = createClient()
    const dv = parseFloat(descontoValor.replace(',', '.')) || 0
    const { error: e } = await supabase
      .from('comandas')
      .update({
        mesa: mesa.trim() || null,
        desconto_modo: descontoModo,
        desconto_valor: dv,
        taxa_servico_aplicar: taxaServicoAplicar,
        taxa_servico_percentual: parseFloat(taxaServicoPct.replace(',', '.')) || 10,
        forma_pagamento: formaPagamento || null,
      })
      .eq('id', comanda.id)
    if (e) {
      throw new Error(toUserFriendlyErrorMessage(e, { fallback: 'Não foi possível salvar o cabeçalho da comanda.' }))
    }
  }

  const draftFingerprint = useMemo(
    () =>
      JSON.stringify({
        servicos: montarPayloadServicos(),
        produtos: montarPayloadProdutos(),
        mesa: mesa.trim(),
        descontoModo,
        descontoValor,
        taxaServicoAplicar,
        taxaServicoPct,
        formaPagamento: formaPagamento || '',
      }),
    [
      servicosCatalogo,
      servicoQty,
      produtoLinhas,
      mesa,
      descontoModo,
      descontoValor,
      taxaServicoAplicar,
      taxaServicoPct,
      formaPagamento,
    ],
  )

  useLayoutEffect(() => {
    draftFingerprintRef.current = draftFingerprint
  }, [draftFingerprint])

  /** Persiste linhas + cabeçalho; `quietLoad` evita spinner de carregamento completo (auto-save). */
  const performPersist = async (quietLoad: boolean): Promise<boolean> => {
    const c = comandaRef.current
    if (!c || demoMode) return true
    if (c.status !== 'aberta' && c.status !== 'fechada' && c.status !== 'cancelada') return true
    try {
      const supabase = createClient()
      const sync = await syncComandaLinhas(supabase, c.id, montarPayloadServicos(), montarPayloadProdutos())
      if (!sync.ok) {
        setError(toUserFriendlyErrorMessage(sync.message, { fallback: 'Não foi possível salvar a comanda.' }))
        return false
      }
      await persistirCabecalho()
      if (c.status === 'cancelada') {
        const { error: reativaE } = await supabase
          .from('comandas')
          .update({ status: 'aberta' })
          .eq('id', c.id)
        if (reativaE) {
          setError(toUserFriendlyErrorMessage(reativaE, { fallback: 'Não foi possível reativar a comanda.' }))
          return false
        }
      }
      await loadData({ quiet: quietLoad })
      onSaved()
      lastSavedDraftFingerprintRef.current = draftFingerprintRef.current
      return true
    } catch (err) {
      setError(toUserFriendlyErrorMessage(err, { fallback: 'Erro ao salvar.' }))
      return false
    }
  }

  const performPersistRef = useRef(performPersist)
  performPersistRef.current = performPersist

  useEffect(() => {
    if (!open || demoMode) return
    if (loading || quietRefreshing || saving) return
    if (lastSavedDraftFingerprintRef.current === null) {
      lastSavedDraftFingerprintRef.current = draftFingerprint
      return
    }
    if (draftFingerprint === lastSavedDraftFingerprintRef.current) return
    const t = window.setTimeout(() => {
      void (async () => {
        if (demoMode) return
        const c = comandaRef.current
        if (!c || (c.status !== 'aberta' && c.status !== 'fechada' && c.status !== 'cancelada')) return
        if ((c.status === 'fechada' || c.status === 'cancelada') && !modoCorrecaoFechadaCancelada) return
        setAutoSaveState('saving')
        setError(null)
        const ok = await performPersistRef.current(true)
        if (ok) {
          setAutoSaveState('saved')
          window.setTimeout(() => setAutoSaveState((s) => (s === 'saved' ? 'idle' : s)), 1800)
        } else {
          setAutoSaveState('idle')
        }
      })()
    }, 1000)
    return () => window.clearTimeout(t)
  }, [
    draftFingerprint,
    open,
    demoMode,
    loading,
    quietRefreshing,
    saving,
    comanda?.id,
    modoCorrecaoFechadaCancelada,
  ])

  useEffect(() => {
    lastSavedDraftFingerprintRef.current = null
  }, [comanda?.id])

  useEffect(() => {
    setModoCorrecaoFechadaCancelada(false)
  }, [comanda?.id, open])

  const handleSalvar = async () => {
    if (demoMode) {
      setError('Desative "Dados fictícios" na página de comandas para salvar no sistema.')
      return
    }
    if (
      !comanda ||
      (comanda.status !== 'aberta' &&
        comanda.status !== 'fechada' &&
        comanda.status !== 'cancelada')
    ) {
      return
    }
    if (
      (comanda.status === 'fechada' || comanda.status === 'cancelada') &&
      !modoCorrecaoFechadaCancelada
    ) {
      return
    }
    setSaving(true)
    setError(null)
    await performPersist(false)
    setSaving(false)
  }

  const handleFecharComanda = async () => {
    if (demoMode) {
      setError('Desative "Dados fictícios" para fechar comandas reais.')
      return
    }
    if (!comanda || comanda.status !== 'aberta') return
    if (!formaPagamento) {
      setError('Selecione a forma de pagamento para fechar a comanda.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const sync = await syncComandaLinhas(supabase, comanda.id, montarPayloadServicos(), montarPayloadProdutos())
      if (!sync.ok) {
        setError(toUserFriendlyErrorMessage(sync.message, { fallback: 'Não foi possível salvar a comanda.' }))
        setSaving(false)
        return
      }
      await persistirCabecalho()
      if (comanda.agendamento_id) {
        const { error: eAg } = await supabase
          .from('agendamentos')
          .update({ status: 'concluido' })
          .eq('id', comanda.agendamento_id)
          .in('status', ['agendado', 'em_atendimento'])
        if (eAg) {
          throw new Error(
            toUserFriendlyErrorMessage(eAg, {
              fallback: 'Não foi possível marcar o agendamento como concluído.',
            }),
          )
        }
      }
      const { error: e } = await supabase.from('comandas').update({ status: 'fechada' }).eq('id', comanda.id)
      if (e) {
        throw new Error(toUserFriendlyErrorMessage(e, { fallback: 'Não foi possível fechar a comanda.' }))
      }
      toast({
        title: 'Comanda fechada',
        description: 'Pagamento e linhas registrados; estoque atualizado.',
      })
      await loadData()
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setError(toUserFriendlyErrorMessage(err, { fallback: 'Erro ao fechar.' }))
    }
    setSaving(false)
  }

  const handleCancelarComanda = async () => {
    if (demoMode) {
      setError('Desative "Dados fictícios" para cancelar comandas reais.')
      return
    }
    if (!comanda || comanda.status !== 'aberta') return
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const r = await restaurarEstoqueELimparProdutosComanda(supabase, comanda.id)
      if (!r.ok) {
        setError(toUserFriendlyErrorMessage(r.message, { fallback: 'Não foi possível cancelar a comanda.' }))
        setSaving(false)
        return
      }
      const { error: e } = await supabase.from('comandas').update({ status: 'cancelada' }).eq('id', comanda.id)
      if (e) {
        throw new Error(toUserFriendlyErrorMessage(e, { fallback: 'Não foi possível cancelar a comanda.' }))
      }
      onSaved()
      onOpenChange(false)
    } catch (err) {
      setError(toUserFriendlyErrorMessage(err, { fallback: 'Erro ao cancelar.' }))
    }
    setSaving(false)
  }

  const statusBadge = (s: string) => {
    if (s === 'aberta') return <Badge className="bg-amber-600 hover:bg-amber-600">Aberta</Badge>
    if (s === 'fechada') return <Badge variant="secondary">Fechada</Badge>
    return <Badge variant="destructive">Cancelada</Badge>
  }

  const podeEditar =
    comanda != null &&
    (comanda.status === 'aberta' ||
      ((comanda.status === 'fechada' || comanda.status === 'cancelada') && modoCorrecaoFechadaCancelada))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        hideCloseButton
        className="flex h-full w-full max-h-[100dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl md:max-w-2xl"
      >
        {!comanda ? null : (
          <div className="flex min-h-0 flex-1 flex-col">
            <SheetHeader className="shrink-0 space-y-2 border-b border-border/80 px-4 py-3 text-left sm:px-5 sm:py-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <SheetClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 min-h-11 w-11 min-w-11 shrink-0 touch-manipulation sm:h-10 sm:min-h-10 sm:w-10 sm:min-w-10"
                    aria-label="Voltar"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                </SheetClose>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <SheetTitle className="m-0 text-base font-semibold leading-tight sm:text-lg">
                    Comanda #{comanda.numero}
                  </SheetTitle>
                  {statusBadge(comanda.status)}
                  {demoMode ? (
                    <Badge variant="outline" className="shrink-0 font-normal">
                      Demonstração
                    </Badge>
                  ) : null}
                </div>
                {!demoMode && comanda && (comanda.status === 'fechada' || comanda.status === 'cancelada') ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-11 min-h-11 w-11 min-w-11 shrink-0 touch-manipulation sm:h-10 sm:min-h-10 sm:w-10 sm:min-w-10',
                          modoCorrecaoFechadaCancelada &&
                            'bg-primary/12 text-primary shadow-sm dark:bg-primary/20 dark:text-primary',
                        )}
                        aria-pressed={modoCorrecaoFechadaCancelada}
                        aria-label={
                          modoCorrecaoFechadaCancelada
                            ? 'Desativar edição da comanda'
                            : 'Permitir alterar comanda fechada ou cancelada'
                        }
                        onClick={() => setModoCorrecaoFechadaCancelada((v) => !v)}
                      >
                        <Pencil className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={6} className="max-w-[16rem]">
                      {modoCorrecaoFechadaCancelada
                        ? 'Toque de novo para só visualizar (sem alterar).'
                        : 'Ative para corrigir lançamentos: serviços, produtos, desconto, taxa e pagamento.'}
                    </TooltipContent>
                  </Tooltip>
                ) : null}
                {!demoMode &&
                comanda &&
                (comanda.status === 'aberta' ||
                  comanda.status === 'fechada' ||
                  comanda.status === 'cancelada') ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-11 min-h-11 w-11 min-w-11 shrink-0 touch-manipulation sm:h-10 sm:min-h-10 sm:w-10 sm:min-w-10"
                        aria-label="Menu da comanda"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem
                        disabled={saving || !podeEditar}
                        onClick={() => void handleSalvar()}
                      >
                        Salvar agora
                      </DropdownMenuItem>
                      {comanda.status === 'aberta' ? (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={saving}
                            onClick={() => void handleCancelarComanda()}
                          >
                            Cancelar comanda
                          </DropdownMenuItem>
                        </>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
              <SheetDescription asChild>
                <p className="text-sm text-muted-foreground sm:ml-10">
                  <span className="font-medium text-foreground">{comanda.barbeiro?.nome ?? 'Barbeiro'}</span>
                  <span className="text-muted-foreground"> · </span>
                  <span>
                    Cliente: <span className="font-medium text-foreground">{comanda.cliente?.nome ?? '—'}</span>
                  </span>
                </p>
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
              {loading ? (
                <div className="flex justify-center py-16">
                  <Spinner className="h-8 w-8 text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {demoMode ? (
                    <Alert variant="info">
                      <AlertTitle>
                        Modo demonstração: você pode alterar quantidades, desconto e taxa para ver o total atualizar.
                        Nada é gravado — desligue &quot;Dados fictícios&quot; na página de comandas para usar comandas
                        reais.
                      </AlertTitle>
                    </Alert>
                  ) : null}
                  {!demoMode && comanda.status === 'fechada' ? (
                    <Alert variant="neutral">
                      <AlertTitle>
                        Comanda fechada: use o lápis no topo para habilitar alterações (serviços, produtos, desconto,
                        taxa e forma de pagamento). Ao salvar, o estoque é recalculado em relação às linhas anteriores.
                      </AlertTitle>
                    </Alert>
                  ) : null}
                  {!demoMode && comanda.status === 'cancelada' ? (
                    <Alert variant="warning">
                      <AlertTitle>
                        Comanda cancelada: use o lápis no topo para habilitar correções. Ao salvar, as linhas são
                        gravadas, o estoque é ajustado e a comanda volta para o status Aberta para você poder fechar
                        novamente se precisar.
                      </AlertTitle>
                    </Alert>
                  ) : null}
                  {error ? (
                    <Alert variant="danger">
                      <AlertTitle>{error}</AlertTitle>
                    </Alert>
                  ) : null}

                  <div className="space-y-1.5">
                    <Label htmlFor="comanda-mesa" className="text-xs text-muted-foreground">
                      Mesa / estação (opcional)
                    </Label>
                    <Input
                      id="comanda-mesa"
                      value={mesa}
                      onChange={(e) => setMesa(e.target.value)}
                      placeholder="Ex.: Cadeira 2"
                      disabled={!podeEditar}
                      className="h-9"
                    />
                  </div>

                  <Collapsible defaultOpen className="border-b border-border/80 pb-1">
                    <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 py-2.5 text-left [&[data-state=open]>svg]:rotate-180">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
                        Serviços ({servicosLinhasAtivas.length})
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pb-3">
                      <div className="rounded-lg border border-border/80 bg-card">
                        {servicosLinhasAtivas.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground">
                            Nenhum serviço na comanda. Inclua pelo catálogo abaixo.
                          </p>
                        ) : (
                          servicosLinhasAtivas.map(({ s, q }) => {
                            const unit = num(s.preco)
                            const line = q * unit
                            return (
                              <div
                                key={s.id}
                                className="flex gap-3 border-b border-border/60 p-3 last:border-0"
                              >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <ServicoAgendaIcon nome={s.nome} className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold leading-tight">{s.nome}</p>
                                  <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                                    {q}× {formatCurrency(unit)} ={' '}
                                    <span className="font-medium text-foreground">{formatCurrency(line)}</span>
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                                  disabled={!podeEditar}
                                  aria-label={`Remover ${s.nome} da comanda`}
                                  onClick={() => setServicoQuantidade(s.id, 0)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )
                          })
                        )}
                      </div>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal serviços</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(subtotalServicos)}</span>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible defaultOpen className="border-b border-border/80 pb-1">
                    <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 py-2.5 text-left [&[data-state=open]>svg]:rotate-180">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
                        Adicionar serviços (catálogo)
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pb-3">
                      <div className="space-y-0 rounded-lg border border-border/80">
                        {servicosCatalogo.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground">Cadastre serviços em Serviços.</p>
                        ) : (
                          servicosCatalogo.map((s) => {
                            const q = servicoQty[s.id] ?? 0
                            return (
                              <div
                                key={s.id}
                                className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 p-3 last:border-0"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium">{s.nome}</p>
                                  <p className="text-xs text-muted-foreground">{formatCurrency(num(s.preco))} / un.</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    disabled={!podeEditar}
                                    onClick={() => setServicoQuantidade(s.id, q - 1)}
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </Button>
                                  <span className="w-8 text-center text-sm font-medium tabular-nums">{q}</span>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    disabled={!podeEditar}
                                    onClick={() => setServicoQuantidade(s.id, q + 1)}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Collapsible defaultOpen className="border-b border-border/80 pb-1">
                    <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 py-2.5 text-left [&[data-state=open]>svg]:rotate-180">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">
                        Produtos selecionados ({totalUnidadesProdutos})
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pb-3">
                      <div className="rounded-lg border border-border/80 bg-card">
                        {produtoLinhas.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground">Nenhum produto na comanda.</p>
                        ) : (
                          produtoLinhas.map((l, i) => {
                            const est = estoqueList.find((e) => e.id === l.produtoEstoqueId)
                            const categoria = est?.categoria ?? ''
                            const Icon = estoqueIconeCategoria(categoria)
                            const circleBg = estoqueCirculoCategoriaClass(categoria)
                            const db = est?.quantidade ?? 0
                            const maxLinha = demoMode ? 9999 : db + (committedProduto[l.produtoEstoqueId] ?? 0)
                            const line = l.quantidade * l.precoUnitario
                            return (
                              <div
                                key={`${l.produtoEstoqueId}-${i}`}
                                className="flex flex-wrap items-start gap-3 border-b border-border/60 p-3 last:border-0"
                              >
                                <div
                                  className={cn(
                                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                                    circleBg,
                                  )}
                                >
                                  <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold leading-tight">{l.nome}</p>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <QuantityStepper
                                      value={l.quantidade}
                                      max={maxLinha}
                                      onChange={(val) => setProdutoQty(i, val)}
                                      onRemove={() => removeProdutoLinha(i)}
                                      disabled={!podeEditar}
                                      aria-label={`Quantidade de ${l.nome} na comanda`}
                                    />
                                    <p className="text-xs tabular-nums text-muted-foreground">
                                      {l.quantidade}× {formatCurrency(l.precoUnitario)} ={' '}
                                      <span className="font-medium text-foreground">{formatCurrency(line)}</span>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal produtos</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(subtotalProdutos)}</span>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="space-y-3 border-b border-border/80 pb-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-foreground">
                      Adicionar produtos do estoque
                    </p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="h-10 pl-9"
                        placeholder="Buscar produto..."
                        value={buscaProduto}
                        onChange={(e) => setBuscaProduto(e.target.value)}
                        disabled={!podeEditar}
                      />
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <Button
                        type="button"
                        size="sm"
                        variant={categoriaFiltroEstoque === 'todas' ? 'default' : 'outline'}
                        className="shrink-0 rounded-full text-xs"
                        onClick={() => setCategoriaFiltroEstoque('todas')}
                      >
                        Todas
                      </Button>
                      {categoriasEstoque.map((cat) => (
                        <Button
                          key={cat}
                          type="button"
                          size="sm"
                          variant={categoriaFiltroEstoque === cat ? 'default' : 'outline'}
                          className="shrink-0 rounded-full text-xs capitalize"
                          onClick={() => setCategoriaFiltroEstoque(cat)}
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
                    <div className="space-y-4">
                      {estoqueList.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Cadastre produtos em Estoque.</p>
                      ) : produtosPickerLista.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum produto encontrado.</p>
                      ) : (
                        produtosPorCategoriaPicker.map(([categoria, lista]) => (
                          <div key={categoria}>
                            <p className="mb-2 border-b border-border/60 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                              {categoria}
                            </p>
                            <div className="rounded-lg border border-border/80">
                              {lista.map((p) => {
                                const committed = committedProduto[p.id] ?? 0
                                const maxTotal = demoMode ? 9999 : p.quantidade + committed
                                const precoExibir = p.precoVenda > 0 ? p.precoVenda : p.precoCusto ?? 0
                                const qNa = qtyProdutoNaComanda[p.id] ?? 0
                                return (
                                  <ProdutoCatalogo
                                    key={p.id}
                                    id={p.id}
                                    nome={p.nome}
                                    categoria={p.categoria}
                                    precoVenda={p.precoVenda}
                                    precoExibir={precoExibir}
                                    quantidadeEstoque={p.quantidade}
                                    quantidadeMaximaNaComanda={maxTotal}
                                    quantidadeNaComanda={qNa}
                                    onAdd={() => adjustProdutoQuantidade(p, 1)}
                                    onUpdateQuantidade={(qtd) => adjustProdutoQuantidade(p, qtd - qNa)}
                                    disabled={!podeEditar}
                                    ignoraEsgotado={demoMode}
                                  />
                                )
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 border-b border-border/80 pb-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-foreground">Desconto</p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Select
                          value={descontoModo}
                          onValueChange={(v) => setDescontoModo(v as ComandaDescontoModo)}
                          disabled={!podeEditar}
                        >
                          <SelectTrigger className="h-10 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nenhum">Nenhum</SelectItem>
                            <SelectItem value="percentual">Percentual (%)</SelectItem>
                            <SelectItem value="fixo">Valor fixo (R$)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {descontoModo !== 'nenhum' ? (
                        <Input
                          className="h-10 sm:max-w-[8rem]"
                          inputMode="decimal"
                          placeholder={descontoModo === 'percentual' ? '%' : 'R$'}
                          value={descontoValor}
                          onChange={(e) => setDescontoValor(e.target.value)}
                          disabled={!podeEditar}
                        />
                      ) : (
                        <div className="flex h-10 items-center rounded-md border border-border/80 bg-muted/30 px-3 text-sm tabular-nums text-muted-foreground sm:max-w-[8rem]">
                          {formatCurrency(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="taxa-serv"
                          checked={taxaServicoAplicar}
                          onCheckedChange={(c) => setTaxaServicoAplicar(c === true)}
                          disabled={!podeEditar}
                        />
                        <Label htmlFor="taxa-serv" className="text-sm font-normal leading-none">
                          Taxa de serviço ({taxaServicoPct.replace(',', '.') || '0'}%)
                        </Label>
                      </div>
                      <Input
                        className="ml-auto h-9 w-16"
                        inputMode="decimal"
                        value={taxaServicoPct}
                        onChange={(e) => setTaxaServicoPct(e.target.value)}
                        disabled={!taxaServicoAplicar || !podeEditar}
                        aria-label="Percentual da taxa de serviço"
                      />
                      <span className="w-full text-right text-sm font-medium tabular-nums sm:ml-auto sm:w-auto">
                        {taxaServicoAplicar ? formatCurrency(totais.valorTaxaServico) : formatCurrency(0)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-foreground">
                      Forma de pagamento
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(
                        [
                          { id: 'dinheiro' as const, label: 'Dinheiro', Icon: Banknote },
                          { id: 'pix' as const, label: 'Pix', Icon: Smartphone },
                          { id: 'cartao_debito' as const, label: 'Débito', Icon: CreditCard },
                          { id: 'cartao_credito' as const, label: 'Crédito', Icon: CreditCard },
                        ] as const
                      ).map(({ id, label, Icon }) => (
                        <Button
                          key={id}
                          type="button"
                          variant={formaPagamento === id ? 'default' : 'outline'}
                          className="h-auto min-h-11 flex-col gap-1 py-3 text-xs font-medium touch-manipulation"
                          disabled={!podeEditar}
                          onClick={() => setFormaPagamento(id)}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!loading ? (
            <div className="shrink-0 space-y-3 border-t border-border/80 bg-background/95 px-4 py-3 shadow-[0_-6px_20px_-8px_rgba(0,0,0,0.12)] sm:px-5">
              <ResumoComanda
                key={comanda.id}
                subtotalServicos={totais.subtotalServicos}
                subtotalProdutos={totais.subtotalProdutos}
                desconto={totais.valorDesconto}
                taxaServico={totais.valorTaxaServico}
                total={totais.totalFinal}
                isSaving={saving}
                autoSaveState={autoSaveState}
                persistExpandedStorageKey="barber-app:resumo-comanda-expanded"
              />
              {comanda.status === 'aberta' ? (
                <Button
                  type="button"
                  className="min-h-11 w-full touch-manipulation bg-amber-600 font-semibold text-white hover:bg-amber-700 active:bg-amber-800 dark:bg-amber-600 dark:text-white dark:hover:bg-amber-500"
                  disabled={saving || demoMode}
                  title={
                    demoMode
                      ? 'Desative dados fictícios na página de comandas para fechar comanda real'
                      : undefined
                  }
                  onClick={() => void handleFecharComanda()}
                >
                  {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  Fechar e cobrar
                </Button>
              ) : comanda.status === 'fechada' || comanda.status === 'cancelada' ? (
                <Button
                  type="button"
                  className="min-h-11 w-full touch-manipulation font-semibold"
                  variant="default"
                  disabled={saving || demoMode || !podeEditar}
                  title={
                    !podeEditar && !demoMode
                      ? 'Toque no lápis no topo da comanda para habilitar alterações'
                      : undefined
                  }
                  onClick={() => void handleSalvar()}
                >
                  {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
                  {comanda.status === 'fechada' ? 'Salvar alterações' : 'Salvar e reativar'}
                </Button>
              ) : null}

              <div className="pb-[env(safe-area-inset-bottom)]" />
            </div>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
