import type { EstoqueNivel } from '@/types/estoque-produto'

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
