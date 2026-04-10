export type ComandaStatus = 'aberta' | 'fechada' | 'cancelada'

export type ComandaDescontoModo = 'nenhum' | 'percentual' | 'fixo'

export type ComandaFormaPagamento = 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito'

export interface Comanda {
  id: string
  barbearia_id: string
  agendamento_id: string | null
  numero: number
  barbeiro_id: string
  cliente_id: string
  referencia_data: string
  mesa: string | null
  status: ComandaStatus
  horario_inicio: string
  desconto_modo: ComandaDescontoModo
  desconto_valor: number
  taxa_servico_aplicar: boolean
  taxa_servico_percentual: number
  forma_pagamento: string | null
  created_at: string
  updated_at: string
  cliente?: { nome: string } | null
  barbeiro?: { nome: string } | null
  agendamento?: {
    data: string
    horario: string
    servico_id?: string
    valor?: number
    servico?: { nome: string } | null
  } | null
}

export interface ComandaServicoLinha {
  id: string
  comanda_id: string
  servico_id: string | null
  nome: string
  preco_unitario: number
  quantidade: number
  created_at: string
}

export interface ComandaProdutoLinha {
  id: string
  comanda_id: string
  produto_estoque_id: string
  nome: string
  preco_unitario: number
  quantidade: number
  created_at: string
}

/** Rascunho no editor (antes de persistir). */
export interface ComandaServicoDraft {
  servicoId: string
  nome: string
  precoUnitario: number
  quantidade: number
}

export interface ComandaProdutoDraft {
  produtoEstoqueId: string
  nome: string
  precoUnitario: number
  quantidade: number
}
