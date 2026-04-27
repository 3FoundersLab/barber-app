'use client'

import Link from 'next/link'
import { Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTime } from '@/lib/constants'
import { parseHorarioToMinutes } from '@/lib/build-admin-dashboard-status-hoje'
import { cn } from '@/lib/utils'
import type { Agendamento } from '@/types'
import type { DashboardAgendaDiaStats } from '@/types/admin-dashboard'

function nowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function agendaLinhaStatus(
  a: Agendamento,
  idx: number,
  sorted: Agendamento[],
  nowM: number,
): { label: string; className: string } {
  if (a.status === 'concluido') {
    return { label: 'Concluída', className: 'text-emerald-700 dark:text-emerald-400' }
  }
  if (a.status === 'cancelado') {
    return { label: 'Cancelada', className: 'text-muted-foreground line-through' }
  }
  if (a.status === 'faltou') {
    return { label: 'Faltou', className: 'text-destructive' }
  }
  if (a.status === 'em_atendimento') {
    return { label: 'Em atendimento', className: 'text-sky-700 dark:text-sky-400' }
  }
  const hm = parseHorarioToMinutes(a.horario) ?? 0
  const firstNextIdx = sorted.findIndex((x) => {
    if (x.status !== 'agendado' && x.status !== 'em_atendimento') return false
    const xm = parseHorarioToMinutes(x.horario) ?? 0
    return xm >= nowM
  })
  if (idx === firstNextIdx && firstNextIdx >= 0) {
    return { label: 'Próxima', className: 'text-amber-700 dark:text-amber-400' }
  }
  if (hm < nowM && a.status === 'agendado') {
    return { label: 'Atrasada', className: 'text-orange-700 dark:text-orange-400' }
  }
  return { label: 'Pendente', className: 'text-muted-foreground' }
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
    <Card className="border-border/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Agenda do dia</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {stats && !isLoading && !error ? (
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="text-orange-500 size-4 shrink-0" aria-hidden />
              <span className="text-foreground font-semibold tabular-nums">{stats.agendados}</span> Agendados
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="text-emerald-500 size-4 shrink-0" aria-hidden />
              <span className="text-foreground font-semibold tabular-nums">{stats.executados}</span> Executados
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="text-amber-500 size-4 shrink-0" aria-hidden />
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
          <div className="bg-muted h-48 animate-pulse rounded-lg" />
        ) : sorted.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">Nenhum agendamento para hoje.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
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
                  return (
                    <tr key={a.id} className="border-b border-border/40 last:border-0">
                      <td className="text-foreground px-3 py-2.5 font-medium tabular-nums">{formatTime(a.horario)}</td>
                      <td className="text-foreground max-w-[140px] truncate px-3 py-2.5 font-medium">
                        {a.cliente?.nome ?? '—'}
                      </td>
                      <td className="text-muted-foreground max-w-[200px] truncate px-3 py-2.5">
                        {a.servico?.nome ?? '—'}
                      </td>
                      <td className="text-muted-foreground max-w-[120px] truncate px-3 py-2.5">
                        {a.barbeiro?.nome ?? '—'}
                      </td>
                      <td className={cn('px-3 py-2.5 text-right text-xs font-semibold', st.className)}>{st.label}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-center sm:justify-end">
          <Button variant="outline" size="sm" className="gap-1 text-xs" asChild>
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
