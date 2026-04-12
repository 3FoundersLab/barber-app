'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/constants'
import {
  type BarbeiroRankingRow,
  rankingBarbeirosCompleto,
  radarHabilidadesBarbeiro,
  timelineFaturamentoBarbeiro,
} from '@/lib/relatorios-barbeiros-analise'
import { cn } from '@/lib/utils'
import type { Agendamento } from '@/types'

function medalha(i: number): string {
  if (i === 0) return '🥇'
  if (i === 1) return '🥈'
  if (i === 2) return '🥉'
  return `${i + 1}º`
}

function RadarBarbeiroSvg({
  data,
  labels,
}: {
  data: { corte: number; barba: number; vendas: number; pontualidade: number; satisfacao: number }
  labels: readonly string[]
}) {
  const cx = 100
  const cy = 100
  const R = 72
  const vals = [data.corte, data.barba, data.vendas, data.pontualidade, data.satisfacao]
  const n = 5
  const pts = vals.map((v, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n
    const r = (Math.max(0, Math.min(100, v)) / 100) * R
    return `${cx + r * Math.cos(ang)},${cy + r * Math.sin(ang)}`
  })
  const ring = Array.from({ length: n }, (_, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return `${cx + R * Math.cos(ang)},${cy + R * Math.sin(ang)}`
  }).join(' ')
  const labelPos = vals.map((_, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n
    const lr = R + 22
    return { x: cx + lr * Math.cos(ang), y: cy + lr * Math.sin(ang), t: labels[i] ?? '' }
  })
  return (
    <svg width={220} height={220} viewBox="0 0 200 200" className="mx-auto" aria-label="Radar de habilidades">
      <polygon
        points={ring}
        fill="none"
        className="stroke-muted-foreground/30"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <polygon points={pts.join(' ')} className="fill-primary/25 stroke-primary" strokeWidth={1.5} />
      {labelPos.map((p) => (
        <text
          key={p.t}
          x={p.x}
          y={p.y}
          textAnchor="middle"
          className="fill-muted-foreground text-[9px]"
          dominantBaseline="middle"
        >
          {p.t}
        </text>
      ))}
    </svg>
  )
}

function TimelineSvg(
  dias: ReturnType<typeof timelineFaturamentoBarbeiro>,
  titulo: string,
) {
  const w = 400
  const h = 120
  const pad = 28
  const maxY = Math.max(1, ...dias.map((d) => d.valor))
  const innerW = w - pad * 2
  const innerH = h - pad - 14
  const n = Math.max(1, dias.length)
  const pts = dias.map((d, i) => {
    const x = n <= 1 ? pad + innerW / 2 : pad + (i / (n - 1)) * innerW
    const y = pad + innerH - (d.valor / maxY) * innerH
    return `${x},${y}`
  })
  return (
    <div className="w-full overflow-x-auto">
      <svg width={w} height={h} className="mx-auto min-w-[320px]" aria-label={titulo}>
        <polyline
          points={pts.join(' ')}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {dias.map((d, i) => {
          const x = n <= 1 ? pad + innerW / 2 : pad + (i / (n - 1)) * innerW
          const y = pad + innerH - (d.valor / maxY) * innerH
          return <circle key={d.dataKey} cx={x} cy={y} r={3} className="fill-primary" />
        })}
        <text x={pad} y={h - 4} className="fill-muted-foreground text-[9px]">
          {dias[0]?.label} → {dias[dias.length - 1]?.label}
        </text>
      </svg>
    </div>
  )
}

const RADAR_LABELS = ['Corte', 'Barba', 'Vendas', 'Pontualidade', 'Satisfação'] as const

