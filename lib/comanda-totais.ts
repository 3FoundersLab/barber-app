import type { ComandaDescontoModo } from '@/types/comanda'

/**
 * Cálculo de totais da comanda (BarberTool).
 *
 * Diferente de exemplos didáticos do tipo `subtotal - desconto + taxa` com taxa fixa de 10% sobre o
 * bruto: aqui o **desconto** pode ser nenhum, percentual ou valor fixo sobre a base bruta, e a **taxa
 * de serviço** (opcional) incide sobre a **base após desconto**, com percentual configurável.
 */

export interface TotaisComandaInput {
  subtotalServicos: number
  subtotalProdutos: number
  descontoModo: ComandaDescontoModo
  descontoValor: number
  taxaServicoAplicar: boolean
  taxaServicoPercentual: number
}

export interface TotaisComandaResult {
  subtotalServicos: number
  subtotalProdutos: number
  baseBruta: number
  valorDesconto: number
  baseAposDesconto: number
  valorTaxaServico: number
  totalFinal: number
}

export function calcularTotaisComanda(input: TotaisComandaInput): TotaisComandaResult {
  const subtotalServicos = round2(input.subtotalServicos)
  const subtotalProdutos = round2(input.subtotalProdutos)
  const baseBruta = round2(subtotalServicos + subtotalProdutos)

  let valorDesconto = 0
  if (input.descontoModo === 'percentual' && input.descontoValor > 0) {
    const p = Math.min(100, Math.max(0, input.descontoValor))
    valorDesconto = round2((baseBruta * p) / 100)
  } else if (input.descontoModo === 'fixo' && input.descontoValor > 0) {
    valorDesconto = round2(Math.min(input.descontoValor, baseBruta))
  }

  const baseAposDesconto = round2(Math.max(0, baseBruta - valorDesconto))

  let valorTaxaServico = 0
  if (input.taxaServicoAplicar && input.taxaServicoPercentual > 0) {
    const t = Math.min(100, Math.max(0, input.taxaServicoPercentual))
    valorTaxaServico = round2((baseAposDesconto * t) / 100)
  }

  const totalFinal = round2(baseAposDesconto + valorTaxaServico)

  return {
    subtotalServicos,
    subtotalProdutos,
    baseBruta,
    valorDesconto,
    baseAposDesconto,
    valorTaxaServico,
    totalFinal,
  }
}

/** Qualquer linha que exponha `subtotal` (serviço ou produto na comanda). */
export type ComandaLinhaComSubtotal = { subtotal: number }

export interface CalcularTotaisDeLinhasInput {
  servicos: ComandaLinhaComSubtotal[]
  produtos: ComandaLinhaComSubtotal[]
  descontoModo: ComandaDescontoModo
  /** Percentual (0–100) ou valor em R$, conforme `descontoModo`. */
  descontoValor: number
  taxaServicoAplicar: boolean
  taxaServicoPercentual: number
}

/** Soma `subtotal` das linhas de serviço e de produto (arredondado a 2 casas). */
export function somarSubtotaisDeLinhas(
  servicos: ComandaLinhaComSubtotal[],
  produtos: ComandaLinhaComSubtotal[],
): Pick<TotaisComandaResult, 'subtotalServicos' | 'subtotalProdutos' | 'baseBruta'> {
  const subtotalServicos = round2(
    servicos.reduce((acc, s) => acc + (Number.isFinite(s.subtotal) ? s.subtotal : 0), 0),
  )
  const subtotalProdutos = round2(
    produtos.reduce((acc, p) => acc + (Number.isFinite(p.subtotal) ? p.subtotal : 0), 0),
  )
  const baseBruta = round2(subtotalServicos + subtotalProdutos)
  return { subtotalServicos, subtotalProdutos, baseBruta }
}

/**
 * Mesma regra que {@link calcularTotaisComanda}, recebendo listas com `subtotal` por linha
 * (equivalente ao `reduce` do seu pseudo-código `calcularTotais`).
 */
export function calcularTotaisDeLinhas(input: CalcularTotaisDeLinhasInput): TotaisComandaResult {
  const { subtotalServicos, subtotalProdutos } = somarSubtotaisDeLinhas(input.servicos, input.produtos)
  return calcularTotaisComanda({
    subtotalServicos,
    subtotalProdutos,
    descontoModo: input.descontoModo,
    descontoValor: input.descontoValor,
    taxaServicoAplicar: input.taxaServicoAplicar,
    taxaServicoPercentual: input.taxaServicoPercentual,
  })
}

function round2(n: number) {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100
}
