'use client'

import { Minus, Pencil, Plus } from 'lucide-react'
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
  onDeltaQuantidade: (id: number, delta: number) => void
  className?: string
}

function badgeNivelClass(nivel: ReturnType<typeof nivelEstoquePorQuantidade>) {
  switch (nivel) {
    case 'normal':
      return 'border-success/30 bg-success/15 text-success-foreground'
    case 'baixo':
      return 'border-warning/40 bg-warning/25 text-warning-foreground'
    case 'critico':
      return 'border-destructive/40 bg-destructive/15 text-destructive'
  }
}

function dotNivelClass(nivel: ReturnType<typeof nivelEstoquePorQuantidade>) {
  switch (nivel) {
    case 'normal':
      return 'bg-emerald-500'
    case 'baixo':
      return 'bg-amber-400'
    case 'critico':
      return 'bg-red-500'
  }
}

export function EstoqueProdutoCard({
  produto,
  onEdit,
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
      <CardContent className="relative flex flex-1 flex-col gap-3 p-4 pt-5">
        <div className="absolute right-3 top-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            aria-label="Editar produto"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(produto)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex justify-center pt-1">
          <div
            className={cn(
              'flex h-20 w-20 shrink-0 items-center justify-center rounded-full',
              circleBg,
            )}
          >
            <Icon className="h-12 w-12 text-primary" strokeWidth={1.5} aria-hidden />
          </div>
        </div>

        <div className="min-w-0 space-y-1 text-center">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
            {produto.nome}
          </h3>
          <p className="text-xs text-muted-foreground">{produto.categoria}</p>
        </div>

        <div className="mt-auto space-y-3">
          <div className="text-center">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {produto.quantidade}
            </p>
            <p className="text-xs text-muted-foreground">unidades em estoque</p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span
              className={cn('h-2 w-2 shrink-0 rounded-full', dotNivelClass(nivel))}
              aria-hidden
            />
            <Badge variant="outline" className={cn('font-medium', badgeNivelClass(nivel))}>
              {labelNivelEstoque(nivel)}
            </Badge>
          </div>

          <div
            className="flex items-center justify-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 border-border/80"
              aria-label="Remover uma unidade"
              onClick={() => onDeltaQuantidade(produto.id, -1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 border-border/80"
              aria-label="Adicionar uma unidade"
              onClick={() => onDeltaQuantidade(produto.id, 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
