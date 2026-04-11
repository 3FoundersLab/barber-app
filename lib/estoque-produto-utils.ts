import type { EstoqueNivel } from '@/types/estoque-produto'

/** Status visual do card (alinha à regra: 0 = esgotado; ≤ mínimo = baixo; senão normal). */
export type EstoqueCardStatus = 'esgotado' | 'baixo' | 'normal'

export function estoqueCardStatus(quantidade: number, quantidadeMinima: number): EstoqueCardStatus {
  const q = Math.max(0, Math.floor(quantidade))
  const min = Math.max(0, Math.floor(quantidadeMinima))
  if (q <= 0) return 'esgotado'
  if (min > 0 && q <= min) return 'baixo'
  return 'normal'
}

/** Regras: &gt;10 normal, 5–10 baixo, &lt;5 crítico. */
export function nivelEstoquePorQuantidade(quantidade: number): EstoqueNivel {
  if (quantidade > 10) return 'normal'
  if (quantidade >= 5) return 'baixo'
  return 'critico'
}

export function labelNivelEstoque(nivel: EstoqueNivel): string {
  switch (nivel) {
    case 'normal':
      return 'Normal'
    case 'baixo':
      return 'Baixo'
    case 'critico':
      return 'Crítico'
  }
}