export function RelatoriosBarbeirosPainel({
  agendamentos,
  receitaProdutosPorBarbeiro,
  inicio,
  fim,
}: {
  agendamentos: Agendamento[]
  receitaProdutosPorBarbeiro: Record<string, number>
  inicio: Date
  fim: Date
}) {
  const ranking = useMemo(
    () => rankingBarbeirosCompleto(agendamentos, receitaProdutosPorBarbeiro),
    [agendamentos, receitaProdutosPorBarbeiro],
  )
  const maxProd = useMemo(
    () => Math.max(1, ...ranking.map((r) => r.faturamentoProdutos)),
    [ranking],
  )

  const [barbeiroDetalhe, setBarbeiroDetalhe] = useState<string | null>(null)
  const idRadar = barbeiroDetalhe ?? ranking[0]?.id ?? null

  const radar = useMemo(() => {
    if (!idRadar) return null
    return radarHabilidadesBarbeiro(
      agendamentos,
      idRadar,
      receitaProdutosPorBarbeiro[idRadar] ?? 0,
      maxProd,
    )
  }, [agendamentos, idRadar, receitaProdutosPorBarbeiro, maxProd])

  const timeline = useMemo(() => {
    if (!idRadar) return []
    return timelineFaturamentoBarbeiro(agendamentos, idRadar, inicio, fim)
  }, [agendamentos, idRadar, inicio, fim])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Barbeiros</h2>
        <p className="text-xs text-muted-foreground">
          Performance da equipe no período do relatório. Nota ⭐ é estimativa operacional (não há módulo de
          avaliações).
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ranking</CardTitle>
          <CardDescription>Faturamento total (serviços + produtos em comandas fechadas)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {ranking.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum agendamento no período.</p>
          ) : (
            <ul className="space-y-2">
              {ranking.map((b, i) => (
                <RankingLinha key={b.id} b={b} i={i} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Radar de habilidades</CardTitle>
            <CardDescription>
              Corte/barba = mix de serviços; vendas = produtos vs equipe; pontualidade = 100% − cancel/falta;
              satisfação = proxy da taxa de conclusão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Profissional</span>
              <Select
                value={idRadar ?? ''}
                onValueChange={(v) => setBarbeiroDetalhe(v)}
                disabled={ranking.length === 0}
              >
                <SelectTrigger className="h-9 w-[min(100%,14rem)]">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {ranking.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {radar ? <RadarBarbeiroSvg data={radar} labels={RADAR_LABELS} /> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Evolução do faturamento (serviços)</CardTitle>
            <CardDescription>Concluídos por dia — mesmo profissional do radar</CardDescription>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados.</p>
            ) : (
              <TimelineSvg dias={timeline} titulo="Faturamento diário" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Métricas por profissional</CardTitle>
          <CardDescription>Detalhe além do ranking</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-border/60 text-left text-muted-foreground">
                <th className="py-2 pr-2 font-medium">Nome</th>
                <th className="py-2 pr-2 font-medium">Serviços</th>
                <th className="py-2 pr-2 font-medium">Produtos</th>
                <th className="py-2 pr-2 font-medium">Atend.</th>
                <th className="py-2 pr-2 font-medium">Ticket</th>
                <th className="py-2 pr-2 font-medium">Retenção</th>
                <th className="py-2 pr-2 font-medium">Pico</th>
                <th className="py-2 font-medium">Signature</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r) => (
                <tr key={r.id} className="border-b border-border/40">
                  <td className="py-2 pr-2 font-medium">{r.nome}</td>
                  <td className="py-2 pr-2 tabular-nums">{formatCurrency(r.faturamentoServicos)}</td>
                  <td className="py-2 pr-2 tabular-nums">{formatCurrency(r.faturamentoProdutos)}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.concluidos}</td>
                  <td className="py-2 pr-2 tabular-nums">{formatCurrency(r.ticketMedio)}</td>
                  <td className="py-2 pr-2 tabular-nums">{r.taxaRetencaoPct.toFixed(0)}%</td>
                  <td className="py-2 pr-2">{r.horarioPico}</td>
                  <td className="py-2 truncate max-w-[10rem]" title={r.servicoSignature}>
                    {r.servicoSignature}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function RankingLinha({ b, i }: { b: BarbeiroRankingRow; i: number }) {
  const estrela = b.notaEstimada != null ? `${b.notaEstimada}⭐` : '—'
  return (
    <li
      className={cn(
        'grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 rounded-xl border border-border/60 px-3 py-2.5 sm:grid-cols-[auto_1fr_auto_auto_auto_auto]',
      )}
    >
      <span className="text-lg tabular-nums" aria-hidden>
        {medalha(i)}
      </span>
      <span className="min-w-0 font-medium leading-tight">{b.nome}</span>
      <span className="col-span-2 text-right text-sm font-semibold tabular-nums sm:col-span-1 sm:text-left">
        {formatCurrency(b.faturamentoTotal)}
      </span>
      <span className="text-xs tabular-nums text-muted-foreground sm:text-sm">{b.concluidos} atend.</span>
      <span className="text-xs tabular-nums text-muted-foreground sm:text-sm">{estrela}</span>
      <span className="col-span-3 text-right text-xs tabular-nums text-muted-foreground sm:col-span-1 sm:text-left">
        {formatCurrency(b.ticketMedio)} ticket
      </span>
    </li>
  )
}
