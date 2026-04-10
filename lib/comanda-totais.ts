import type { ComandaDescontoModo } from '@/types/comanda'

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

function round2(n: number) {
  return Math.round((Number.isFinite(n) ? n : 0) * 100) / 100
}
