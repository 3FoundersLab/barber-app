'use client'

import type { LucideIcon } from 'lucide-react'
import {
  Brush,
  Droplets,
  FlaskConical,
  Package,
  ScanFace,
  Scissors,
  Sparkles,
  SprayCan,
} from 'lucide-react'

/** Categorias com ícone dedicado (Lucide não expõe `Beard`; usamos `ScanFace` para Barba). */
export const ESTOQUE_CATEGORIAS_ORDEM = [
  'Finalização',
  'Higiene',
  'Barba',
  'Acessórios',
  'Equipamentos',
  'Tratamento',
  'Perfumaria',
] as const

export type EstoqueCategoriaPadrao = (typeof ESTOQUE_CATEGORIAS_ORDEM)[number]

const ICONS: Record<EstoqueCategoriaPadrao, LucideIcon> = {
  Finalização: Sparkles,
  Higiene: Droplets,
  Barba: ScanFace,
  Acessórios: Brush,
  Equipamentos: Scissors,
  Tratamento: FlaskConical,
  Perfumaria: SprayCan,
}

const CIRCLE_BG: Record<EstoqueCategoriaPadrao, string> = {
  Finalização: 'bg-primary/20',
  Higiene: 'bg-sky-500/15 dark:bg-sky-400/20',
  Barba: 'bg-emerald-600/15 dark:bg-emerald-500/20',
  Acessórios: 'bg-violet-500/15 dark:bg-violet-400/20',
  Equipamentos: 'bg-zinc-500/20 dark:bg-zinc-400/15',
  Tratamento: 'bg-teal-500/15 dark:bg-teal-400/20',
  Perfumaria: 'bg-rose-500/15 dark:bg-rose-400/20',
}

export function estoqueIconeCategoria(categoria: string): LucideIcon {
  return ICONS[categoria as EstoqueCategoriaPadrao] ?? Package
}

export function estoqueCirculoCategoriaClass(categoria: string): string {
  return CIRCLE_BG[categoria as EstoqueCategoriaPadrao] ?? 'bg-muted'
}
