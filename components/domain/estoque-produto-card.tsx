'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { estoqueIconeCategoria } from '@/lib/estoque-categoria-icons'
import { formatCurrency } from '@/lib/constants'
import { estoqueCardStatus } from '@/lib/estoque-produto-utils'
import { cn } from '@/lib/utils'
import type { EstoqueProduto } from '@/types/estoque-produto'

/**
 * Contrato próximo ao spec `ProdutoCardProps`: `id` string (UUID), `minimo` = quantidade mínima,
 * ícone derivado da categoria (mapa Lucide); `precoCusto` opcional não é exibido no card.
 */
export interface EstoqueProdutoCardProps {
  produto: EstoqueProduto
  onEdit: (produto: EstoqueProduto) => void
  onExcluir: (produto: EstoqueProduto) => void
  className?: string
  readOnly?: boolean
}

export function EstoqueProdutoCard({
  produto,
  onEdit,
  onExcluir,
  className,
  readOnly = false,
}: EstoqueProdutoCardProps) {
  const status = estoqueCardStatus(produto.quantidade, produto.minimo)
  const Icon = estoqueIconeCategoria(produto.categoria)
  const q = Math.max(0, Math.floor(produto.quantidade))

  return (
    <div
      className={cn(
        'relative flex h-full flex-col rounded-xl border-2 bg-card p-4 shadow-sm transition-all hover:shadow-md',
        status === 'esgotado' &&
          'border-red-200 bg-red-50/90 opacity-[0.65] dark:border-red-900/55 dark:bg-red-950/30',
        status === 'baixo' &&
          'border-amber-200 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-950/25',
        status === 'normal' && 'border-border/80 dark:border-border',
        className,
      )}
    >
      {!readOnly ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-destructive"
          aria-label="Excluir produto"
          onClick={() => onExcluir(produto)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ) : null}

      <div className="flex flex-col items-center text-center">
        <div
          className={cn(
            'mb-3 flex h-16 w-16 shrink-0 items-center justify-center rounded-full',
            status === 'esgotado' && 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400',
            status === 'baixo' && 'bg-amber-100 text-amber-600 dark:bg-amber-950/55 dark:text-amber-400',
            status === 'normal' && 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
          )}
        >
          <Icon className="h-8 w-8" strokeWidth={1.5} aria-hidden />
        </div>

        <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {produto.nome}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">{produto.categoria}</p>

        <p className="mb-1 text-lg font-bold tabular-nums text-foreground">
          {formatCurrency(produto.precoVenda)}
        </p>

        <div
          className={cn(
            'mb-3 rounded-full px-2.5 py-1 text-sm font-medium',
            status === 'esgotado' &&
              'bg-red-200 text-red-900 dark:bg-red-900/45 dark:text-red-100',
            status === 'baixo' &&
              'bg-amber-200 text-amber-950 dark:bg-amber-900/40 dark:text-amber-50',
            status === 'normal' &&
              'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/45 dark:text-emerald-100',
          )}
          aria-label={
            status === 'esgotado'
              ? 'Produto esgotado'
              : status === 'baixo'
                ? `Estoque baixo: ${q} unidades`
                : `${q} unidades em estoque`
          }
        >
          {status === 'esgotado' && (
            <span className="inline-flex items-center justify-center gap-1">
              <span aria-hidden>🚫</span>
              <span>Esgotado</span>
            </span>
          )}
          {status === 'baixo' && (
            <span className="inline-flex items-center justify-center gap-1">
              <span aria-hidden>⚠️</span>
              <span>{q} unid.</span>
            </span>
          )}
          {status === 'normal' && <span>{q} unid.</span>}
        </div>

        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto p-0 text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          disabled={readOnly}
          onClick={() => onEdit(produto)}
        >
          Editar
        </Button>
      </div>
    </div>
  )
}
