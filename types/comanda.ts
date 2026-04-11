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

// ---------------------------------------------------------------------------
// Estrutura agregada (UI / contrato de apresentação)
// ---------------------------------------------------------------------------

/**
 * Forma de pagamento em formato “curto” (telas e mocks).
 * No banco usamos {@link ComandaFormaPagamento}: `debito` → `cartao_debito`, `credito` → `cartao_credito`.
 */
export type ComandaFormaPagamentoUi = 'dinheiro' | 'pix' | 'debito' | 'credito'

/** Linha de serviço já com subtotal (quantidade × preço). */
export interface ComandaEstruturaServico {
  servicoId: string
  nome: string
  quantidade: number
  precoUnitario: number
  subtotal: number
}

/** Linha de produto com estoque atual para validação na UI. */
export interface ComandaEstruturaProduto {
  produtoId: string
  nome: string
  categoria: string
  quantidade: number
  precoUnitario: number
  subtotal: number
  estoqueDisponivel: number
}

/**
 * Comanda “montada” para exibição ou integrações de alto nível.
 *
 * Contrasta com {@link Comanda} (linha de `comandas` + joins leves) e com
 * {@link ComandaServicoLinha} / {@link ComandaProdutoLinha} (tabelas de linhas).
 *
 * Mapeamento típico a partir do app atual:
 * - `id` ← `comandas.id`
 * - `agendamentoId` ← `comandas.agendamento_id` (omitir se `null`)
 * - `barbeiro` / `cliente` ← ids + nomes dos joins
 * - `servicos` / `produtos` ← `comanda_servicos` / `comanda_produtos` + catálogo/estoque para `categoria` e `estoqueDisponivel`
 * - `desconto` / `taxaServico` / `total` ← resultado de {@link calcularTotaisComanda} em `lib/comanda-totais.ts` (valores em reais)
 * - `formaPagamento` ← normalizar `comandas.forma_pagamento` para {@link ComandaFormaPagamentoUi}
 * - `criadaEm` / `atualizadaEm` ← `new Date(created_at|updated_at)` ISO do Supabase
 *
 * No projeto, IDs são **string (UUID)**; specs com `number` costumam ser legados ou outra API.
 */
export interface ComandaEstrutura {
  id: string
  agendamentoId?: string
  barbeiro: { id: string; nome: string }
  cliente: { id: string; nome: string; telefone?: string }

  servicos: ComandaEstruturaServico[]
  produtos: ComandaEstruturaProduto[]

  subtotalServicos: number
  subtotalProdutos: number
  /** Valor do desconto aplicado, em reais (já considerando modo % ou fixo). */
  desconto: number
  /** Taxa de serviço em reais (sobre o subtotal após desconto, conforme regra de negócio). */
  taxaServico: number
  total: number

  formaPagamento?: ComandaFormaPagamentoUi
  status: ComandaStatus
  criadaEm: Date
  atualizadaEm: Date
}
