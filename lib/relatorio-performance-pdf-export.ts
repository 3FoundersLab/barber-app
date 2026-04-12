import { format } from 'date-fns'

/**
 * Gera PDF A4 a partir de um nó HTML (idealmente `#relatorio-performance-pdf-root`).
 * Import dinâmico para não carregar html2pdf no bundle inicial.
 */
export async function exportRelatorioPerformancePdf(element: HTMLElement): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default
  const filename = `relatorio-barbearia-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`
  await html2pdf()
    .set({
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(element)
    .save()
}
