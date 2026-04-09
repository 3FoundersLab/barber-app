'use client'

import { Badge } from '@/components/ui/badge'
import { labelPeriodicidade, parsePlanoPeriodicidade, type PlanoPeriodicidade } from '@/lib/plano-periodicidade'
import { cn } from '@/lib/utils'
import type { AssinaturaStatus, Plano } from '@/types'

export function labelAssinaturaStatus(status: string) {
  const map: Record<string, string> = {
    pendente: 'Pagamento pendente',
    ativa: 'Ativa',
    inadimplente: 'Inadimplente',
    cancelada: 'Cancelada',
  }
  return map[status] ?? status
}

const PLANO_BADGE_PALETTE = [
  'rounded-full border-transparent bg-orange-100 text-orange-950 dark:bg-orange-950/50 dark:text-orange-100',
  'rounded-full border-transparent bg-violet-100 text-violet-950 dark:bg-violet-950/50 dark:text-violet-100',
  'rounded-full border-transparent bg-rose-100 text-rose-950 dark:bg-rose-950/50 dark:text-rose-100',
  'rounded-full border-transparent bg-cyan-100 text-cyan-950 dark:bg-cyan-950/50 dark:text-cyan-100',
  'rounded-full border-transparent bg-primary/12 text-primary dark:bg-primary/18 dark:text-primary',
  'rounded-full border-transparent bg-emerald-100 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100',
] as const

const PLANO_BADGE_MUTED = 'rounded-full border-transparent bg-muted text-muted-foreground'

function normalizePlanoNomeKey(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
}

function hashString(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * (i + 1)) % 997
  return h
}

function planoBadgeClass(plano: Pick<Plano, 'nome'> | null | undefined) {
  if (!plano?.nome?.trim()) return PLANO_BADGE_MUTED
  const k = normalizePlanoNomeKey(plano.nome)
  if (k.includes('enterprise')) return PLANO_BADGE_PALETTE[4]
  if (k.includes('premium')) return PLANO_BADGE_PALETTE[2]
  if (k.includes('profissional') || k.includes('professional')) return PLANO_BADGE_PALETTE[1]
  if (k.includes('standard')) return PLANO_BADGE_PALETTE[3]
  if (k.includes('plus')) return PLANO_BADGE_PALETTE[5]
  if (k.includes('basico') || k.includes('basic')) return PLANO_BADGE_PALETTE[0]
  return PLANO_BADGE_PALETTE[hashString(plano.nome) % PLANO_BADGE_PALETTE.length]
}

export function PlanoBadge({ plano }: { plano?: Pick<Plano, 'nome'> | Plano | null }) {
  if (!plano?.nome) {
    return <span className="text-muted-foreground">—</span>
  }
  return (
    <Badge variant="outline" className={cn('border-0 font-medium', planoBadgeClass(plano))}>
      {plano.nome}
    </Badge>
  )
}

export function statusBadgeClass(status: AssinaturaStatus) {
  switch (status) {
    case 'pendente':
      return 'rounded-full border-transparent bg-primary/12 text-primary dark:bg-primary/18 dark:text-primary'
    case 'ativa':
      return 'rounded-full border-transparent bg-emerald-100 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100'
    case 'inadimplente':
      return 'rounded-full border-transparent bg-red-100 text-red-950 dark:bg-red-950/50 dark:text-red-100'
    case 'cancelada':
    default:
      return 'rounded-full border-transparent bg-muted text-muted-foreground'
  }
}

function periodicidadeBadgeClass(p: PlanoPeriodicidade) {
  switch (p) {
    case 'mensal':
      return 'rounded-full border-transparent bg-slate-100 text-slate-800 dark:bg-slate-900/50 dark:text-slate-200'
    case 'trimestral':
      return 'rounded-full border-transparent bg-sky-100 text-sky-950 dark:bg-sky-950/50 dark:text-sky-100'
    case 'semestral':
      return 'rounded-full border-transparent bg-violet-100 text-violet-950 dark:bg-violet-950/50 dark:text-violet-100'
    case 'anual':
      return 'rounded-full border-transparent bg-teal-100 text-teal-950 dark:bg-teal-950/50 dark:text-teal-100'
    default:
      return 'rounded-full border-transparent bg-muted text-muted-foreground'
  }
}

export function PeriodicidadeBadge({ periodicidade }: { periodicidade: string | null | undefined }) {
  const p = parsePlanoPeriodicidade(periodicidade)
  return (
    <Badge variant="outline" className={cn('border-0 font-medium', periodicidadeBadgeClass(p))}>
      {labelPeriodicidade(p)}
    </Badge>
  )
}
