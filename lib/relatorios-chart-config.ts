import type { ChartConfig } from '@/components/ui/chart'

/** Paleta dos relatórios — alinhada ao design system (`--ds-*` em `app/globals.css`). */
export const relatoriosChartColors = {
  primary: 'var(--ds-color-primary)',
  secondary: 'var(--ds-color-secondary-light)',
  tertiary: 'var(--ds-color-success)',
  quaternary: 'var(--ds-color-chart-violet)',
  background: 'var(--ds-color-bg)',
  grid: 'var(--ds-color-border)',
  text: 'var(--ds-color-text-secondary)',
} as const

export const relatoriosChartFont = {
  family: 'var(--font-sans), ui-sans-serif, system-ui, sans-serif',
  size: 12,
} as const

export const relatoriosChartAnimation = {
  duration: 1000,
  /** Recharts aceita sobretudo ease / linear / ease-in / ease-out / ease-in-out. */
  easing: 'ease-out' as const,
}

/**
 * Configuração global sugerida para gráficos de relatórios.
 * `animation.easing` segue o pedido de produto; em Recharts use `relatoriosChartAnimation.easing` no componente.
 */
export const chartConfig = {
  colors: relatoriosChartColors,
  font: relatoriosChartFont,
  animation: {
    duration: 1000,
    easing: 'easeOutQuart' as const,
  },
} as const

/** Props de animação para passar em `<Line animationDuration={...} animationEasing={...} />` etc. */
export const relatoriosRechartsAnimationProps = {
  isAnimationActive: true,
  animationDuration: relatoriosChartAnimation.duration,
  animationEasing: relatoriosChartAnimation.easing,
} as const

/** Séries — uso com `ChartContainer` (shadcn/recharts). */
export const tendenciasYoYChartConfig = {
  anoAtual: { label: 'Ano atual', color: relatoriosChartColors.primary },
  anoAnterior: { label: 'Ano anterior', color: relatoriosChartColors.text },
} satisfies ChartConfig

export const tendenciasStackChartConfig = {
  cortes: { label: 'Cortes', color: relatoriosChartColors.tertiary },
  barbas: { label: 'Barbas', color: relatoriosChartColors.primary },
  outros: { label: 'Outros', color: relatoriosChartColors.text },
  produtos: { label: 'Produtos', color: relatoriosChartColors.secondary },
} satisfies ChartConfig

export const tendenciasPrevisaoChartConfig = {
  historico: { label: 'Histórico', color: relatoriosChartColors.primary },
  previsto: { label: 'Previsão', color: relatoriosChartColors.quaternary },
} satisfies ChartConfig
