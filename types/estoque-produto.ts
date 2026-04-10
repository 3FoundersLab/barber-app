/** Item de estoque no painel da barbearia (persistido em `estoque_produtos`). */
export interface EstoqueProduto {
  id: string
  nome: string
  categoria: string
  quantidade: number
  minimo: number
  /** Custo unitário opcional (R$) */
  precoCusto?: number
  /** Preço de venda na comanda (R$) */
  precoVenda: number
}

export type EstoqueNivel = 'normal' | 'baixo' | 'critico'

export type EstoqueStatusFiltro = 'todos' | EstoqueNivel
