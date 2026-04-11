'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  COMANDA_DEMO_ID_FECHADA,
  getDemoEditorStateFechada,
  getDemoEstoqueParaComanda,
  getDemoProdutoLinhasIniciais,
  getDemoServicoQtyInicial,
  getDemoServicosCatalogo,
} from '@/lib/comanda-demo-data'
import { calcularTotaisComanda } from '@/lib/comanda-totais'
import { mapEstoqueRowToProduto, type EstoqueProdutoRow } from '@/lib/map-estoque-produto'
import { restaurarEstoqueELimparProdutosComanda, syncComandaLinhas } from '@/lib/sync-comanda-linhas'
import { toUserFriendlyErrorMessage } from '@/lib/to-user-friendly-error'
import { estoqueCirculoCategoriaClass, estoqueIconeCategoria } from '@/lib/estoque-categoria-icons'
import { formatCurrency, formatTime } from '@/lib/constants'
import { Button } from '@/components/ui/button'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ResumoComanda } from '@/components/domain/resumo-comanda'
import { cn } from '@/lib/utils'
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
  /** Quantidade já reservada na comanda ao abrir (para calcular teto: estoque DB + committed). */
  const [committedProduto, setCommittedProduto] = useState<Record<string, number>>({})

  const comandaRef = useRef(comanda)
  comandaRef.current = comanda

  const loadData = useCallback(async () => {
    const c = comandaRef.current
    if (!c) return
    setLoading(true)
    setError(null)

    if (demoMode) {
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
      setLoading(false)
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

    setLoading(false)
  }, [demoMode])

  useEffect(() => {
    if (open && comanda) void loadData()
  }, [open, comanda?.id, demoMode, loadData])

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

  const produtosFiltrados = useMemo(() => {
    const q = buscaProduto.trim().toLowerCase()
    return estoqueList.filter((p) => {
      if (!demoMode && p.quantidade <= 0) return false
      if (q && !p.nome.toLowerCase().includes(q) && !p.categoria.toLowerCase().includes(q)) return false
      return true
    })
  }, [estoqueList, buscaProduto, demoMode])

  const setServicoQuantidade = (servicoId: string, value: number) => {
    setServicoQty((prev) => ({ ...prev, [servicoId]: Math.max(0, Math.floor(value)) }))
  }

  const addProduto = (p: EstoqueProduto) => {
    const preco = p.precoVenda > 0 ? p.precoVenda : p.precoCusto ?? 0
    const committed = committedProduto[p.id] ?? 0
    const maxTotal = demoMode ? 9999 : p.quantidade + committed
    setProdutoLinhas((prev) => {
      const i = prev.findIndex((x) => x.produtoEstoqueId === p.id)
      if (i >= 0) {
        const next = [...prev]
        next[i] = {
          ...next[i],
          quantidade: Math.min(maxTotal, next[i].quantidade + 1),
        }
        return next
      }
      if (maxTotal < 1) return prev
      return [...prev, { produtoEstoqueId: p.id, nome: p.nome, precoUnitario: preco, quantidade: 1 }]
    })
  }

  const setProdutoQty = (index: number, q: number) => {
    setProdutoLinhas((prev) => {
      const next = [...prev]
      if (!next[index]) return prev
      const pid = next[index].produtoEstoqueId
      const est = estoqueList.find((e) => e.id === pid)
      const db = est?.quantidade ?? 0
      const maxLinha = demoMode ? 9999 : db + (committedProduto[pid] ?? 0)
      next[index] = { ...next[index], quantidade: Math.max(1, Math.min(maxLinha, Math.floor(q))) }
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

  const handleSalvar = async () => {
    if (demoMode) {
      setError('Desative "Dados fictícios" na página de comandas para salvar no sistema.')
      return
    }
    if (!comanda || comanda.status !== 'aberta') return
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
      await loadData()
      onSaved()
    } catch (err) {
      setError(toUserFriendlyErrorMessage(err, { fallback: 'Erro ao salvar.' }))
    }
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
      const { error: e } = await supabase.from('comandas').update({ status: 'fechada' }).eq('id', comanda.id)
      if (e) {
        throw new Error(toUserFriendlyErrorMessage(e, { fallback: 'Não foi possível fechar a comanda.' }))
      }
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl md:max-w-2xl"
      >
        {!comanda ? null : (
          <>
            <SheetHeader className="border-b border-border/80 px-6 py-4 text-left">
              <SheetTitle className="flex flex-wrap items-center gap-2 pr-8">
                Comanda #{comanda.numero}
                {statusBadge(comanda.status)}
                {demoMode ? (
                  <Badge variant="outline" className="font-normal">
                    Demonstração
                  </Badge>
                ) : null}
              </SheetTitle>
              <SheetDescription asChild>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">{comanda.barbeiro?.nome ?? 'Barbeiro'}</span>
                    {' · '}
                    Cliente: <span className="font-medium text-foreground">{comanda.cliente?.nome ?? '—'}</span>
                  </p>
                  <p>
                    Início:{' '}
                    {new Date(comanda.horario_inicio).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {comanda.agendamento?.horario
                      ? ` · Agendamento ${formatTime(comanda.agendamento.horario)}`
                      : null}
                  </p>
                </div>
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
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
                  {error ? (
                    <Alert variant="danger">
                      <AlertTitle>{error}</AlertTitle>
                    </Alert>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="comanda-mesa">Mesa / estação (opcional)</Label>
                    <Input
                      id="comanda-mesa"
                      value={mesa}
                      onChange={(e) => setMesa(e.target.value)}
                      placeholder="Ex.: Cadeira 2"
                      disabled={comanda.status !== 'aberta'}
                    />
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Serviços (catálogo)</h3>
                    <div className="space-y-2 rounded-lg border border-border/80 p-3">
                      {servicosCatalogo.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Cadastre serviços em Serviços.</p>
                      ) : (
                        servicosCatalogo.map((s) => {
                          const q = servicoQty[s.id] ?? 0
                          return (
                            <div
                              key={s.id}
                              className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 py-2 last:border-0"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{s.nome}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(num(s.preco))} un.</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8"
                                  disabled={comanda.status !== 'aberta'}
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
                                  disabled={comanda.status !== 'aberta'}
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
                    <p className="mt-1 text-xs text-muted-foreground">
                      Subtotal serviços: {formatCurrency(subtotalServicos)}
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Produtos (estoque)</h3>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Buscar produto ou categoria..."
                        value={buscaProduto}
                        onChange={(e) => setBuscaProduto(e.target.value)}
                        disabled={comanda.status !== 'aberta'}
                      />
                    </div>
                    <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                      {produtosFiltrados.map((p) => {
                        const Icon = estoqueIconeCategoria(p.categoria)
                        const circleBg = estoqueCirculoCategoriaClass(p.categoria)
                        return (
                          <button
                            key={p.id}
                            type="button"
                            disabled={comanda.status !== 'aberta'}
                            onClick={() => addProduto(p)}
                            className={cn(
                              'flex flex-col items-center gap-1 rounded-lg border border-border/80 p-2 text-center transition-colors',
                              'hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50',
                            )}
                          >
                            <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', circleBg)}>
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <span className="line-clamp-2 text-[10px] font-medium leading-tight">{p.nome}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatCurrency(p.precoVenda > 0 ? p.precoVenda : p.precoCusto ?? 0)} · {p.quantidade} un.
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {produtoLinhas.length > 0 ? (
                      <div className="mt-3 space-y-2 rounded-lg border border-border/80 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Na comanda</p>
                        {produtoLinhas.map((l, i) => (
                          <div key={`${l.produtoEstoqueId}-${i}`} className="flex flex-wrap items-center gap-2 border-b border-border/50 py-2 last:border-0">
                            <span className="min-w-0 flex-1 text-sm">{l.nome}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                disabled={comanda.status !== 'aberta'}
                                onClick={() => setProdutoQty(i, l.quantidade - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-7 text-center text-sm tabular-nums">{l.quantidade}</span>
                              <Button
                                type="button"
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                disabled={comanda.status !== 'aberta'}
                                onClick={() => setProdutoQty(i, l.quantidade + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              disabled={comanda.status !== 'aberta'}
                              onClick={() => removeProdutoLinha(i)}
                            >
                              Remover
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Subtotal produtos: {formatCurrency(subtotalProdutos)}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Desconto</Label>
                      <Select
                        value={descontoModo}
                        onValueChange={(v) => setDescontoModo(v as ComandaDescontoModo)}
                        disabled={comanda.status !== 'aberta'}
                      >
                        <SelectTrigger>
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
                      <div className="space-y-2">
                        <Label>{descontoModo === 'percentual' ? 'Percentual' : 'Valor (R$)'}</Label>
                        <Input
                          inputMode="decimal"
                          value={descontoValor}
                          onChange={(e) => setDescontoValor(e.target.value)}
                          disabled={comanda.status !== 'aberta'}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="taxa-serv"
                      checked={taxaServicoAplicar}
                      onCheckedChange={(c) => setTaxaServicoAplicar(c === true)}
                      disabled={comanda.status !== 'aberta'}
                    />
                    <Label htmlFor="taxa-serv" className="text-sm font-normal">
                      Taxa de serviço (%)
                    </Label>
                    <Input
                      className="ml-auto w-20"
                      inputMode="decimal"
                      value={taxaServicoPct}
                      onChange={(e) => setTaxaServicoPct(e.target.value)}
                      disabled={!taxaServicoAplicar || comanda.status !== 'aberta'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Forma de pagamento</Label>
                    <Select
                      value={formaPagamento || 'none'}
                      onValueChange={(v) => setFormaPagamento(v === 'none' ? '' : (v as ComandaFormaPagamento))}
                      disabled={comanda.status !== 'aberta'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione ao fechar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">—</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="cartao_debito">Cartão débito</SelectItem>
                        <SelectItem value="cartao_credito">Cartão crédito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ResumoComanda
                    key={comanda.id}
                    subtotalServicos={totais.subtotalServicos}
                    subtotalProdutos={totais.subtotalProdutos}
                    desconto={totais.valorDesconto}
                    taxaServico={totais.valorTaxaServico}
                    total={totais.totalFinal}
                    isSaving={saving}
                    persistExpandedStorageKey="barber-app:comanda-resumo-expanded"
                  />

                  {comanda.status === 'aberta' ? (
                    <div className="flex flex-col gap-2 pb-8 sm:flex-row sm:flex-wrap">
                      <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Voltar
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void handleSalvar()}
                        disabled={saving || demoMode}
                        title={
                          demoMode
                            ? 'Desative dados fictícios na página de comandas para salvar'
                            : undefined
                        }
                      >
                        {saving ? <Spinner className="mr-2 h-4 w-4" /> : null}
                        Salvar linhas e dados
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => void handleFecharComanda()}
                        disabled={saving || demoMode}
                        title={
                          demoMode
                            ? 'Desative dados fictícios na página de comandas para fechar comanda real'
                            : undefined
                        }
                      >
                        Fechar comanda
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        className="sm:ml-auto"
                        onClick={() => void handleCancelarComanda()}
                        disabled={saving || demoMode}
                        title={
                          demoMode
                            ? 'Desative dados fictícios na página de comandas para cancelar comanda real'
                            : undefined
                        }
                      >
                        Cancelar comanda
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Fechar
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
