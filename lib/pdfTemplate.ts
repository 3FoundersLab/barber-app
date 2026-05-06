import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Metadados exibidos na capa do PDF (BarberTool). */
export interface PDFConfig {
  titulo: string
  subtitulo: string
  periodo: string
  unidade: string
  geradoPor: string
  dataGeracao: Date
}

export const pdfPadrao = {
  pageSize: 'A4' as const,
  orientation: 'portrait' as const,
  margins: { top: 40, right: 30, bottom: 40, left: 30 },

  colors: {
    primary: '#c2410c',
    primaryLight: '#fff7ed',
    text: '#1c1917',
    textSecondary: '#78716c',
    border: '#e7e5e4',
    background: '#fafaf9',
  },

  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
} as const

export type TipoRelatorioPdf = 'visao_geral' | 'operacional' | 'tendencias'

export function tituloRelatorioPorTipo(tipo: TipoRelatorioPdf): string {
  switch (tipo) {
    case 'visao_geral':
      return 'VISÃO GERAL'
    case 'operacional':
      return 'OPERACIONAL'
    case 'tendencias':
      return 'TENDÊNCIAS'
  }
}

/** Entrada parcial para montar `PDFConfig` (data de geração costuma ser `new Date()` no clique). */
export type PDFConfigInput = Omit<PDFConfig, 'dataGeracao' | 'subtitulo'> & {
  subtitulo?: string
  dataGeracao?: Date
}

export function buildPdfConfig(input: PDFConfigInput): PDFConfig {
  return {
    titulo: input.titulo,
    subtitulo: input.subtitulo ?? '',
    periodo: input.periodo,
    unidade: input.unidade,
    geradoPor: input.geradoPor,
    dataGeracao: input.dataGeracao ?? new Date(),
  }
}

export function formatDataGeracaoPt(d: Date): string {
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim()
  if (h.length !== 6) return [28, 25, 23]
  const n = parseInt(h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Margens do `pdfPadrao` em pontos tipográficos (unit `pt` do jsPDF). */
export const PDF_PAGE_MARGINS_PT = {
  top: (pdfPadrao.margins.top * 72) / 25.4,
  right: (pdfPadrao.margins.right * 72) / 25.4,
  bottom: (pdfPadrao.margins.bottom * 72) / 25.4,
  left: (pdfPadrao.margins.left * 72) / 25.4,
} as const

/** Faixa reservada acima da margem inferior para rodapé (número de página + linha institucional). */
export const PDF_FOOTER_BAND_PT = 52
