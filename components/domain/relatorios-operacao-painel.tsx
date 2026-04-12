'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  META_TEMPO_CORTE_MIN,
  eficienciaPorBarbeiro,
  esperaMediaEstimadaMinutos,
  funilOperacao,
  heatmapSemanaHorario,
  taxaCancelamentoFalta,
  taxaComparecimentoConcluidos,
  tempoMedioAtendimentoPorServico,
} from '@/lib/relatorios-operacao'
import type { Agendamento } from '@/types'

function formatMinutos(m: number): string {
  if (!Number.isFinite(m)) return '—'
  const r = Math.round(m * 10) / 10
  if (Math.abs(r - Math.round(r)) < 0.05) return `${Math.round(r)} min`
  return `${r.toFixed(1)} min`
}

function fillHeatmap(t: number): string {
  if (t <= 0) return 'hsl(220 14% 96%)'
  if (t < 0.2) return 'hsl(152 76% 88%)'
  if (t < 0.4) return 'hsl(152 69% 70%)'
  if (t < 0.6) return 'hsl(43 96% 76%)'
  if (t < 0.8) return 'hsl(32 95% 58%)'
  return 'hsl(25 95% 42%)'
}

type FunilStep = { label: string; valor: number; pct: number }

function FunilConversao({ steps }: { steps: FunilStep[] }) {
  const base = Math.max(1, steps[0]?.valor ?? 1)
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={s.label} className="space-y-1">
          <div className="flex justify-between gap-2 text-xs">
            <span className="font-medium text-foreground">{s.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {s.valor}
              <span className="text-muted-foreground/80"> ({s.pct.toFixed(0)}%)</span>
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted/60">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                i === 0 && 'bg-primary/80',
                i === 1 && 'bg-primary/70',
                i === 2 && 'bg-primary/60',
                i === 3 && 'bg-emerald-600/85 dark:bg-emerald-500/70',
                i === 4 && 'bg-amber-600/85 dark:bg-amber-500/70',
                i > 4 && 'bg-muted-foreground/50',
              )}
              style={{ width: `${Math.min(100, (s.valor / base) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function GraficoEficienciaBarbeiros({
  rows,
  metaMin,
}: {
  rows: ReturnType<typeof eficienciaPorBarbeiro>
  metaMin: number
}) {
  const maxX = useMemo(() => {
    const m = Math.max(metaMin, ...rows.map((r) => r.mediaMin), 1)
    return m * 1.08
  }, [rows, metaMin])

  const metaPct = Math.min(100, (metaMin / maxX) * 100)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem atendimentos concluídos com duração estimável.</p>
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground">
        Linha âmbar na régua: meta de {metaMin} min (referência por corte).
      </p>
      <ScrollArea className="h-[min(320px,45vh)] pr-3">
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-[minmax(0,7.5rem)_1fr] items-center gap-2 text-xs">
              <span className={cn('truncate font-medium', r.acimaMeta && 'text-amber-800 dark:text-amber-200')}>
                {r.nome}
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <div className="relative h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/60">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      r.acimaMeta ? 'bg-amber-500/90 dark:bg-amber-600/80' : 'bg-primary/75 dark:bg-primary/60',
                    )}
                    style={{ width: `${Math.min(100, (r.mediaMin / maxX) * 100)}%` }}
                  />
                  <div
                    className="pointer-events-none absolute inset-y-0 z-[2] w-0.5 bg-amber-500 shadow-sm dark:bg-amber-400"
                    style={{ left: `${metaPct}%`, transform: 'translateX(-50%)' }}
                    title={`Meta ${metaMin} min`}
                  />
                </div>
                <span className="w-14 shrink-0 tabular-nums text-muted-foreground">{formatMinutos(r.mediaMin)}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function HeatmapSemanalSvg({ data }: { data: ReturnType<typeof heatmapSemanaHorario> }) {
  const { grid, max, horaInicio, horaFim, rowLabels } = data
  const cell = 22
  const labelW = 32
  const padT = 20
  const w = labelW + (horaFim - horaInicio + 1) * cell
  const h = padT + 7 * cell

  return (
    <div className="overflow-x-auto">
      <svg width={w} height={h} className="mx-auto max-w-full text-[10px]" aria-label="Mapa de calor semanal">
        {Array.from({ length: horaFim - horaInicio + 1 }, (_, i) => horaInicio + i).map((hr, i) => (
          <text
            key={hr}
            x={labelW + i * cell + cell / 2}
            y={14}
            textAnchor="middle"
            className="fill-muted-foreground"
          >
            {hr}h
          </text>
        ))}
        {rowLabels.map((lab, ri) => (
          <text key={lab} x={4} y={padT + ri * cell + cell / 2 + 4} className="fill-muted-foreground">
            {lab}
          </text>
        ))}
        {grid.map((row, ri) =>
          row.map((v, ci) => {
            const t = v / max
            return (
              <rect
                key={`${ri}-${ci}`}
                x={labelW + ci * cell + 1}
                y={padT + ri * cell + 1}
                width={cell - 2}
                height={cell - 2}
                rx={3}
                fill={fillHeatmap(t)}
                className="stroke-background/40 dark:stroke-border/50"
                strokeWidth={1}
              >
                <title>
                  {rowLabels[ri]} {horaInicio + ci}h — {v} agend.
                </title>
              </rect>
            )
          }),
        )}
      </svg>
    </div>
  )
}

export type ProdutoConsumidoRank = { nome: string; qtd: number }

export function RelatoriosOperacaoPainel({
  agendamentos,
  servicosRank,
  produtosConsumidos,
}: {
  agendamentos: Agendamento[]
  servicosRank: { id: string; nome: string; q: number; fat: number }[]
  produtosConsumidos: ProdutoConsumidoRank[]
}) {
  const taxaComp = useMemo(() => taxaComparecimentoConcluidos(agendamentos), [agendamentos])
  const taxaCxF = useMemo(() => taxaCancelamentoFalta(agendamentos), [agendamentos])
  const espera = useMemo(() => esperaMediaEstimadaMinutos(agendamentos), [agendamentos])
  const porServico = useMemo(() => tempoMedioAtendimentoPorServico(agendamentos), [agendamentos])
  const funil = useMemo(() => funilOperacao(agendamentos), [agendamentos])
  const efBar = useMemo(() => eficienciaPorBarbeiro(agendamentos), [agendamentos])
  const heat = useMemo(() => heatmapSemanaHorario(agendamentos, 8, 22), [agendamentos])

  const funilSteps: FunilStep[] = useMemo(() => {
    const b = Math.max(1, funil.agendados)
    return [
      { label: 'Agendados', valor: funil.agendados, pct: 100 },
      { label: 'Compareceram', valor: funil.compareceram, pct: (funil.compareceram / b) * 100 },
      { label: 'Finalizaram', valor: funil.finalizaram, pct: (funil.finalizaram / b) * 100 },
      { label: 'Pagaram', valor: funil.pagaram, pct: (funil.pagaram / b) * 100 },
      { label: 'Voltaram (2+ no período)', valor: funil.voltaram, pct: (funil.voltaram / b) * 100 },
    ]
  }, [funil])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Operação</h2>
        <p className="text-xs text-muted-foreground">
          Performance do dia a dia — métricas derivadas de agendamentos e comandas fechadas (produtos).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardDescription>Comparecimento</CardDescription>
            <CardTitle className="text-xl tabular-nums">{taxaComp.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Concluídos sobre o total de agendamentos no período.
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader className="pb-2">
            <CardDescription>Cancelamento / falta</CardDescription>
            <CardTitle className="text-xl tabular-nums">{taxaCxF.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Sobre o total no período.</CardContent>
        </Card>
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader className="pb-2">
            <CardDescription>Espera média (estimada)</CardDescription>
            <CardTitle className="text-xl tabular-nums">
              {espera.mediaMin != null ? formatMinutos(espera.mediaMin) : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-snug">
            {espera.detalhe}
            {espera.amostras > 0 ? (
              <span className="block pt-1 tabular-nums">Base: {espera.amostras} intervalo(s) entre horários.</span>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Funil de conversão</CardTitle>
            <CardDescription>Do agendamento à recorrência no mesmo período</CardDescription>
          </CardHeader>
          <CardContent>
            <FunilConversao steps={funilSteps} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Eficiência por profissional</CardTitle>
            <CardDescription>Tempo médio por atendimento concluído (estimado)</CardDescription>
          </CardHeader>
          <CardContent>
            <GraficoEficienciaBarbeiros rows={efBar} metaMin={META_TEMPO_CORTE_MIN} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Mapa de calor — semana × horário</CardTitle>
          <CardDescription>
            Volume de agendamentos (exc. cancelados) entre 8h e 22h, por dia da semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HeatmapSemanalSvg data={heat} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tempo médio por serviço</CardTitle>
            <CardDescription>
              Média em minutos (intervalo criado→atualizado no concluído, ou duração cadastrada)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[min(280px,40vh)] pr-3">
              <ul className="space-y-2">
                {porServico.slice(0, 20).map((s, i) => (
                  <li
                    key={s.id}
                    className="flex justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      <span className="text-muted-foreground">{i + 1}. </span>
                      {s.nome}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatMinutos(s.mediaMin)} · n={s.amostras}
                    </span>
                  </li>
                ))}
                {porServico.length === 0 ? (
                  <li className="text-sm text-muted-foreground">Nenhum concluído com duração estimável.</li>
                ) : null}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Serviços mais vendidos</CardTitle>
            <CardDescription>Quantidade de agendamentos no período (todos os status)</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[min(280px,40vh)] pr-3">
              <ul className="space-y-2">
                {servicosRank.slice(0, 15).map((s, i) => (
                  <li
                    key={s.id}
                    className="flex justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {i + 1}. {s.nome}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{s.q}</span>
                  </li>
                ))}
                {servicosRank.length === 0 ? (
                  <li className="text-sm text-muted-foreground">Nenhum dado.</li>
                ) : null}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Produtos mais consumidos</CardTitle>
          <CardDescription>Soma de quantidades em comandas fechadas no período</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[min(240px,35vh)] pr-3">
            <ul className="space-y-2">
              {produtosConsumidos.slice(0, 20).map((p, i) => (
                <li
                  key={`${p.nome}-${i}`}
                  className="flex justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {i + 1}. {p.nome}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{p.qtd} un.</span>
                </li>
              ))}
              {produtosConsumidos.length === 0 ? (
                <li className="text-sm text-muted-foreground">Nenhuma venda de produto registrada em comandas fechadas.</li>
              ) : null}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
