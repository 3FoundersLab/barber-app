'use client'

import { Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { estoqueCirculoCategoriaClass, estoqueIconeCategoria } from '@/lib/estoque-categoria-icons'
import { labelNivelEstoque, nivelEstoquePorQuantidade } from '@/lib/estoque-produto-utils'
import { cn } from '@/lib/utils'
import type { EstoqueProduto } from '@/types/estoque-produto'

interface EstoqueProdutoCardProps {
  produto: EstoqueProduto
  onEdit: (produto: EstoqueProduto) => void
  onExcluir: (produto: EstoqueProduto) => void
  onDeltaQuantidade: (id: string, delta: number) => void
  className?: string
}

function badgeNivelClass(nivel: ReturnType<typeof nivelEstoquePorQuantidade>) {
  switch (nivel) {
    case 'normal':
      return 'border-emerald-600/25 bg-emerald-500/12 text-emerald-900 dark:border-emerald-400/35 dark:bg-emerald-500/18 dark:text-emerald-50'
    case 'baixo':
      return 'border-amber-600/30 bg-amber-500/14 text-amber-950 dark:border-amber-400/40 dark:bg-amber-500/16 dark:text-amber-50'
    case 'critico':
      return 'border-red-600/35 bg-red-500/12 text-red-900 dark:border-red-400/45 dark:bg-red-500/18 dark:text-red-50'
  }
}

function dotNivelClass(nivel: ReturnType<typeof nivelEstoquePorQuantidade>) {
  switch (nivel) {
    case 'normal':
      return 'bg-emerald-600 dark:bg-emerald-400'
    case 'baixo':
      return 'bg-amber-600 dark:bg-amber-400'
    case 'critico':
      return 'bg-red-600 dark:bg-red-400'
  }
}

export function EstoqueProdutoCard({
  produto,
  onEdit,
  onExcluir,
  onDeltaQuantidade,
  className,
}: EstoqueProdutoCardProps) {
  const nivel = nivelEstoquePorQuantidade(produto.quantidade)
  const Icon = estoqueIconeCategoria(produto.categoria)
  const circleBg = estoqueCirculoCategoriaClass(produto.categoria)

  return (
    <Card
      className={cn(
        'group flex h-full cursor-pointer flex-col border-border/80 bg-card/95 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
      onClick={() => onEdit(produto)}
    >
      <CardContent className="relative flex flex-1 flex-col gap-2 p-2.5 pt-3 sm:p-3">
        <div className="absolute right-1.5 top-1.5 flex gap-0.5 sm:right-2 sm:top-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            aria-label="Editar produto"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(produto)
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            aria-label="Excluir produto"
            onClick={(e) => {
              e.stopPropagation()
              onExcluir(produto)
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex justify-center pt-0.5">
          <div
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-full sm:h-16 sm:w-16',
              circleBg,
            )}
          >
            <Icon
              className="h-8 w-8 text-primary sm:h-9 sm:w-9"
              strokeWidth={1.5}
              aria-hidden
            />
          </div>
        </div>

        <div className="min-w-0 space-y-0.5 px-0.5 text-center">
          <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-foreground sm:text-[13px]">
            {produto.nome}
          </h3>
          <p className="text-[10px] text-muted-foreground sm:text-xs">{produto.categoria}</p>
        </div>

        <div className="mt-auto space-y-2">
          <div className="text-center">
            <p className="text-xl font-bold tabular-nums tracking-tight text-foreground sm:text-2xl">
              {produto.quantidade}
            </p>
            <p className="text-[10px] leading-tight text-muted-foreground sm:text-xs">un. em estoque</p>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <span
              className={cn('h-1.5 w-1.5 shrink-0 rounded-full sm:h-2 sm:w-2', dotNivelClass(nivel))}
              aria-hidden
            />
            <Badge
              variant="outline"
              className={cn('px-1.5 py-0 text-[10px] font-medium sm:text-xs', badgeNivelClass(nivel))}
            >
              {labelNivelEstoque(nivel)}
            </Badge>
          </div>

          <div
            className="flex items-center justify-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 border-border/80"
              aria-label="Remover uma unidade"
              onClick={() => onDeltaQuantidade(produto.id, -1)}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0 border-border/80"
              aria-label="Adicionar uma unidade"
              onClick={() => onDeltaQuantidade(produto.id, 1)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
