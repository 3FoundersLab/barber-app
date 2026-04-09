/** Item de estoque no painel da barbearia (UI; persistência virá depois). */
export interface EstoqueProduto {
  id: number
  nome: string
  categoria: string
  quantidade: number
  minimo: number
  /** Custo unitário opcional (R$) */
  precoCusto?: number
}

export type EstoqueNivel = 'normal' | 'baixo' | 'critico'

export type EstoqueStatusFiltro = 'todos' | EstoqueNivel
