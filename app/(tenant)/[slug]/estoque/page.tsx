'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ESTOQUE_CATEGORIAS_ORDEM,
  ESTOQUE_CATEGORIAS_ORDEM_ALFABETICA,
  estoqueIconeCategoria,
} from '@/lib/estoque-categoria-icons'
import { ESTOQUE_PRODUTOS_MOCK } from '@/lib/estoque-produto-mock'
import { mapEstoqueRowToProduto, type EstoqueProdutoRow } from '@/lib/map-estoque-produto'
import {
  estoqueCardStatus,
  nivelEstoquePorQuantidade,
  type EstoqueCardStatus,
} from '@/lib/estoque-produto-utils'
import { createClient } from '@/lib/supabase/client'
import { toUserFriendlyErrorMessage } from '@/lib/to-user-friendly-error'
import { resolveAdminBarbeariaId } from '@/lib/resolve-admin-barbearia-id'
import { useTenantAdminBase } from '@/hooks/use-tenant-admin-base'
import type { EstoqueProduto, EstoqueStatusFiltro } from '@/types/estoque-produto'
import { Alert, AlertTitle, ALERT_DEFAULT_AUTO_CLOSE_MS } from '@/components/ui/alert'

function parseDecimalMoeda(raw: string): number | null {
  const t = raw.trim()
  if (t === '') return null
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null
}

/** Quantidade inteira ≥ 0; string vazia ou inválida → null. */
function parseQuantidadeObrigatoria(raw: string): number | null {
  const t = raw.trim()
  if (t === '') return null
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.max(0, Math.floor(n))
}

/** Mesma regra do card: esgotado e estoque baixo aparecem primeiro na grade. */
function rankEstoqueCardPrioridade(status: EstoqueCardStatus): number {
  if (status === 'esgotado') return 0
  if (status === 'baixo') return 1
  return 2
}

