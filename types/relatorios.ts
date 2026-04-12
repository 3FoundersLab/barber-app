/**
 * Tipos de domínio para relatórios de performance da barbearia.
 * Complementam `RelatorioPeriodoPreset` em `@/lib/relatorios-range` (UI usa `7d` / `30d` / `mes_anterior`).
 */

import type { RelatorioPeriodoPreset } from '@/lib/relatorios-range'

/** Período canónico (API / agregações). */
export type Periodo =
  | 'hoje'
  | 'ontem'
  | '7dias'
  | '30dias'
  | 'mes'
  | 'mesPassado'
  | 'personalizado'

/** Mapeamento opcional para o preset já usado no dashboard. */
export const PERIODO_PARA_PRESET_UI = {
  hoje: 'hoje',
  ontem: 'ontem',
  '7dias': '7d',
  '30dias': '30d',
  mes: 'mes',
  mesPassado: 'mes_anterior',
  personalizado: 'personalizado',
} as const satisfies Record<Periodo, RelatorioPeriodoPreset>

export type FiltrosRelatorio = {
  periodo: Periodo
  dataInicio?: Date
  dataFim?: Date
  compararPeriodoAnterior: boolean
  /** UUID da barbearia / unidade no Supabase. */
  unidadeId?: string
}

export type KPIFormato = 'moeda' | 'numero' | 'percentual'

export type KPITendencia = 'up' | 'down' | 'neutral'

export type KPICor = 'amber' | 'green' | 'blue' | 'purple' | 'red'

export interface KPI {
  id: string
  titulo: string
  valor: number
  formato: KPIFormato
  /** Percentual vs período anterior (ex.: +12.5 ou -3.2). */
  variacao?: number
  tendencia: KPITendencia
  /** Nome do ícone (ex. Lucide), ex.: `TrendingUp`. */
  icone: string
  cor: KPICor
}

export interface DadoGrafico {
  label: string
  valor: number
  categoria?: string
  data?: Date
}

export interface RankingBarbeiro {
  posicao: number
  /** UUID do barbeiro. */
  barbeiroId: string
  nome: string
  foto?: string
  faturamento: number
  atendimentos: number
  ticketMedio: number
  /** Média de avaliação 0–5 ou proxy operacional. */
  avaliacao: number
  clientesRetidos: number
}

export type SegmentoClienteRelatorio =
  | 'vip'
  | 'novo'
  | 'emRisco'
  | 'ocasional'
  | 'inativo'

export interface SegmentacaoCliente {
  segmento: SegmentoClienteRelatorio
  quantidade: number
  percentual: number
  valorMedio: number
  descricao: string
}

export type AlertaInteligenteTipo = 'positivo' | 'alerta' | 'oportunidade'

export interface AlertaInteligente {
  tipo: AlertaInteligenteTipo
  titulo: string
  descricao: string
  valor?: number
  acaoRecomendada?: string
}

export interface RelatorioCompleto {
  periodo: { inicio: Date; fim: Date }
  kpis: KPI[]
  faturamentoDiario: DadoGrafico[]
  mixReceita: DadoGrafico[]
  ocupacaoHeatmap: { dia: string; hora: number; intensidade: number }[]
  horariosPico: DadoGrafico[]
  rankingBarbeiros: RankingBarbeiro[]
  segmentacaoClientes: SegmentacaoCliente[]
  produtosTop: DadoGrafico[]
  alertas: AlertaInteligente[]
  comparativoPeriodoAnterior?: {
    faturamento: number
    atendimentos: number
  }
}
