'use client'

import { useCallback, useState } from 'react'
import type { PDFConfigInput, TipoRelatorioPdf } from '@/lib/pdfTemplate'
import { buildPdfConfig } from '@/lib/pdfTemplate'

/**
 * Hook padrão do projeto para exportar um bloco HTML a PDF.
 * Usa `jspdf` + `html2canvas` em `lib/export-html-to-pdf.ts` (não html2pdf.js),
 * com capa e rodapé definidos em `lib/pdfTemplate.ts`.
 */
export function useExportPDF() {
  const [isExporting, setIsExporting] = useState(false)

  const exportar = useCallback(
    async (
      elementId: string,
      nomeArquivo: string,
      tipoRelatorio: TipoRelatorioPdf,
      meta: PDFConfigInput,
    ) => {
      setIsExporting(true)
      try {
        const element = document.getElementById(elementId)
        if (!element) {
          throw new Error('Elemento não encontrado')
        }
        const config = buildPdfConfig({ ...meta, dataGeracao: new Date() })
        const { exportHtmlElementToPdf } = await import('@/lib/export-html-to-pdf')
        await exportHtmlElementToPdf(element, nomeArquivo, { config, tipoRelatorio })
        return true
      } finally {
        setIsExporting(false)
      }
    },
    [],
  )

  return { exportar, isExporting }
}