export default function TenantEstoquePage() {
  const { slug, base } = useTenantAdminBase()
  const [barbeariaId, setBarbeariaId] = useState<string | null>(null)
  const [produtos, setProdutos] = useState<EstoqueProduto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useDemoData, setUseDemoData] = useState(false)

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

  const loadProdutos = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!barbeariaId) return
      const showLoading = options?.showLoading ?? true
      if (showLoading) setIsLoading(true)
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
      if (showLoading) setIsLoading(false)
    },
    [barbeariaId],
  )

  useEffect(() => {
    void loadProdutos()
  }, [loadProdutos])

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

  const salvarProduto = async () => {
    if (useDemoData) {
      setError('Desative "Dados fictícios" no topo da página para salvar alterações no estoque real.')
      return
    }
    const nome = formNome.trim()
    if (!nome || !formCategoria || !barbeariaId) return

    const q = parseQuantidadeObrigatoria(formQuantidade)
    if (q === null) return

    const m = Math.max(0, Math.floor(Number(formMinimo) || 0))
    const custoParsed = parseDecimalMoeda(formPrecoCusto)
    const vendaParsed = parseDecimalMoeda(formPrecoVenda)
    if (vendaParsed === null || vendaParsed < 0) return
    const precoVenda = vendaParsed
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
        setError(toUserFriendlyErrorMessage(upE, { fallback: 'Não foi possível atualizar o produto.' }))
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
        setError(toUserFriendlyErrorMessage(insE, { fallback: 'Não foi possível cadastrar o produto.' }))
        return
      }
    }
    fecharDialog(false)
    await loadProdutos({ showLoading: false })
  }

  const confirmarExclusao = async () => {
    if (useDemoData) {
      setProdutoParaExcluir(null)
      setError('Desative "Dados fictícios" para excluir produtos do estoque real.')
      return
    }
    if (!produtoParaExcluir || !barbeariaId) return
    const supabase = createClient()
    const { error: delE } = await supabase
      .from('estoque_produtos')
      .delete()
      .eq('id', produtoParaExcluir.id)
      .eq('barbearia_id', barbeariaId)
    if (delE) {
      setError(toUserFriendlyErrorMessage(delE, { fallback: 'Não foi possível excluir o produto.' }))
    }
    setProdutoParaExcluir(null)
    await loadProdutos({ showLoading: false })
  }

  const formEstoquePodeSalvar = useMemo(() => {
    if (!formNome.trim() || !formCategoria) return false
    if (parseQuantidadeObrigatoria(formQuantidade) === null) return false
    const v = parseDecimalMoeda(formPrecoVenda)
    return v !== null && v >= 0
  }, [formNome, formCategoria, formQuantidade, formPrecoVenda])

  const produtosParaExibicao = useDemoData ? ESTOQUE_PRODUTOS_MOCK : produtos

  const categoriasParaChips = useMemo(() => {
    const s = new Set(produtosParaExibicao.map((p) => p.categoria))
    const padraoPrimeiro = ESTOQUE_CATEGORIAS_ORDEM.filter((c) => s.has(c))
    const rest = [...s]
      .filter((c) => !ESTOQUE_CATEGORIAS_ORDEM.includes(c as (typeof ESTOQUE_CATEGORIAS_ORDEM)[number]))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return [...padraoPrimeiro, ...rest]
  }, [produtosParaExibicao])

  const filtradosOrdenados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    let list = produtosParaExibicao.filter((p) => {
      if (q && !p.nome.toLowerCase().includes(q) && !p.categoria.toLowerCase().includes(q)) return false
      if (categoriaFiltro !== 'todas' && p.categoria !== categoriaFiltro) return false
      if (statusFiltro !== 'todos' && nivelEstoquePorQuantidade(p.quantidade) !== statusFiltro) {
        return false
      }
      return true
    })
    list = [...list].sort((a, b) => {
      const sa = estoqueCardStatus(a.quantidade, a.minimo)
      const sb = estoqueCardStatus(b.quantidade, b.minimo)
      const ra = rankEstoqueCardPrioridade(sa)
      const rb = rankEstoqueCardPrioridade(sb)
      if (ra !== rb) return ra - rb
      const qa = Math.max(0, Math.floor(a.quantidade))
      const qb = Math.max(0, Math.floor(b.quantidade))
      if (qa !== qb) return qa - qb
      return a.nome.localeCompare(b.nome, 'pt-BR')
    })
    return list
  }, [produtosParaExibicao, busca, categoriaFiltro, statusFiltro])

  const showGridLoading = isLoading && !useDemoData

  return (
    <TenantPanelPageContainer>
      <TenantPanelPageHeader
        title="ESTOQUE"
        profileHref={`${base}/configuracoes`}
        avatarFallback="A"
        headingActions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              className="shrink-0 gap-1"
              onClick={abrirNovoProduto}
              disabled={useDemoData}
              title={useDemoData ? 'Desative dados fictícios para cadastrar produtos reais' : undefined}
            >
              <Plus className="h-4 w-4" />
              Novo
            </Button>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-1">
              <Switch
                id="estoque-demo-data"
                checked={useDemoData}
                onCheckedChange={setUseDemoData}
                aria-label="Usar dados fictícios de demonstração"
              />
              <Label htmlFor="estoque-demo-data" className="cursor-pointer text-[11px] font-medium leading-none">
                Demo
              </Label>
            </div>
          </div>
        }
      />

      <PageContent className="space-y-4 md:space-y-5">
        {useDemoData ? (
          <Alert variant="info">
            <AlertTitle>
              Modo demonstração: produtos fictícios apenas para visualização. Desligue o interruptor para ver e
              editar o estoque real da barbearia.
            </AlertTitle>
          </Alert>
        ) : null}

        {error ? (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            autoCloseMs={ALERT_DEFAULT_AUTO_CLOSE_MS}
          >
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        ) : null}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-10 w-full pl-9"
            aria-label="Buscar produto"
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div
            className={cn(
              'flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5',
              '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            )}
            role="tablist"
            aria-label="Filtrar por categoria"
          >
            <Button
              type="button"
              size="sm"
              variant={categoriaFiltro === 'todas' ? 'default' : 'outline'}
              className="shrink-0 rounded-full text-xs"
              onClick={() => setCategoriaFiltro('todas')}
            >
              Todas
            </Button>
            {categoriasParaChips.map((cat) => (
              <Button
                key={cat}
                type="button"
                size="sm"
                variant={categoriaFiltro === cat ? 'default' : 'outline'}
                className="shrink-0 rounded-full text-xs capitalize"
                onClick={() => setCategoriaFiltro(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:max-w-[11rem]">
            <Label htmlFor="estoque-filtro-status" className="sr-only">
              Status do estoque
            </Label>
            <Select
              value={statusFiltro}
              onValueChange={(v) => setStatusFiltro(v as EstoqueStatusFiltro)}
            >
              <SelectTrigger id="estoque-filtro-status" className="h-9 w-full min-w-[10rem]" aria-label="Filtrar por status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
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

        {showGridLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">Carregando estoque…</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5 md:grid-cols-3 md:gap-4">
            {filtradosOrdenados.length > 0 ? (
              filtradosOrdenados.map((p) => (
                <EstoqueProdutoCard
                  key={p.id}
                  produto={p}
                  onEdit={abrirEdicao}
                  onExcluir={setProdutoParaExcluir}
                  readOnly={useDemoData}
                />
              ))
            ) : (
              <Card className="col-span-2 border-dashed md:col-span-3">
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
              <Label htmlFor="estoque-nome">
                Nome <span className="text-destructive" aria-hidden>*</span>
              </Label>
              <Input
                id="estoque-nome"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder="Nome do produto"
                required
                aria-required
              />
            </div>
            <div className="space-y-2">
              <Label>
                Categoria <span className="text-destructive" aria-hidden>*</span>
              </Label>
              <Select value={formCategoria} onValueChange={setFormCategoria} required>
                <SelectTrigger className="w-full" aria-required>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ESTOQUE_CATEGORIAS_ORDEM_ALFABETICA.map((cat) => {
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
                <Label htmlFor="estoque-qtd">
                  Quantidade atual <span className="text-destructive" aria-hidden>*</span>
                </Label>
                <Input
                  id="estoque-qtd"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={formQuantidade}
                  onChange={(e) => setFormQuantidade(e.target.value)}
                  required
                  aria-required
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
                <Label htmlFor="estoque-custo">Preço de custo (R$)</Label>
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
                <Label htmlFor="estoque-venda">
                  Preço de venda (R$) <span className="text-destructive" aria-hidden>*</span>
                </Label>
                <Input
                  id="estoque-venda"
                  type="text"
                  inputMode="decimal"
                  placeholder="Ex: 39,90"
                  value={formPrecoVenda}
                  onChange={(e) => setFormPrecoVenda(e.target.value)}
                  required
                  aria-required
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
              disabled={!formEstoquePodeSalvar || useDemoData}
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
