import type { EstoqueProduto } from '@/types/estoque-produto'

/** Exemplo para seed opcional no painel (IDs fictícios). */
export const ESTOQUE_PRODUTOS_MOCK: EstoqueProduto[] = [
  { id: 'demo-1', nome: 'Pomada Modeladora', categoria: 'Finalização', quantidade: 15, minimo: 5, precoCusto: 28.5, precoVenda: 45 },
  { id: 'demo-2', nome: 'Shampoo Anticaspa', categoria: 'Higiene', quantidade: 8, minimo: 10, precoCusto: 42, precoVenda: 65 },
  { id: 'demo-3', nome: 'Óleo para Barba', categoria: 'Barba', quantidade: 3, minimo: 5, precoCusto: 35, precoVenda: 55 },
  { id: 'demo-4', nome: 'Pente de Madeira', categoria: 'Acessórios', quantidade: 25, minimo: 10, precoCusto: 12, precoVenda: 22 },
  { id: 'demo-5', nome: 'Tesoura Profissional', categoria: 'Equipamentos', quantidade: 4, minimo: 2, precoCusto: 189, precoVenda: 289 },
  { id: 'demo-6', nome: 'Gel Fixador', categoria: 'Finalização', quantidade: 12, minimo: 8, precoCusto: 22, precoVenda: 38 },
  { id: 'demo-7', nome: 'Loção Pós-Barba', categoria: 'Barba', quantidade: 20, minimo: 8, precoCusto: 31, precoVenda: 48 },
  { id: 'demo-8', nome: 'Desodorante Colônia', categoria: 'Perfumaria', quantidade: 6, minimo: 10, precoCusto: 48, precoVenda: 75 },
]
