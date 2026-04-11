'use client'

import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Brush,
  Cookie,
  CupSoda,
  Droplets,
  FlaskConical,
  Package,
  ScanFace,
  Scissors,
  Sparkles,
  SprayCan,
} from 'lucide-react'
import { formatCurrency } from '@/lib/constants'
import { estoqueCirculoCategoriaClass, estoqueIconeCategoria } from '@/lib/estoque-categoria-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QuantityStepper } from '@/components/ui/quantity-stepper'
import { cn } from '@/lib/utils'

/**
 * Nomes exportados pelo Lucide usados no estoque / mocks.
 * Fora da lista, use a prop `Icon` ou caia no ícone da categoria.
 */
const LUCIDE_ICON_BY_NAME: Record<string, LucideIcon> = {
  Package,
  CupSoda,
  Cookie,
  Sparkles,
  Droplets,
  ScanFace,
  Brush,
  Scissors,
  FlaskConical,
  SprayCan,
}

function resolveCatalogoIcon(
  categoria: string,
  IconProp: LucideIcon | undefined,
  iconeNome: string | undefined,
): LucideIcon {
  if (IconProp) return IconProp
  if (iconeNome && LUCIDE_ICON_BY_NAME[iconeNome]) return LUCIDE_ICON_BY_NAME[iconeNome]
  return estoqueIconeCategoria(categoria)
}

export interface ProdutoCatalogoProps {
  /** UUID no Supabase (no app atual); specs com `number` devem converter. */
  id: string
  nome: string
  categoria: string
  /** Ícone explícito (prioridade sobre `icone` e categoria). */
  Icon?: LucideIcon
  /** Nome do export Lucide, ex.: `CupSoda` (veja `LUCIDE_ICON_BY_NAME`). */
  icone?: string
  precoVenda: number
  /** Se omitido, usa `precoVenda` (ex.: fallback custo). */
  precoExibir?: number
  quantidadeEstoque: number
  /** Quantidade já na comanda (soma das linhas deste produto). */
  quantidadeNaComanda?: number
  /**
   * Quantidade máxima permitida na comanda (ex.: `estoque + committed` da comanda).
   */
  quantidadeMaximaNaComanda: number
  onAdd: () => void
  /** Nova quantidade absoluta na comanda (0 remove a linha no pai). */
  onUpdateQuantidade: (qtd: number) => void
  disabled?: boolean
  /** Modo demo: não trata como esgotado. */
  ignoraEsgotado?: boolean
  /** Limite para aviso “estoque baixo” (padrão 3). */
  limiteEstoqueBaixo?: number
  className?: string
}

/**
 * Linha de produto no catálogo da comanda.
 *
 * Estados:
 * 1. Fora da comanda: botão **+ Adicionar**
 * 2. Na comanda: **stepper** − / qtd / + (ajuste rápido sem ir só em “Selecionados”)
 * 3. Esgotado: opacidade reduzida, ação desabilitada
 * 4. Estoque baixo (≤ limite): badge ⚠️, ainda permite adicionar se couber no teto
 */
export function ProdutoCatalogo({
  id,
  nome,
  categoria,
  Icon: IconProp,
  icone,
  precoVenda,
  precoExibir,
  quantidadeEstoque,
  quantidadeNaComanda = 0,
  quantidadeMaximaNaComanda,
  onAdd,
  onUpdateQuantidade,
  disabled = false,
  ignoraEsgotado = false,
  limiteEstoqueBaixo = 3,
  className,
}: ProdutoCatalogoProps) {
  const Icon = resolveCatalogoIcon(categoria, IconProp, icone)
  const circleBg = estoqueCirculoCategoriaClass(categoria)
  const preco = precoExibir ?? precoVenda
  const q = quantidadeNaComanda

  const esgotado = !ignoraEsgotado && quantidadeMaximaNaComanda < 1
  const estoqueBaixo =
    !ignoraEsgotado && quantidadeEstoque > 0 && quantidadeEstoque <= limiteEstoqueBaixo
  const podeIncrementar = ignoraEsgotado || q < quantidadeMaximaNaComanda

  const aplicarQtd = (nova: number) => {
    const clamped = Math.max(0, Math.min(quantidadeMaximaNaComanda, Math.floor(nova)))
    onUpdateQuantidade(clamped)
  }

  return (
    <div
      id={`produto-catalogo-${id}`}
      className={cn(
        'flex flex-wrap items-start gap-3 border-b border-border/60 p-3 transition-opacity last:border-0',
        esgotado && 'opacity-40',
        className,
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          circleBg,
        )}
      >
        <Icon className="h-5 w-5 text-primary" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold leading-tight">{nome}</p>
          {estoqueBaixo ? (
            <Badge
              variant="outline"
              className="h-5 gap-0.5 border-amber-500/50 bg-amber-500/10 px-1.5 text-[10px] font-medium text-amber-800 dark:text-amber-200"
            >
              <AlertTriangle className="h-3 w-3" aria-hidden />
              Baixo
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs font-medium tabular-nums text-foreground">{formatCurrency(preco)}</p>
        <p className="text-[11px] text-muted-foreground">{quantidadeEstoque} em estoque</p>
      </div>
      <div className="flex w-full shrink-0 justify-end sm:w-auto sm:items-center">
        {esgotado ? (
          <div className="flex flex-col items-end gap-0.5 text-right">
            <span className="text-[11px] font-medium text-muted-foreground">Esgotado</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled
              className="pointer-events-none min-w-[4.5rem] opacity-60"
              aria-label={`${nome} esgotado`}
            >
              —
            </Button>
          </div>
        ) : q === 0 ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="min-h-11 shrink-0 touch-manipulation px-4 sm:min-h-9"
            disabled={disabled || !podeIncrementar}
            onClick={onAdd}
          >
            + Adicionar
          </Button>
        ) : (
          <QuantityStepper
            value={q}
            max={quantidadeMaximaNaComanda}
            onChange={aplicarQtd}
            onRemove={() => aplicarQtd(0)}
            disabled={disabled}
            aria-label={`Quantidade de ${nome} na comanda`}
          />
        )}
      </div>
    </div>
  )
}
