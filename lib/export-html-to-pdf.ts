import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * Captura um elemento HTML e gera PDF A4 (várias páginas se necessário).
 * Usa fatias do canvas para evitar distorção em relatórios longos.
 */
export async function exportHtmlElementToPdf(element: HTMLElement, filename: string): Promise<void> {
  const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`

  const rect = element.getBoundingClientRect()
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#fafaf9',
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
  const margin = 36
  const maxW = pageWidth - margin * 2
  const maxH = pageHeight - margin * 2

  const scale = maxW / canvas.width
  const scaledH = canvas.height * scale

  pdf.setFontSize(8)
  pdf.setTextColor(120, 113, 108)
  pdf.text('BarberTool', margin, margin - 6)

  if (scaledH <= maxH) {
    const img = canvas.toDataURL('image/jpeg', 0.92)
    pdf.addImage(img, 'JPEG', margin, margin, maxW, scaledH)
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
    const img = sliceCanvas.toDataURL('image/jpeg', 0.92)
    const sliceHpt = slicePx * scale

    if (page > 0) pdf.addPage()
    pdf.addImage(img, 'JPEG', margin, margin, maxW, sliceHpt)
    srcY += slicePx
    page += 1
  }

  pdf.save(safeName)
}
