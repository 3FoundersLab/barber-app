'use client'

import { Calendar, CircleCheck, Equal, Scissors, Timer, TrendingDown, TrendingUp, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DashboardOperacaoDiaKpis } from '@/types/admin-dashboard'

function pctVsOntem(hoje: number, ontem: number): number | null {
  if (hoje === ontem) return 0
  if (ontem === 0) return hoje > 0 ? 100 : null
  return ((hoje - ontem) / ontem) * 100
}

function VariacaoOntem({ hoje, ontem, invert }: { hoje: number; ontem: number; invert?: boolean }) {
  const raw = pctVsOntem(hoje, ontem)
  if (raw === null) {
    return <span className="text-muted-foreground text-xs font-medium">— sem base ontem</span>
  }
  if (raw === 0) {
    return (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs font-semibold">
        <Equal className="size-3.5 shrink-0" aria-hidden />
        mesmo que ontem
      </span>
    )
  }
  if (invert) {
    const good = raw < 0
    const Icon = good ? TrendingDown : TrendingUp
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-xs font-semibold tabular-nums',
          good ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
        )}
      >
        <Icon className="size-3.5 shrink-0" aria-hidden />
        {good ? '' : '+'}
        {Math.round(raw)}% vs. ontem
      </span>
    )
  }
  const up = raw > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-semibold tabular-nums',
        up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {up ? '+' : ''}
      {Math.round(raw)}% vs. ontem
    </span>
  )
}

function OpCard(props: {
  icon: typeof User
  iconBg: string
  lines: [string, string]
  value: number
  hoje: number
  ontem: number
  /** Quando true, queda em relação a ontem é “boa” (ex.: menos pendentes). */
  invertVariacao?: boolean
}) {
  const I = props.icon
  return (
    <Card className="border-border/80 overflow-hidden shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4 pt-5">
        <div
          className={cn(
            'flex size-11 items-center justify-center rounded-full text-white shadow-sm',
            props.iconBg,
          )}
        >
          <I className="size-5" aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium leading-snug">
            <span className="block">{props.lines[0]}</span>
            {props.lines[1] ? <span className="block">{props.lines[1]}</span> : null}
          </p>
          <p className="text-foreground text-xl font-bold tracking-tight tabular-nums sm:text-2xl">{props.value}</p>
          <VariacaoOntem hoje={props.hoje} ontem={props.ontem} invert={props.invertVariacao} />
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminDashboardOperacaoKpis(props: {
  hoje: DashboardOperacaoDiaKpis | null
  ontem: DashboardOperacaoDiaKpis | null
  isLoading: boolean
  error: string | null
}) {
  const { hoje, ontem, isLoading, error } = props

  if (error) {
    return (
      <p className="text-muted-foreground text-sm">Indicadores operacionais indisponíveis no momento.</p>
    )
  }

  if (isLoading || !hoje || !ontem) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-muted h-40 animate-pulse rounded-xl border border-border/60" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <OpCard
        icon={User}
        iconBg="bg-blue-500"
        lines={['Atendimentos', 'do dia']}
        value={hoje.atendimentosDia}
        hoje={hoje.atendimentosDia}
        ontem={ontem.atendimentosDia}
      />
      <OpCard
        icon={Scissors}
        iconBg="bg-violet-500"
        lines={['Serviços', 'do dia']}
        value={hoje.servicosDia}
        hoje={hoje.servicosDia}
        ontem={ontem.servicosDia}
      />
      <OpCard
        icon={Calendar}
        iconBg="bg-orange-400"
        lines={['Agendamentos', 'do dia']}
        value={hoje.agendamentosDia}
        hoje={hoje.agendamentosDia}
        ontem={ontem.agendamentosDia}
      />
      <OpCard
        icon={CircleCheck}
        iconBg="bg-emerald-500"
        lines={['Executados', 'do dia']}
        value={hoje.executadosDia}
        hoje={hoje.executadosDia}
        ontem={ontem.executadosDia}
      />
      <div className="col-span-2 lg:col-span-1">
        <OpCard
          icon={Timer}
          iconBg="bg-amber-400"
          lines={['Pendentes', 'do dia']}
          value={hoje.pendentesDia}
          hoje={hoje.pendentesDia}
          ontem={ontem.pendentesDia}
          invertVariacao
        />
      </div>
    </div>
  )
}
