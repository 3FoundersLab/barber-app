import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  PDF_FOOTER_BAND_PT,
  PDF_PAGE_MARGINS_PT,
  formatDataGeracaoPt,
  hexToRgb,
  pdfPadrao,
  tituloRelatorioPorTipo,
  type PDFConfig,
  type TipoRelatorioPdf,
} from '@/lib/pdfTemplate'

export interface ExportHtmlToPdfOptions {
  config: PDFConfig
  tipoRelatorio: TipoRelatorioPdf
}

function drawCover(pdf: jsPDF, config: PDFConfig, tipo: TipoRelatorioPdf): void {
  const m = PDF_PAGE_MARGINS_PT
  const pageW = pdf.internal.pageSize.getWidth()
  const contentW = pageW - m.left - m.right
  let y = m.top + 20

  const [pr, pg, pb] = hexToRgb(pdfPadrao.colors.primary)
  const [tr, tg, tb] = hexToRgb(pdfPadrao.colors.text)
  const [sr, sg, sb] = hexToRgb(pdfPadrao.colors.textSecondary)

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(16)
  pdf.setTextColor(pr, pg, pb)
  pdf.text('BARBERTOOL', m.left, y)
  y += 32

  pdf.setFontSize(11)
  pdf.text(`RELATÓRIO DE ${tituloRelatorioPorTipo(tipo)}`, m.left, y)
  y += 22

  pdf.setFontSize(17)
  pdf.setTextColor(tr, tg, tb)
  const titleLines = pdf.splitTextToSize(config.titulo, contentW)
  for (const line of titleLines) {
    pdf.text(line, m.left, y)
    y += 18
  }
  y += 4

  if (config.subtitulo.trim()) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(sr, sg, sb)
    const subLines = pdf.splitTextToSize(config.subtitulo.trim(), contentW)
    for (const line of subLines) {
      pdf.text(line, m.left, y)
      y += 12
    }
    y += 10
  }

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.setTextColor(tr, tg, tb)
  const periodoLines = pdf.splitTextToSize(`Período: ${config.periodo}`, contentW)
  for (const line of periodoLines) {
    pdf.text(line, m.left, y)
    y += 13
  }
  const unidadeLines = pdf.splitTextToSize(`Unidade: ${config.unidade}`, contentW)
  for (const line of unidadeLines) {
    pdf.text(line, m.left, y)
    y += 13
  }
  const geradoLines = pdf.splitTextToSize(`Gerado por: ${config.geradoPor}`, contentW)
  for (const line of geradoLines) {
    pdf.text(line, m.left, y)
    y += 13
  }
  pdf.text(`Data: ${formatDataGeracaoPt(config.dataGeracao)}`, m.left, y)
  y += 28

  const [br, bg, bb] = hexToRgb(pdfPadrao.colors.border)
  pdf.setDrawColor(br, bg, bb)
  pdf.setLineWidth(0.4)
  pdf.line(m.left, y, pageW - m.right, y)
  y += 18

  pdf.setFontSize(8)
  pdf.setTextColor(sr, sg, sb)
  pdf.text('BarberTool - Sistema de Gestão para Barbearias', m.left, y)
  y += 11
  pdf.text('www.barbertool.com.br', m.left, y)
}

function drawFooter(pdf: jsPDF, pageNum: number, totalPages: number, dataRef: Date): void {
  const pageH = pdf.internal.pageSize.getHeight()
  const pageW = pdf.internal.pageSize.getWidth()
  const m = PDF_PAGE_MARGINS_PT
  const [sr, sg, sb] = hexToRgb(pdfPadrao.colors.textSecondary)

  const baseY = pageH - m.bottom + 14
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(8)
  pdf.setTextColor(sr, sg, sb)

  const line1 = `Página ${pageNum} de ${totalPages}`
  const line2 = `BarberTool • Relatório gerado em ${formatDataGeracaoPt(dataRef)} • Confidencial`

  pdf.text(line1, pageW / 2, baseY - 5, { align: 'center' })
  pdf.text(line2, pageW / 2, baseY + 5, { align: 'center' })
}

/**
 * Captura um elemento HTML e gera PDF A4 com capa institucional e rodapé paginado.
 * O corpo é renderizado como imagem (fatias) para relatórios longos.
 */
export async function exportHtmlElementToPdf(
  element: HTMLElement,
  filename: string,
  options: ExportHtmlToPdfOptions,
): Promise<void> {
  const { config, tipoRelatorio } = options
  const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`
  const bg = pdfPadrao.colors.background

  const rect = element.getBoundingClientRect()
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: bg,
    logging: false,
    width: element.scrollWidth,
    height: element.scrollHeight,
    windowWidth: Math.max(element.scrollWidth, Math.ceil(rect.width)),
    windowHeight: element.scrollHeight,
    scrollX: 0,
    scrollY: 0,
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const m = PDF_PAGE_MARGINS_PT

  const maxW = pageWidth - m.left - m.right
  const maxH = pageHeight - m.top - m.bottom - PDF_FOOTER_BAND_PT

  const scale = maxW / canvas.width
  const scaledH = canvas.height * scale

  const contentPages =
    scaledH <= maxH ? 1 : Math.ceil(scaledH / maxH) || 1
  const totalPages = 1 + contentPages

  drawCover(pdf, config, tipoRelatorio)
  drawFooter(pdf, 1, totalPages, config.dataGeracao)

  const jpegQ = 0.95

  if (scaledH <= maxH) {
    const img = canvas.toDataURL('image/jpeg', jpegQ)
    pdf.addPage()
    pdf.addImage(img, 'JPEG', m.left, m.top, maxW, scaledH)
    drawFooter(pdf, 2, totalPages, config.dataGeracao)
    pdf.save(safeName)
    return
  }

  let srcY = 0
  let page = 0
  while (srcY < canvas.height) {
    const slicePx = Math.min(canvas.height - srcY, Math.ceil(maxH / scale))
    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = slicePx
    const ctx = sliceCanvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D não disponível')
    ctx.drawImage(canvas, 0, srcY, canvas.width, slicePx, 0, 0, canvas.width, slicePx)
    const img = sliceCanvas.toDataURL('image/jpeg', jpegQ)
    const sliceHpt = slicePx * scale

    pdf.addPage()
    pdf.addImage(img, 'JPEG', m.left, m.top, maxW, sliceHpt)
    const pageNum = 2 + page
    drawFooter(pdf, pageNum, totalPages, config.dataGeracao)
    srcY += slicePx
    page += 1
  }

  pdf.save(safeName)
}
