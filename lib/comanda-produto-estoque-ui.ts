import type { ComandaProdutoDraft } from '@/types/comanda'
import type { EstoqueProduto } from '@/types/estoque-produto'

export interface PlanAjusteProdutoLinhasToast {
  variant: 'destructive'
  title: string
  description?: string
}

/**
 * Planeja alteração de quantidade de um produto do estoque nas linhas da comanda (estado local do editor).
 * Regra de negócio: **valida quantidade disponível** (teto = estoque no painel + já reservado na comanda ao
 * abrir) antes de aceitar incremento; feedback quando esgotado ou no máximo.
 */
export function planAjusteProdutoLinhas(
  prev: ComandaProdutoDraft[],
  produto: Pick<EstoqueProduto, 'id' | 'nome' | 'quantidade' | 'precoVenda' | 'precoCusto'>,
  delta: number,
  options: { committedNaComanda: number; demoMode: boolean },
): { next: ComandaProdutoDraft[]; feedback?: PlanAjusteProdutoLinhasToast } {
  if (delta === 0) {
    return { next: prev }
  }

  const preco = produto.precoVenda > 0 ? produto.precoVenda : produto.precoCusto ?? 0
  const maxTotal = options.demoMode ? 9999 : produto.quantidade + options.committedNaComanda
  const i = prev.findIndex((x) => x.produtoEstoqueId === produto.id)

  if (delta > 0) {
    if (maxTotal < 1) {
      return {
        next: prev,
        feedback: {
          variant: 'destructive',
          title: 'Produto esgotado',
          description: `“${produto.nome}” não está disponível no estoque.`,
        },
      }
    }

    if (i >= 0) {
      const current = prev[i].quantidade
      const nextQty = Math.min(maxTotal, current + delta)
      if (nextQty === current) {
        return {
          next: prev,
          feedback: {
            variant: 'destructive',
            title: 'Quantidade máxima',
            description: `Máximo disponível na comanda: ${maxTotal} unidade(s).`,
          },
        }
      }
      const next = [...prev]
      next[i] = { ...next[i], quantidade: nextQty }
      return { next }
    }

    const q = Math.min(delta, maxTotal)
    if (q < 1) {
      return { next: prev }
    }
    return {
      next: [
        ...prev,
        {
          produtoEstoqueId: produto.id,
          nome: produto.nome,
          precoUnitario: preco,
          quantidade: q,
        },
      ],
    }
  }

  if (i < 0) {
    return { next: prev }
  }

  const next = [...prev]
  const newQ = next[i].quantidade + delta
  if (newQ <= 0) {
    return { next: prev.filter((_, idx) => idx !== i) }
  }
  next[i] = { ...next[i], quantidade: newQ }
  return { next }
}
