'use client'

import Link from 'next/link'
import {
  AlertCircle,
  Calendar,
  Check,
  Circle,
  Clock,
  CircleDot,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatTime } from '@/lib/constants'
import { parseHorarioToMinutes } from '@/lib/build-admin-dashboard-status-hoje'
import { cn } from '@/lib/utils'
import type { Agendamento } from '@/types'
import type { DashboardAgendaDiaStats } from '@/types/admin-dashboard'

function nowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

type StatusVisual =
  | 'concluida'
  | 'proxima'
  | 'pendente'
  | 'atrasada'
  | 'em_atendimento'
  | 'cancelada'
  | 'faltou'

function agendaLinhaStatus(
  a: Agendamento,
  idx: number,
  sorted: Agendamento[],
  nowM: number,
): { visual: StatusVisual; label: string } {
  if (a.status === 'concluido') {
    return { visual: 'concluida', label: 'Concluída' }
  }
  if (a.status === 'cancelado') {
    return { visual: 'cancelada', label: 'Cancelada' }
  }
  if (a.status === 'faltou') {
    return { visual: 'faltou', label: 'Faltou' }
  }
  if (a.status === 'em_atendimento') {
    return { visual: 'em_atendimento', label: 'Em atendimento' }
  }
  const hm = parseHorarioToMinutes(a.horario) ?? 0
  const firstNextIdx = sorted.findIndex((x) => {
    if (x.status !== 'agendado' && x.status !== 'em_atendimento') return false
    const xm = parseHorarioToMinutes(x.horario) ?? 0
    return xm >= nowM
  })
  if (idx === firstNextIdx && firstNextIdx >= 0) {
    return { visual: 'proxima', label: 'Próxima' }
  }
  if (hm < nowM && a.status === 'agendado') {
    return { visual: 'atrasada', label: 'Atrasada' }
  }
  return { visual: 'pendente', label: 'Pendente' }
}

function StatusCell({ visual, label }: { visual: StatusVisual; label: string }) {
  if (visual === 'concluida') {
    return (
      <span className="inline-flex items-center justify-end gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <Check className="size-4 shrink-0 stroke-[2.5]" aria-hidden />
        <span>{label}</span>
      </span>
    )
  }
  if (visual === 'proxima') {
    return (
      <span className="inline-flex items-center justify-end gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
        <Clock className="size-4 shrink-0" aria-hidden />
        <span>{label}</span>
      </span>
    )
  }
  if (visual === 'pendente') {
    return (
      <span className="inline-flex items-center justify-end gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500">
        <Circle className="size-4 shrink-0 stroke-[2]" aria-hidden />
        <span>{label}</span>
      </span>
    )
  }
  if (visual === 'atrasada') {
    return (
      <span className="inline-flex items-center justify-end gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400">
        <AlertCircle className="size-4 shrink-0" aria-hidden />
        <span>{label}</span>
      </span>
    )
  }
  if (visual === 'em_atendimento') {
    return (
      <span className="inline-flex items-center justify-end gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
        <CircleDot className="size-4 shrink-0" aria-hidden />
        <span>{label}</span>
      </span>
    )
  }
  return (
    <span className="text-muted-foreground inline-flex items-center justify-end gap-1.5 text-xs font-medium line-through">
      <XCircle className="size-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </span>
  )
}

export function AdminDashboardAgendaDia(props: {
  base: string
  stats: DashboardAgendaDiaStats | null
  agendamentos: Agendamento[]
  isLoading: boolean
  error: string | null
}) {
  const { base, stats, agendamentos, isLoading, error } = props
  const sorted = [...agendamentos].sort((a, b) => String(a.horario).localeCompare(String(b.horario)))
  const nowM = nowMinutes()

  return (
    <Card className="border-border/80 rounded-xl shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight text-gray-900 dark:text-foreground">
          Agenda do dia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {stats && !isLoading && !error ? (
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4 shrink-0 text-orange-500" aria-hidden />
              <span className="text-foreground font-semibold tabular-nums">{stats.agendados}</span> Agendados
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-4 shrink-0 text-emerald-500" aria-hidden />
              <span className="text-foreground font-semibold tabular-nums">{stats.executados}</span> Executados
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4 shrink-0 text-amber-500" aria-hidden />
              <span className="text-foreground font-semibold tabular-nums">{stats.pendentes}</span> Pendentes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <XCircle className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <span className="text-foreground font-semibold tabular-nums">{stats.cancelados}</span> Cancelados
            </span>
          </div>
        ) : null}

        {error ? (
          <p className="text-muted-foreground py-4 text-center text-sm">Não foi possível carregar a agenda.</p>
        ) : isLoading ? (
          <div className="bg-muted h-48 animate-pulse rounded-xl" />
        ) : sorted.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">Nenhum agendamento para hoje.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Horário</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Serviço(s)</th>
                  <th className="px-3 py-2">Barbeiro</th>
                  <th className="px-3 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((a, idx) => {
                  const st = agendaLinhaStatus(a, idx, sorted, nowM)
                  const foto = a.barbeiro?.avatar || a.barbeiro?.profile?.avatar
                  const inicial = (a.barbeiro?.nome ?? '?').charAt(0).toUpperCase()
                  return (
                    <tr key={a.id} className="border-b border-border/40 last:border-0">
                      <td className="text-foreground px-3 py-2.5 font-medium tabular-nums">{formatTime(a.horario)}</td>
                      <td className="text-foreground max-w-[140px] truncate px-3 py-2.5 font-medium">
                        {a.cliente?.nome ?? '—'}
                      </td>
                      <td className="text-muted-foreground max-w-[200px] truncate px-3 py-2.5">
                        {a.servico?.nome ?? '—'}
                      </td>
                      <td className="text-muted-foreground px-3 py-2.5">
                        <span className="flex min-w-0 max-w-[200px] items-center gap-2">
                          <Avatar className="size-8 shrink-0 border border-border/60">
                            {foto ? <AvatarImage src={foto} alt="" className="object-cover" /> : null}
                            <AvatarFallback className="bg-muted text-[11px] font-semibold">{inicial}</AvatarFallback>
                          </Avatar>
                          <span className="truncate font-medium text-foreground">{a.barbeiro?.nome ?? '—'}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <StatusCell visual={st.visual} label={st.label} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-center sm:justify-end">
          <Button variant="outline" size="sm" className="gap-1 rounded-lg text-xs" asChild>
            <Link href={`${base}/agendamentos`}>
              Ver agenda completa
              <span aria-hidden>→</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
