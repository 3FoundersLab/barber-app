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

async function waitForPaint(): Promise<void> {
  await new Promise<void>((r) => {
    requestAnimationFrame(() => requestAnimationFrame(() => r()))
  })
}

/**
 * Sintaxes de cor que o html2canvas não parseia (Tailwind v4: oklab, oklch, color-mix…).
 * Nota: `lab(` sozinho não cobre `oklab(` — precisa de entradas explícitas.
 */
const H2C_UNSUPPORTED_COLOR =
  /oklab\s*\(|oklch\s*\(|color-mix\s*\(|\blab\s*\(|\blch\s*\(|hwb\s*\(|color\(|display-p3/i

function stillHasUnsupportedColor(value: string): boolean {
  return H2C_UNSUPPORTED_COLOR.test(value)
}

/** Normaliza para rgb/#hex via Canvas; fallback seguro se o browser devolver outra sintaxe moderna. */
function resolveModernColorToRgb(value: string): string {
  const v = value.trim()
  if (!v || v === 'none' || v === 'transparent') return v
  if (!stillHasUnsupportedColor(v)) {
    if (/^(rgb|rgba|#)/i.test(v)) return v
  }
  try {
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return '#78716c'
    ctx.fillStyle = '#000'
    ctx.fillStyle = v
    const out = ctx.fillStyle
    return typeof out === 'string' && !stillHasUnsupportedColor(out) ? out : '#78716c'
  } catch {
    return '#78716c'
  }
}

function fallbackForProperty(prop: string): string {
  if (prop === 'box-shadow' || prop === 'text-shadow') {
    return '0 2px 8px rgba(28, 25, 23, 0.12)'
  }
  if (prop === 'background' || prop === 'background-image') return 'none'
  if (prop === 'background-color') return pdfPadrao.colors.background
  if (prop === 'color' || prop.endsWith('-color')) return '#1c1917'
  if (prop.includes('border') && prop.includes('color')) return '#d6d3d1'
  return 'transparent'
}

function sanitizePropertyValue(prop: string, value: string): string {
  let v = value
  if (!stillHasUnsupportedColor(v)) return v
  if (prop === 'box-shadow' || prop === 'text-shadow') {
    return '0 2px 8px rgba(28, 25, 23, 0.12)'
  }
  if (prop === 'background' || prop === 'background-image') {
    return 'none'
  }
  v = resolveModernColorToRgb(v)
  if (stillHasUnsupportedColor(v)) {
    v = fallbackForProperty(prop)
  }
  return v
}

/** Segunda passagem: garantir que nenhum inline/atributo no clone ficou com oklab/color-mix. */
function scrubInlineStylesInCloneSubtree(root: HTMLElement): void {
  const visit = (el: Element): void => {
    if (el instanceof HTMLElement && el.style?.length) {
      for (let i = 0; i < el.style.length; i++) {
        const key = el.style.item(i)
        const val = el.style.getPropertyValue(key)
        if (stillHasUnsupportedColor(val)) {
          const fixed = sanitizePropertyValue(key, val)
          try {
            el.style.setProperty(key, fixed, 'important')
          } catch {
            try {
              el.style.removeProperty(key)
            } catch {
              /* ignore */
            }
          }
        }
      }
    }
    if (el instanceof SVGElement) {
      for (const attr of ['fill', 'stroke', 'stop-color']) {
        const raw = el.getAttribute(attr)
        if (raw && stillHasUnsupportedColor(raw)) {
          el.setAttribute(attr, sanitizePropertyValue(attr, raw))
        }
      }
    }
    for (let j = 0; j < el.children.length; j++) {
      visit(el.children[j]!)
    }
  }
  visit(root)
}

/**
 * Remove CSS global do clone (Tailwind usa oklch/lab) e recria o visual via estilos computados
 * já resolvidos pelo browser — evita o parser do html2canvas quebrar em `lab()`.
 */
function isolateExportSubtreeForCanvas(origRoot: HTMLElement, cloneRoot: HTMLElement): void {
  const cloneDoc = cloneRoot.ownerDocument
  if (!cloneDoc) return

  cloneDoc.querySelectorAll('link[rel="stylesheet"]').forEach((n) => n.remove())
  cloneDoc.querySelectorAll('style').forEach((n) => n.remove())

  const html = cloneDoc.documentElement
  const body = cloneDoc.body
  if (html) {
    html.style.setProperty('margin', '0', 'important')
    html.style.setProperty('padding', '0', 'important')
    html.style.setProperty('background', pdfPadrao.colors.background, 'important')
  }
  if (body) {
    body.style.setProperty('margin', '0', 'important')
    body.style.setProperty('padding', '0', 'important')
    body.style.setProperty('background', pdfPadrao.colors.background, 'important')
  }

  function apply(orig: Element | null | undefined, clone: Element | null | undefined): void {
    if (!orig || !clone) return

    if (orig instanceof HTMLElement && clone instanceof HTMLElement) {
      const cs = window.getComputedStyle(orig)
      for (let i = 0; i < cs.length; i++) {
        const key = cs.item(i)
        let val = cs.getPropertyValue(key)
        if (
          (key === 'background' || key === 'background-image') &&
          stillHasUnsupportedColor(val)
        ) {
          val = 'none'
        } else {
          val = sanitizePropertyValue(key, val)
        }
        try {
          clone.style.setProperty(key, val, 'important')
        } catch {
          /* propriedades só-leitura / inválidas como inline */
        }
      }
      clone.style.setProperty('filter', 'none', 'important')
      clone.style.setProperty('backdrop-filter', 'none', 'important')
    } else if (orig instanceof SVGElement && clone instanceof SVGElement) {
      const cs = window.getComputedStyle(orig)
      const fill = cs.fill
      const stroke = cs.stroke
      if (fill && fill !== 'none') {
        clone.setAttribute('fill', sanitizePropertyValue('fill', fill))
      }
      if (stroke && stroke !== 'none') {
        clone.setAttribute('stroke', sanitizePropertyValue('stroke', stroke))
      }
    }

    const oc = orig.children
    const cc = clone.children
    /** O clone do html2canvas pode não espelhar todos os nós (ex.: comentários, nós omitidos). */
    const n = Math.min(oc.length, cc.length)
    for (let i = 0; i < n; i++) {
      const oChild = oc.item(i)
      const cChild = cc.item(i)
      if (oChild && cChild) apply(oChild, cChild)
    }
  }

  apply(origRoot, cloneRoot)
  cloneRoot.style.setProperty('overflow', 'visible', 'important')
  cloneRoot.style.setProperty('height', 'auto', 'important')
  cloneRoot.style.setProperty('max-height', 'none', 'important')
  scrubInlineStylesInCloneSubtree(cloneRoot)
}

async function elementToCanvas(element: HTMLElement, bg: string): Promise<HTMLCanvasElement> {
  const h = Math.max(
    element.scrollHeight,
    element.offsetHeight,
    element.clientHeight,
    Math.ceil(element.getBoundingClientRect().height),
  )
  const w = Math.max(
    element.scrollWidth,
    element.offsetWidth,
    element.clientWidth,
    Math.ceil(element.getBoundingClientRect().width),
  )
  if (w < 1 || h < 1) {
    throw new Error('Área do relatório sem dimensão visível. Recarregue a página e tente de novo.')
  }

  const longSide = Math.max(w, h)
  /** Evita exceder limites de canvas do browser; tenta escalas do melhor para o mais compatível. */
  const scales =
    longSide * 2 > 22_000
      ? [1, 1.15]
      : longSide * 2 > 14_000
        ? [1.25, 1.5, 1]
        : [2, 1.5, 1]

  let lastErr: unknown
  element.scrollIntoView({ block: 'start', inline: 'nearest' })
  await waitForPaint()

  for (const scale of scales) {
    try {
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: bg,
        logging: false,
        foreignObjectRendering: false,
        imageTimeout: 20000,
        removeContainer: true,
        onclone: (clonedDoc) => {
          const clonedRoot = clonedDoc.getElementById(element.id)
          if (clonedRoot) {
            isolateExportSubtreeForCanvas(element, clonedRoot)
          }
        },
      })
      if (canvas.width < 2 || canvas.height < 2) {
        throw new Error('Captura vazia')
      }
      try {
        canvas.toDataURL('image/jpeg', 0.5)
      } catch {
        throw new Error('Não foi possível serializar a captura (conteúdo bloqueado).')
      }
      return canvas
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('Falha ao capturar o relatório para PDF.')
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

  const canvas = await elementToCanvas(element, bg)

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

  const jpegQ = 0.92

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
    if (slicePx <= 0) break
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
