import type { EstoqueProduto } from '@/types/estoque-produto'

export type EstoqueProdutoRow = {
  id: string
  barbearia_id: string
  nome: string
  categoria: string
  quantidade: number
  minimo: number
  preco_custo: string | number | null
  preco_venda: string | number
  created_at?: string
  updated_at?: string
}

function num(v: string | number | null | undefined): number {
  if (v == null || v === '') return 0
  const n = typeof v === 'string' ? parseFloat(v) : Number(v)
  return Number.isFinite(n) ? n : 0
}

export function mapEstoqueRowToProduto(row: EstoqueProdutoRow): EstoqueProduto {
  let precoCusto: number | undefined
  if (row.preco_custo != null && row.preco_custo !== '') {
    const c = num(row.preco_custo)
    if (Number.isFinite(c)) precoCusto = Math.round(c * 100) / 100
  }
  return {
    id: row.id,
    nome: row.nome,
    categoria: row.categoria,
    quantidade: Math.max(0, Math.floor(Number(row.quantidade) || 0)),
    minimo: Math.max(0, Math.floor(Number(row.minimo) || 0)),
    precoCusto,
    precoVenda: Math.round(num(row.preco_venda) * 100) / 100,
  }
}
