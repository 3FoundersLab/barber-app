/**
 * Dados mockados da seção de gráficos do Super Admin.
 * Substituir por chamadas à API mantendo os formatos exportados abaixo.
 */

export const mockBarbeariasPlanoStatus = {
  comPlanoAtivo: 4,
  comPlanoInativo: 2,
} as const

export type BarbeariasPlanoStatusMock = typeof mockBarbeariasPlanoStatus

export function getBarbeariasComparisonChartRows() {
  return [
    {
      key: 'ativas' as const,
      name: 'Plano ativo',
      value: mockBarbeariasPlanoStatus.comPlanoAtivo,
    },
    {
      key: 'inativas' as const,
      name: 'Plano inativo',
      value: mockBarbeariasPlanoStatus.comPlanoInativo,
    },
  ]
}

export const mockAssinaturasPorPlano = [
  { segment: 'basico' as const, name: 'Básico', value: 12 },
  { segment: 'profissional' as const, name: 'Profissional', value: 8 },
  { segment: 'premium' as const, name: 'Premium', value: 5 },
] as const

export type AssinaturaPorPlanoRow = (typeof mockAssinaturasPorPlano)[number]

export const mockMrrMensal = [
  { month: 'Jan', value: 1200 },
  { month: 'Fev', value: 1800 },
  { month: 'Mar', value: 2400 },
  { month: 'Abr', value: 3200 },
  { month: 'Mai', value: 4100 },
  { month: 'Jun', value: 5300 },
] as const

export type MrrMensalRow = (typeof mockMrrMensal)[number]
