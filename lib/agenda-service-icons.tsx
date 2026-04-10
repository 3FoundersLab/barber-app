import type { LucideIcon } from 'lucide-react'
import { Brush, Droplets, Scissors, Sparkles, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function pickServicoAgendaIcon(nome?: string | null): LucideIcon {
  const n = (nome ?? '').toLowerCase()
  if (n.includes('barba')) return Brush
  if (n.includes('color') || n.includes('química') || n.includes('quimica') || n.includes('luzes'))
    return Droplets
  if (n.includes('máquina') || n.includes('maquina') || n.includes('degradê') || n.includes('degrade'))
    return Zap
  if (n.includes('combo') || n.includes('completo') || n.includes('pacote')) return Sparkles
  return Scissors
}

export function ServicoAgendaIcon({
  nome,
  className,
}: {
  nome?: string | null
  className?: string
}) {
  const Icon = pickServicoAgendaIcon(nome)
  return <Icon className={cn('h-3 w-3 shrink-0', className)} aria-hidden />
}
