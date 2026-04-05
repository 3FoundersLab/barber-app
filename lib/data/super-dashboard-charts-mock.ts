/**
 * Dados mockados da seção de gráficos do Super Admin.
 * Substituir por chamadas à API mantendo os formatos exportados abaixo.
 */

import type { BarbeariasMensalAbsoluto } from '@/lib/barbearias-stacked-chart'

/** Resumo estático legado (referência); o gráfico mensal usa `mockBarbeariasMensalPlano`. */
export const mockBarbeariasPlanoStatus = {
  comPlanoAtivo: 4,
  comPlanoInativo: 2,
} as const

export type BarbeariasPlanoStatusMock = typeof mockBarbeariasPlanoStatus

/**
 * Mock anual (Jan–Dez): ativos + inativos por mês → barras 100% empilhadas.
 * Substituir pela API mantendo `BarbeariasMensalAbsoluto[]`.
 */
export const mockBarbeariasMensalPlano = [
  { month: 'Jan', ativos: 4, inativos: 2 },
  { month: 'Fev', ativos: 5, inativos: 3 },
  { month: 'Mar', ativos: 6, inativos: 2 },
  { month: 'Abr', ativos: 7, inativos: 1 },
  { month: 'Mai', ativos: 8, inativos: 2 },
  { month: 'Jun', ativos: 9, inativos: 1 },
  { month: 'Jul', ativos: 9, inativos: 2 },
  { month: 'Ago', ativos: 10, inativos: 1 },
  { month: 'Set', ativos: 10, inativos: 2 },
  { month: 'Out', ativos: 11, inativos: 2 },
  { month: 'Nov', ativos: 11, inativos: 1 },
  { month: 'Dez', ativos: 12, inativos: 2 },
] as const satisfies readonly BarbeariasMensalAbsoluto[]

export type BarbeariasMensalPlanoMockRow = (typeof mockBarbeariasMensalPlano)[number]

export const mockAssinaturasPorPlano = [
  { segment: 'basico' as const, name: 'Básico', value: 12 },
  { segment: 'profissional' as const, name: 'Profissional', value: 8 },
  { segment: 'premium' as const, name: 'Premium', value: 5 },
] as const

export type AssinaturaPorPlanoRow = (typeof mockAssinaturasPorPlano)[number]

/** Série anual mock (Jan–Dez) para o card MRR estimado; substituir pela API. */
export const mockMrrMensal = [
  { month: 'Jan', value: 1800 },
  { month: 'Fev', value: 2200 },
  { month: 'Mar', value: 2600 },
  { month: 'Abr', value: 3100 },
  { month: 'Mai', value: 3600 },
  { month: 'Jun', value: 4200 },
  { month: 'Jul', value: 4600 },
  { month: 'Ago', value: 5100 },
  { month: 'Set', value: 5700 },
  { month: 'Out', value: 6300 },
  { month: 'Nov', value: 6900 },
  { month: 'Dez', value: 7600 },
] as const

export type MrrMensalRow = (typeof mockMrrMensal)[number]
