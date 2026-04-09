import type { EstoqueProduto } from '@/types/estoque-produto'

/** Dados de demonstração até existir tabela/API de estoque. */
export const ESTOQUE_PRODUTOS_MOCK: EstoqueProduto[] = [
  { id: 1, nome: 'Pomada Modeladora', categoria: 'Finalização', quantidade: 15, minimo: 5, precoCusto: 28.5 },
  { id: 2, nome: 'Shampoo Anticaspa', categoria: 'Higiene', quantidade: 8, minimo: 10, precoCusto: 42 },
  { id: 3, nome: 'Óleo para Barba', categoria: 'Barba', quantidade: 3, minimo: 5, precoCusto: 35 },
  { id: 4, nome: 'Pente de Madeira', categoria: 'Acessórios', quantidade: 25, minimo: 10, precoCusto: 12 },
  { id: 5, nome: 'Tesoura Profissional', categoria: 'Equipamentos', quantidade: 4, minimo: 2, precoCusto: 189 },
  { id: 6, nome: 'Gel Fixador', categoria: 'Finalização', quantidade: 12, minimo: 8, precoCusto: 22 },
  { id: 7, nome: 'Loção Pós-Barba', categoria: 'Barba', quantidade: 20, minimo: 8, precoCusto: 31 },
  { id: 8, nome: 'Desodorante Colônia', categoria: 'Perfumaria', quantidade: 6, minimo: 10, precoCusto: 48 },
]
