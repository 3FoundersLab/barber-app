'use client'

import { useMemo } from 'react'
import { AlertTriangle, Package, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency } from '@/lib/constants'
import { estoqueCardStatus } from '@/lib/estoque-produto-utils'
import {
  analisarMovimentoProdutos,
  previsaoRuptura,
  rankingMargemProdutos,
  type VendaProdutoLinha,
} from '@/lib/relatorios-produtos-relatorio'
import type { EstoqueProduto } from '@/types/estoque-produto'

const DIAS_PARADO = 30
const DIAS_GIRO_RAPIDO = 7
const DIAS_RECORTE_MOV = 120

export function RelatoriosProdutosRelatorioPainel({
  estoque,
  vendasProdutos120d,
  servicosRankNomes,
}: {
  estoque: EstoqueProduto[]
  vendasProdutos120d: VendaProdutoLinha[]
  /** Do período do relatório — serviços mais vendidos (nome + qtd). */
  servicosRankNomes: { nome: string; q: number }[]
}) {
  const margemRank = useMemo(() => rankingMargemProdutos(estoque), [estoque])
  const movimento = useMemo(() => analisarMovimentoProdutos(vendasProdutos120d), [vendasProdutos120d])
  const movMap = useMemo(() => new Map(movimento.map((m) => [m.produtoId, m])), [movimento])
  const ruptura = useMemo(
    () => previsaoRuptura(estoque, movimento, DIAS_RECORTE_MOV),
    [estoque, movimento],
  )

  const criticos = useMemo(() => {
    return estoque.filter((p) => estoqueCardStatus(p.quantidade, p.minimo) !== 'normal')
  }, [estoque])

  const parados30 = useMemo(() => {
    const out: (typeof movimento)[number][] = []
    for (const p of estoque) {
      const m = movMap.get(p.id)
      if (!m || m.qtdVendida === 0) {
        out.push({
          produtoId: p.id,
          nome: p.nome,
          qtdVendida: 0,
          receitaVendas: 0,
          ultimaVenda: null,
          diasSemVenda: null,
          diasComMovimento: 0,
          primeiraVendaNoRecorte: null,
        })
        continue
      }
      if ((m.diasSemVenda ?? 0) >= DIAS_PARADO) out.push(m)
    }
    return out.sort((a, b) => {
      const da = a.diasSemVenda ?? (a.qtdVendida === 0 ? 999 : 0)
      const db = b.diasSemVenda ?? (b.qtdVendida === 0 ? 999 : 0)
      return db - da
    })
  }, [estoque, movMap])

  const giroRapido = useMemo(() => {
    return movimento.filter(
      (m) =>
        m.qtdVendida >= 3 &&
        m.diasSemVenda != null &&
        m.diasSemVenda <= DIAS_GIRO_RAPIDO &&
        m.diasComMovimento >= 2,
    )
  }, [movimento])

  const topMargem = margemRank.slice(0, 3)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Produtos</h2>
        <p className="text-xs text-muted-foreground">
          Estoque e consumo — vendas de comandas fechadas nos últimos {DIAS_RECORTE_MOV} dias (giro e ruptura).
        </p>
      </div>

      <Card className="border-amber-200/60 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400" aria-hidden />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <span className="font-semibold text-amber-900 dark:text-amber-100">{criticos.length}</span> produto(s)
            com estoque crítico ou no mínimo.
          </p>
          <p>
            <span className="font-semibold">
              {parados30.filter((x) => x.qtdVendida > 0 && (x.diasSemVenda ?? 0) >= DIAS_PARADO).length}
            </span>{' '}
            com última venda há {DIAS_PARADO}+ dias;{' '}
            <span className="font-semibold">{parados30.filter((x) => x.qtdVendida === 0).length}</span> sem venda no
            recorte de {DIAS_RECORTE_MOV}d.
          </p>
          <p>
            <span className="font-semibold text-emerald-800 dark:text-emerald-200">{giroRapido.length}</span> com
            giro rápido (vendas recentes e volume).
          </p>
          {topMargem.length > 0 ? (
            <p className="flex flex-wrap items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              Top margem:{' '}
              {topMargem.map((t, i) => (
                <span key={t.id}>
                  {t.nome} ({t.margemPct}%)
                  {i < topMargem.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" aria-hidden />
              Mais vendidos (SKU)
            </CardTitle>
            <CardDescription>Últimos {DIAS_RECORTE_MOV} dias — quantidade em comandas</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[min(280px,40vh)] pr-2">
              <ul className="space-y-2 text-sm">
                {[...movimento]
                  .sort((a, b) => b.qtdVendida - a.qtdVendida)
                  .slice(0, 15)
                  .map((m, i) => (
                    <li key={m.produtoId} className="flex justify-between gap-2 rounded-lg border border-border/60 px-2 py-1.5">
                      <span className="min-w-0 truncate">
                        {i + 1}. {m.nome}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{m.qtdVendida} un.</span>
                    </li>
                  ))}
                {movimento.length === 0 ? (
                  <li className="text-muted-foreground">Nenhuma venda de produto no recorte.</li>
                ) : null}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Maior margem de lucro</CardTitle>
            <CardDescription>Com base em preço de venda e custo cadastrados no estoque</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {margemRank.slice(0, 15).map((m, i) => (
                <li
                  key={m.id}
                  className="flex justify-between gap-2 rounded-lg border border-border/60 px-2 py-1.5"
                >
                  <span className="min-w-0 truncate">
                    {i + 1}. {m.nome}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{m.margemPct}%</span>
                </li>
              ))}
              {margemRank.length === 0 ? (
                <li className="text-muted-foreground">Cadastre custo e venda no estoque para ver margem.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Parados ({DIAS_PARADO}+ dias sem venda)</CardTitle>
            <CardDescription>No recorte de {DIAS_RECORTE_MOV} dias</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[min(220px,32vh)] pr-2">
              <ul className="space-y-2 text-sm">
                {parados30.slice(0, 20).map((m) => (
                    <li key={m.produtoId} className="flex justify-between gap-2">
                      <span className="min-w-0 truncate">{m.nome}</span>
                      <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        {m.qtdVendida === 0 ? (
                          <span>Sem venda ({DIAS_RECORTE_MOV}d)</span>
                        ) : (
                          <span>
                            {m.diasSemVenda ?? '—'} d · últ. {m.ultimaVenda ?? '—'}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                {parados30.length === 0 ? (
                  <li className="text-muted-foreground">Nenhum item nesta condição.</li>
                ) : null}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Giro rápido</CardTitle>
            <CardDescription>Vendas recentes e múltiplos dias com saída (≤{DIAS_GIRO_RAPIDO} dias desde última)</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {giroRapido.slice(0, 15).map((m) => (
                <li key={m.produtoId} className="flex justify-between gap-2 rounded-lg border border-border/60 px-2 py-1.5">
                  <span className="min-w-0 truncate">{m.nome}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{m.qtdVendida} un.</span>
                </li>
              ))}
              {giroRapido.length === 0 ? (
                <li className="text-muted-foreground">Sem produtos classificados com giro rápido.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Previsão de ruptura</CardTitle>
          <CardDescription>
            Estoque atual ÷ consumo médio diário ({DIAS_RECORTE_MOV} dias). Valores baixos = reabastecer em breve.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/60 text-left text-muted-foreground">
                <th className="py-2 pr-2 font-medium">Produto</th>
                <th className="py-2 pr-2 font-medium">Estoque</th>
                <th className="py-2 pr-2 font-medium">Média/dia</th>
                <th className="py-2 font-medium">Dias até ruptura</th>
              </tr>
            </thead>
            <tbody>
              {ruptura.slice(0, 25).map((r) => (
                <tr key={r.produtoId} className="border-b border-border/40">
                  <td className="py-2 pr-2 font-medium">{r.nome}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.estoqueAtual}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.consumoMedioDiario.toFixed(2)}</td>
                  <td className="py-2 tabular-nums">
                    {r.diasAteRuptura == null ? '—' : r.diasAteRuptura === 0 ? 'Esgotado' : `${r.diasAteRuptura} d`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Serviços mais vendidos (período do relatório)</CardTitle>
          <CardDescription>Referência cruzada com a aba Operação</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {servicosRankNomes.slice(0, 12).map((s, i) => (
              <li key={`${s.nome}-${i}`} className="flex justify-between gap-2">
                <span className="min-w-0 truncate">
                  {i + 1}. {s.nome}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{s.q}</span>
              </li>
            ))}
            {servicosRankNomes.length === 0 ? (
              <li className="text-muted-foreground">Nenhum serviço no período.</li>
            ) : null}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
