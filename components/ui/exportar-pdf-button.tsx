'use client'

import { useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Download, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export interface ExportarPDFButtonProps {
  /** `id` do elemento raiz a capturar (deve existir no DOM). */
  conteudoId: string
  /** Nome do ficheiro (com ou sem `.pdf`). */
  nomeArquivo: string
  titulo?: string
  disabled?: boolean
  className?: string
}

export function ExportarPDFButton({
  conteudoId,
  nomeArquivo,
  titulo = 'Exportar PDF',
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
      const { exportHtmlElementToPdf } = await import('@/lib/export-html-to-pdf')
      await exportHtmlElementToPdf(el, nomeArquivo)
      setEstado('pronto')
      window.setTimeout(() => setEstado('idle'), 2800)
    } catch {
      toast({
        title: 'Erro ao gerar PDF',
        description: 'Tente novamente ou reduza o zoom da página.',
        variant: 'destructive',
      })
      setEstado('idle')
    }
  }, [conteudoId, nomeArquivo])

  const busy = estado === 'gerando'

  return (
    <motion.button
      type="button"
      onClick={() => void exportar()}
      disabled={disabled || busy}
      whileHover={disabled || busy ? undefined : { scale: 1.02 }}
      whileTap={disabled || busy ? undefined : { scale: 0.98 }}
      className={cn(
        'relative inline-flex min-h-[2.5rem] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-200',
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
      <AnimatePresence mode="wait" initial={false}>
        {estado === 'idle' && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2"
          >
            <Download className="size-[1.125rem] shrink-0" strokeWidth={2} aria-hidden />
            <span>{titulo}</span>
          </motion.span>
        )}
        {estado === 'gerando' && (
          <motion.span
            key="gerando"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="size-[1.125rem] shrink-0 animate-spin" aria-hidden />
            <span>A gerar PDF…</span>
          </motion.span>
        )}
        {estado === 'pronto' && (
          <motion.span
            key="pronto"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2"
          >
            <Check className="size-[1.125rem] shrink-0" strokeWidth={2.5} aria-hidden />
            <span>PDF descarregado</span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
