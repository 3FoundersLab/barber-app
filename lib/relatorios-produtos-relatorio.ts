import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { EstoqueProduto } from '@/types/estoque-produto'

export type VendaProdutoLinha = {
  produto_estoque_id: string
  nome: string
  referencia_data: string
  quantidade: number
  receita: number
}

export type ProdutoMargemRank = {
  id: string
  nome: string
  margemPct: number
  precoVenda: number
  precoCusto: number
}

export function margemPercentual(precoVenda: number, precoCusto: number): number | null {
  if (precoVenda <= 0 || precoCusto < 0) return null
  return Math.round(((precoVenda - precoCusto) / precoVenda) * 1000) / 10
}

export function rankingMargemProdutos(estoque: EstoqueProduto[]): ProdutoMargemRank[] {
  const out: ProdutoMargemRank[] = []
  for (const p of estoque) {
    const custo = p.precoCusto ?? 0
    const m = margemPercentual(p.precoVenda, custo)
    if (m == null) continue
    out.push({
      id: p.id,
      nome: p.nome,
      margemPct: m,
      precoVenda: p.precoVenda,
      precoCusto: custo,
    })
  }
  return out.sort((a, b) => b.margemPct - a.margemPct)
}

export type ProdutoMovimentoAnalise = {
  produtoId: string
  nome: string
  qtdVendida: number
  receitaVendas: number
  ultimaVenda: string | null
  diasSemVenda: number | null
  /** Dias distintos com venda no recorte (para giro). */
  diasComMovimento: number
  primeiraVendaNoRecorte: string | null
}

export function analisarMovimentoProdutos(
  linhas: VendaProdutoLinha[],
  ref: Date = new Date(),
): ProdutoMovimentoAnalise[] {
  const byId = new Map<
    string,
    {
      nome: string
      qtd: number
      receita: number
      datas: Set<string>
      ultima: string | null
      primeira: string | null
    }
  >()
  for (const l of linhas) {
    const id = l.produto_estoque_id
    if (!id) continue
    const cur = byId.get(id) ?? {
      nome: l.nome,
      qtd: 0,
      receita: 0,
      datas: new Set<string>(),
      ultima: null as string | null,
      primeira: null as string | null,
    }
    const next = {
      nome: l.nome || cur.nome,
      qtd: cur.qtd + l.quantidade,
      receita: cur.receita + l.receita,
      datas: new Set(cur.datas),
      ultima: cur.ultima,
      primeira: cur.primeira,
    }
    next.datas.add(l.referencia_data)
    if (!next.ultima || l.referencia_data > next.ultima) next.ultima = l.referencia_data
    if (!next.primeira || l.referencia_data < next.primeira) next.primeira = l.referencia_data
    byId.set(id, next)
  }

  const out: ProdutoMovimentoAnalise[] = []
  for (const [produtoId, v] of byId) {
    const diasSem =
      v.ultima != null ? differenceInCalendarDays(ref, parseISO(`${v.ultima}T12:00:00`)) : null
    out.push({
      produtoId,
      nome: v.nome,
      qtdVendida: v.qtd,
      receitaVendas: v.receita,
      ultimaVenda: v.ultima,
      diasSemVenda: diasSem,
      diasComMovimento: v.datas.size,
      primeiraVendaNoRecorte: v.primeira,
    })
  }
  return out
}

export type RupturaEstimativa = {
  produtoId: string
  nome: string
  estoqueAtual: number
  consumoMedioDiario: number
  diasAteRuptura: number | null
}

export function previsaoRuptura(
  estoque: EstoqueProduto[],
  movimento: ProdutoMovimentoAnalise[],
  diasRecorte: number,
): RupturaEstimativa[] {
  const movMap = new Map(movimento.map((m) => [m.produtoId, m]))
  const out: RupturaEstimativa[] = []
  const d = Math.max(1, diasRecorte)
  for (const p of estoque) {
    const m = movMap.get(p.id)
    const qtdV = m?.qtdVendida ?? 0
    const consumo = qtdV / d
    let dias: number | null = null
    if (consumo > 0 && p.quantidade > 0) {
      dias = Math.floor(p.quantidade / consumo)
    } else if (consumo === 0 && p.quantidade > 0) {
      dias = null
    } else if (p.quantidade <= 0) {
      dias = 0
    }
    out.push({
      produtoId: p.id,
      nome: p.nome,
      estoqueAtual: p.quantidade,
      consumoMedioDiario: Math.round(consumo * 100) / 100,
      diasAteRuptura: dias,
    })
  }
  return out.sort((a, b) => {
    if (a.diasAteRuptura == null) return 1
    if (b.diasAteRuptura == null) return -1
    return a.diasAteRuptura - b.diasAteRuptura
  })
}
