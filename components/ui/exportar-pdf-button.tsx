'use client'

import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { exportHtmlElementToPdf } from '@/lib/export-html-to-pdf'
import type { PDFConfigInput, TipoRelatorioPdf } from '@/lib/pdfTemplate'
import { buildPdfConfig } from '@/lib/pdfTemplate'

export interface ExportarPDFButtonProps {
  /** `id` do elemento raiz a capturar (deve existir no DOM). */
  conteudoId: string
  /** Nome do ficheiro (com ou sem `.pdf`). */
  nomeArquivo: string
  titulo?: string
  tipoRelatorio: TipoRelatorioPdf
  /** Metadados da capa (data de geração é preenchida no momento da exportação). */
  pdfMeta: PDFConfigInput
  disabled?: boolean
  className?: string
}

export function ExportarPDFButton({
  conteudoId,
  nomeArquivo,
  titulo = 'Exportar PDF',
  tipoRelatorio,
  pdfMeta,
  disabled = false,
  className,
}: ExportarPDFButtonProps) {
  const [estado, setEstado] = useState<'idle' | 'gerando' | 'pronto'>('idle')

  const exportar = useCallback(async () => {
    const el = document.getElementById(conteudoId)
    if (!el) {
      toast({
        title: 'Não foi possível exportar',
        description: 'Conteúdo do relatório não encontrado.',
        variant: 'destructive',
      })
      return
    }

    setEstado('gerando')
    try {
      const config = buildPdfConfig({ ...pdfMeta, dataGeracao: new Date() })
      await exportHtmlElementToPdf(el, nomeArquivo, { config, tipoRelatorio })
      setEstado('pronto')
      window.setTimeout(() => setEstado('idle'), 2800)
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err)
      const hint =
        /zoom|scale|devicePixelRatio/i.test(raw) || /security|taint|canvas/i.test(raw)
          ? ' Defina o zoom do navegador em 100% e tente de novo.'
          : /oklab|oklch|color-mix|unsupported color|parse/i.test(raw)
            ? ' Recarregue a página e tente outra vez.'
            : /chunk|failed to load|loading css chunk/i.test(raw)
              ? ' Atualize a página com Ctrl+F5 (cache) ou aguarde o deploy terminar.'
              : ''
      const base =
        raw && raw.length < 180 ? raw : 'Não foi possível gerar o ficheiro. Tente de novo em instantes.'
      toast({
        title: 'Erro ao gerar PDF',
        description: `${base}${hint}`.trim(),
        variant: 'destructive',
      })
      setEstado('idle')
    }
  }, [conteudoId, nomeArquivo, pdfMeta, tipoRelatorio])

  const busy = estado === 'gerando'

  const label =
    estado === 'idle' ? titulo : estado === 'gerando' ? 'A gerar PDF…' : 'PDF descarregado'

  return (
    <motion.button
      type="button"
      onClick={() => void exportar()}
      disabled={disabled || busy}
      whileHover={disabled || busy ? undefined : { scale: 1.02 }}
      whileTap={disabled || busy ? undefined : { scale: 0.98 }}
      layout
      className={cn(
        'vg-body relative inline-flex min-h-8 min-w-[9.25rem] shrink-0 items-center justify-center gap-1 rounded-full px-3 py-1.5 font-medium transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        estado === 'idle' && [
          'bg-primary text-primary-foreground',
          'shadow-premium hover:bg-primary/92',
          'dark:shadow-[0_4px_14px_rgb(0_0_0_/_0.25)]',
        ],
        estado === 'gerando' && ['cursor-wait bg-muted text-muted-foreground'],
        estado === 'pronto' && ['bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'],
        className,
      )}
    >
      <span className="inline-flex items-center justify-center gap-1">
        {estado === 'idle' ? (
          <Download className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        ) : estado === 'gerando' ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Check className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
        )}
        <motion.span
          key={estado}
          initial={{ opacity: 0.85 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="whitespace-nowrap text-center"
        >
          {label}
        </motion.span>
      </span>
    </motion.button>
  )
}
