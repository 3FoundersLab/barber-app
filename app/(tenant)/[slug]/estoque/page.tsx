'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { LayoutList, Plus, Search } from 'lucide-react'
import { EstoqueProdutoCard } from '@/components/domain/estoque-produto-card'
import { PageContent } from '@/components/shared/page-container'
import { TenantPanelPageContainer, TenantPanelPageHeader } from '@/components/shared/tenant-panel-shell'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  ESTOQUE_CATEGORIAS_ORDEM,
  estoqueIconeCategoria,
} from '@/lib/estoque-categoria-icons'
import { ESTOQUE_PRODUTOS_MOCK } from '@/lib/estoque-produto-mock'
import { mapEstoqueRowToProduto, type EstoqueProdutoRow } from '@/lib/map-estoque-produto'
import { nivelEstoquePorQuantidade } from '@/lib/estoque-produto-utils'
import { createClient } from '@/lib/supabase/client'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import type { EstoqueProduto, EstoqueStatusFiltro } from '@/types/estoque-produto'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'

export default function TenantEstoquePage() {
  const { slug, base } = useTenantAdminBase()
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [produtos, setProdutos] = useState<EstoqueProduto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')
  const [statusFiltro, setStatusFiltro] = useState<EstoqueStatusFiltro>('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<EstoqueProduto | null>(null)
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<EstoqueProduto | null>(null)
  const [formNome, setFormNome] = useState('')
  const [formCategoria, setFormCategoria] = useState('')
  const [formQuantidade, setFormQuantidade] = useState('')
  const [formMinimo, setFormMinimo] = useState('')
  const [formPrecoCusto, setFormPrecoCusto] = useState('')
  const [formPrecoVenda, setFormPrecoVenda] = useState('')

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const id = await resolveAdminBarbeariaId(supabase, user.id, { slug })
      setBarbeariaId(id)
    }
    void init()
  }, [slug])

  const loadProdutos = useCallback(async () => {
    if (!barbeariaId) return
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error: qErr } = await supabase
      .from('estoque_produtos')
      .select('*')
      .eq('barbearia_id', barbeariaId)
      .order('nome')

    if (qErr) {
      setError(
        'Não foi possível carregar o estoque. Execute scripts/032_comandas_estoque.sql no Supabase (tabela estoque_produtos).',
      )
      setProdutos([])
    } else {
      setProdutos((data ?? []).map((r) => mapEstoqueRowToProduto(r as EstoqueProdutoRow)))
    }
    setIsLoading(false)
  }, [barbeariaId])

  useEffect(() => {
    void loadProdutos()
  }, [loadProdutos])

  const seedExemplo = async () => {
    if (!barbeariaId) return
    setSeeding(true)
    setError(null)
    const supabase = createClient()
    for (const m of ESTOQUE_PRODUTOS_MOCK) {
      const { error: insE } = await supabase.from('estoque_produtos').insert({
        barbearia_id: barbeariaId,
        nome: m.nome,
        categoria: m.categoria,
        quantidade: m.quantidade,
        minimo: m.minimo,
        preco_custo: m.precoCusto ?? null,
        preco_venda: m.precoVenda,
      })
      if (insE) {
        setError(insE.message)
        break
      }
    }
    await loadProdutos()
    setSeeding(false)
  }

  const abrirEdicao = (p: EstoqueProduto) => {
    setEditando(p)
    setFormNome(p.nome)
    setFormCategoria(p.categoria)
    setFormQuantidade(String(p.quantidade))
    setFormMinimo(String(p.minimo))
    setFormPrecoCusto(p.precoCusto != null ? String(p.precoCusto) : '')
    setFormPrecoVenda(String(p.precoVenda))
    setDialogOpen(true)
  }

  const fecharDialog = (open: boolean) => {
    setDialogOpen(open)
    if (!open) setEditando(null)
  }

  const abrirNovoProduto = () => {
    setEditando(null)
    setFormNome('')
    setFormCategoria(ESTOQUE_CATEGORIAS_ORDEM[0])
    setFormQuantidade('0')
    setFormMinimo('0')
    setFormPrecoCusto('')
    setFormPrecoVenda('')
    setDialogOpen(true)
  }

  const parseDecimal = (raw: string) => {
    const t = raw.trim()
    if (t === '') return null
    const n = Number(t.replace(',', '.'))
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
  }

  const salvarProduto = async () => {
    const nome = formNome.trim()
    if (!nome || !formCategoria || !barbeariaId) return

    const q = Math.max(0, Math.floor(Number(formQuantidade) || 0))
    const m = Math.max(0, Math.floor(Number(formMinimo) || 0))
    const custoParsed = parseDecimal(formPrecoCusto)
    const vendaParsed = parseDecimal(formPrecoVenda)
    const precoVenda = vendaParsed != null && vendaParsed >= 0 ? vendaParsed : 0
    let precoCusto: number | null = null
    if (formPrecoCusto.trim() !== '') {
      if (custoParsed != null) precoCusto = custoParsed
      else if (editando?.precoCusto != null) precoCusto = editando.precoCusto
    }

    const supabase = createClient()

    if (editando) {
      const { error: upE } = await supabase
        .from('estoque_produtos')
        .update({
          nome,
          categoria: formCategoria,
          quantidade: q,
          minimo: m,
          preco_custo: precoCusto,
          preco_venda: precoVenda,
        })
        .eq('id', editando.id)
        .eq('barbearia_id', barbeariaId)
      if (upE) {
        setError(upE.message)
        return
      }
    } else {
      const { error: insE } = await supabase.from('estoque_produtos').insert({
        barbearia_id: barbeariaId,
        nome,
        categoria: formCategoria,
        quantidade: q,
        minimo: m,
        preco_custo: precoCusto,
        preco_venda: precoVenda,
      })
      if (insE) {
        setError(insE.message)
        return
      }
    }
    fecharDialog(false)
    await loadProdutos()
  }

  const confirmarExclusao = async () => {
    if (!produtoParaExcluir || !barbeariaId) return
    const supabase = createClient()
    const { error: delE } = await supabase
      .from('estoque_produtos')
      .delete()
      .eq('id', produtoParaExcluir.id)
      .eq('barbearia_id', barbeariaId)
    if (delE) setError(delE.message)
    setProdutoParaExcluir(null)
    await loadProdutos()
  }

  const deltaQuantidade = async (id: string, delta: number) => {
    if (!barbeariaId) return
    const p = produtos.find((x) => x.id === id)
    if (!p) return
    const next = Math.max(0, p.quantidade + delta)
    const supabase = createClient()
    const { error: upE } = await supabase
      .from('estoque_produtos')
      .update({ quantidade: next })
      .eq('id', id)
      .eq('barbearia_id', barbeariaId)
    if (upE) setError(upE.message)
    else await loadProdutos()
  }

  const filtradosOrdenados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    let list = produtos.filter((p) => {
      if (q && !p.nome.toLowerCase().includes(q)) return false
      if (categoriaFiltro !== 'todas' && p.categoria !== categoriaFiltro) return false
      if (statusFiltro !== 'todos' && nivelEstoquePorQuantidade(p.quantidade) !== statusFiltro) {
        return false
      }
      return true
    })
    list = [...list].sort((a, b) => a.quantidade - b.quantidade)
    return list
  }, [produtos, busca, categoriaFiltro, statusFiltro])

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader title="Estoque" profileHref={`${base}/configuracoes`} avatarFallback="A" />

      <PageContent className="space-y-4 md:space-y-5">
        {error ? (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:gap-6">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do produto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9"
              aria-label="Buscar produto"
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {!isLoading && produtos.length === 0 && barbeariaId ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full sm:w-auto"
                disabled={seeding}
                onClick={() => void seedExemplo()}
              >
                {seeding ? 'Carregando…' : 'Carregar exemplo'}
              </Button>
            ) : null}
            <Button type="button" className="w-full shrink-0 sm:w-auto" size="sm" onClick={abrirNovoProduto}>
              <Plus className="mr-1 h-4 w-4" />
              Novo produto
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Categoria</Label>
            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger className="w-full" size="default" aria-label="Filtrar por categoria">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">
                  <span className="flex items-center gap-2">
                    <LayoutList className="h-4 w-4 text-muted-foreground" />
                    Todas
                  </span>
                </SelectItem>
                {ESTOQUE_CATEGORIAS_ORDEM.map((cat) => {
                  const Icon = estoqueIconeCategoria(cat)
                  return (
                    <SelectItem key={cat} value={cat}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        {cat}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status do estoque</Label>
            <Select
              value={statusFiltro}
              onValueChange={(v) => setStatusFiltro(v as EstoqueStatusFiltro)}
            >
              <SelectTrigger className="w-full" aria-label="Filtrar por status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="normal">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    Normal (&gt; 10)
                  </span>
                </SelectItem>
                <SelectItem value="baixo">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-600 dark:bg-amber-400" />
                    Baixo (5–10)
                  </span>
                </SelectItem>
                <SelectItem value="critico">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-red-600 dark:bg-red-400" />
                    Crítico (&lt; 5)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Ordenação: quantidade do menor para o maior. O preço de venda é usado nas comandas.
        </p>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">Carregando estoque…</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 md:gap-3.5 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5 xl:gap-4 2xl:grid-cols-6">
            {filtradosOrdenados.length > 0 ? (
              filtradosOrdenados.map((p) => (
                <EstoqueProdutoCard
                  key={p.id}
                  produto={p}
                  onEdit={abrirEdicao}
                  onExcluir={setProdutoParaExcluir}
                  onDeltaQuantidade={deltaQuantidade}
                />
              ))
            ) : (
              <Card className="border-dashed col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5 2xl:col-span-6">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <p className="text-muted-foreground">Nenhum produto encontrado com os filtros atuais.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setBusca('')
                      setCategoriaFiltro('todas')
                      setStatusFiltro('todos')
                    }}
                  >
                    Limpar filtros
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </PageContent>

      <Dialog open={dialogOpen} onOpenChange={fecharDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar produto' : 'Novo produto'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="estoque-nome">Nome</Label>
              <Input
                id="estoque-nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Nome do produto"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formCategoria} onValueChange={setFormCategoria}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ESTOQUE_CATEGORIAS_ORDEM.map((cat) => {
                    const Icon = estoqueIconeCategoria(cat)
                    return (
                      <SelectItem key={cat} value={cat}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          {cat}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="estoque-qtd">Quantidade atual</Label>
                <Input
                  id="estoque-qtd"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={formQuantidade}
                  onChange={(e) => setFormQuantidade(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoque-min">Mínimo (alerta)</Label>
                <Input
                  id="estoque-min"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={formMinimo}
                  onChange={(e) => setFormMinimo(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="estoque-custo">Preço de custo (R$, opcional)</Label>
                <Input
                  id="estoque-custo"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 24,90"
                  value={formPrecoCusto}
                  onChange={(e) => setFormPrecoCusto(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoque-venda">Preço de venda (R$)</Label>
                <Input
                  id="estoque-venda"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 39,90"
                  value={formPrecoVenda}
                  onChange={(e) => setFormPrecoVenda(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => fecharDialog(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void salvarProduto()}
              disabled={!formNome.trim() || !formCategoria}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={produtoParaExcluir != null}
        onOpenChange={(open) => {
          if (!open) setProdutoParaExcluir(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              {produtoParaExcluir
                ? `“${produtoParaExcluir.nome}” será removido do estoque. Esta ação não pode ser desfeita.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void confirmarExclusao()}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TenantPanelPageContainer>
  )
}
