'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Lightbulb, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/constants'
import type { AgHistoricoCliente } from '@/lib/relatorios-clientes-analise'
import {
  comparativoAnoYtd,
  comparativoMesAtualVsAnterior,
  detectarTendencias,
  projecaoProximoMes,
  receitaServicosPorDia,
  receitaServicosPorMes,
  receitaTotalPorDia,
  receitaTotalPorMes,
  serieBarrasCategoriasUltimosMeses,
  seriePrevisaoDiaria,
  serieReceitaMensalDoisAnos,
} from '@/lib/relatorios-tendencias-analise'
import { cn } from '@/lib/utils'

function GraficoYoY({ data }: { data: ReturnType<typeof serieReceitaMensalDoisAnos> }) {
  const w = 520
  const h = 200
  const padL = 40
  const padR = 12
  const padT = 16
  const padB = 32
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const maxY = Math.max(
    1,
    ...data.flatMap((d) => [d.anoAnterior, d.anoAtual != null ? d.anoAtual : 0]),
  )
  const n = data.length
  const x = (i: number) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const y = (v: number) => padT + innerH - (v / maxY) * innerH
  const ptsA = data
    .map((d, i) => (d.anoAtual != null ? `${x(i)},${y(d.anoAtual)}` : null))
    .filter(Boolean)
    .join(' ')
  const ptsP = data.map((d, i) => `${x(i)},${y(d.anoAnterior)}`).join(' ')
  return (
    <svg width={w} height={h} className="mx-auto max-w-full" aria-label="Receita mensal ano atual vs anterior">
      <polyline points={ptsP} fill="none" className="stroke-muted-foreground/70" strokeWidth={2} strokeDasharray="4 3" />
      <polyline points={ptsA} fill="none" className="stroke-primary" strokeWidth={2} />
      {data.map((d, i) => (
        <text key={d.mes} x={x(i)} y={h - 8} textAnchor="middle" className="fill-muted-foreground text-[9px] capitalize">
          {d.label}
        </text>
      ))}
      <text x={padL} y={12} className="fill-primary text-[10px]">
        {new Date().getFullYear()}
      </text>
      <text x={padL + 36} y={12} className="fill-muted-foreground text-[10px]">
        {new Date().getFullYear() - 1} (tracejado)
      </text>
    </svg>
  )
}

function GraficoBarrasEmpilhadas({ data }: { data: ReturnType<typeof serieBarrasCategoriasUltimosMeses> }) {
  const w = 520
  const h = 200
  const padL = 36
  const padB = 28
  const innerW = w - padL - 12
  const innerH = h - padB - 12
  const bw = innerW / Math.max(1, data.length)
  const maxT = Math.max(1, ...data.map((d) => d.cortes + d.barbas + d.outros + d.produtos))
  return (
    <svg width={w} height={h} className="mx-auto max-w-full" aria-label="Receita por categoria">
      {data.map((d, i) => {
        const x = padL + i * bw + 2
        const wbar = bw - 4
        const segs = [
          { v: d.cortes, cls: 'fill-emerald-500/85' },
          { v: d.barbas, cls: 'fill-amber-500/85' },
          { v: d.outros, cls: 'fill-muted-foreground/50' },
          { v: d.produtos, cls: 'fill-primary/85' },
        ]
        let bottom = padT + innerH
        return (
          <g key={d.mesKey}>
            {segs.map((s, j) => {
              const hgt = (s.v / maxT) * innerH
              const y0 = bottom - hgt
              bottom = y0
              return <rect key={j} x={x} y={y0} width={wbar} height={Math.max(0, hgt)} className={s.cls} rx={1} />
            })}
            <text x={x + wbar / 2} y={h - 6} textAnchor="middle" className="fill-muted-foreground text-[8px]">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function GraficoPrevisao({ serie }: { serie: ReturnType<typeof seriePrevisaoDiaria> }) {
  const w = 560
  const h = 160
  const padL = 32
  const padB = 22
  const innerW = w - padL - 8
  const innerH = h - padB - 8
  const hist = serie.filter((s) => s.historico != null)
  const prev = serie.filter((s) => s.previsto != null)
  const maxY = Math.max(1, ...serie.map((s) => Math.max(s.historico ?? 0, s.previsto ?? 0)))
  const n = serie.length
  const xAt = (i: number) => padL + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const yAt = (v: number) => 8 + innerH - (v / maxY) * innerH
  const ptsHist = hist
    .map((s) => {
      const i = serie.indexOf(s)
      return `${xAt(i)},${yAt(s.historico ?? 0)}`
    })
    .join(' ')
  let ptsPrev = ''
  if (hist.length && prev.length) {
    const last = hist[hist.length - 1]
    const li = serie.indexOf(last)
    ptsPrev =
      `${xAt(li)},${yAt(last.historico ?? 0)} ` +
      prev.map((s) => `${xAt(serie.indexOf(s))},${yAt(s.previsto ?? 0)}`).join(' ')
  }
  return (
    <svg width={w} height={h} className="mx-auto max-w-full" aria-label="Previsão de receita">
      <polyline points={ptsHist} fill="none" className="stroke-primary" strokeWidth={2} />
      {ptsPrev ? (
        <polyline points={ptsPrev} fill="none" className="stroke-primary/60" strokeWidth={2} strokeDasharray="5 4" />
      ) : null}
      <text x={padL} y={14} className="fill-muted-foreground text-[9px]">
        Sólido: histórico · Tracejado: média diária (próx. 30 dias)
      </text>
    </svg>
  )
}

export function RelatoriosTendenciasPainel({
  agHistorico,
  receitaProdutoPorMesHist,
  receitaProdutoPorDiaHist,
}: {
  agHistorico: AgHistoricoCliente[]
  receitaProdutoPorMesHist: Record<string, number>
  receitaProdutoPorDiaHist: Record<string, number>
}) {
  const [ref] = useState(() => new Date())

  const servMes = useMemo(() => receitaServicosPorMes(agHistorico), [agHistorico])
  const totalMes = useMemo(
    () => receitaTotalPorMes(servMes, receitaProdutoPorMesHist),
    [servMes, receitaProdutoPorMesHist],
  )
  const compMes = useMemo(() => comparativoMesAtualVsAnterior(totalMes, ref), [totalMes, ref])
  const compAno = useMemo(() => comparativoAnoYtd(totalMes, ref), [totalMes, ref])
  const servDia = useMemo(() => receitaServicosPorDia(agHistorico), [agHistorico])
  const totalDia = useMemo(
    () => receitaTotalPorDia(servDia, receitaProdutoPorDiaHist),
    [servDia, receitaProdutoPorDiaHist],
  )
  const proj = useMemo(() => projecaoProximoMes(totalDia, ref, 60), [totalDia, ref])
  const insights = useMemo(
    () => detectarTendencias(agHistorico, receitaProdutoPorDiaHist, ref),
    [agHistorico, receitaProdutoPorDiaHist, ref],
  )
  const yoy = useMemo(() => serieReceitaMensalDoisAnos(totalMes, ref), [totalMes, ref])
  const stacks = useMemo(
    () => serieBarrasCategoriasUltimosMeses(agHistorico, receitaProdutoPorMesHist, 12, ref),
    [agHistorico, receitaProdutoPorMesHist, ref],
  )
  const prev30 = useMemo(() => seriePrevisaoDiaria(totalDia, ref, 45, 30), [totalDia, ref])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tendências</h2>
        <p className="text-xs text-muted-foreground">
          Comparativos e projeções com base no histórico de até 36 meses (agendamentos + comandas fechadas).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Este mês vs mês passado</CardDescription>
            <CardTitle className="text-lg leading-tight capitalize">{compMes.mesAtualLabel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="tabular-nums text-muted-foreground">
              Parcial atual: <span className="font-semibold text-foreground">{formatCurrency(compMes.mesAtualParcial)}</span>
            </p>
            <p className="tabular-nums text-muted-foreground">
              Mês anterior (fechado):{' '}
              <span className="font-semibold text-foreground">{formatCurrency(compMes.mesAnteriorCompleto)}</span>
            </p>
            {compMes.variacaoPct != null ? (
              <p className={cn('text-xs font-medium', compMes.variacaoPct >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-300')}>
                {compMes.variacaoPct >= 0 ? '+' : ''}
                {compMes.variacaoPct}% vs mês anterior (receita total)
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Sem base para variação.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Este ano vs ano passado (YTD)</CardDescription>
            <CardTitle className="text-lg">Jan — {format(ref, 'MMM', { locale: ptBR })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="tabular-nums text-muted-foreground">
              {compAno.anoAtual}:{' '}
              <span className="font-semibold text-foreground">{formatCurrency(compAno.ytdAtual)}</span>
            </p>
            <p className="tabular-nums text-muted-foreground">
              {compAno.anoAtual - 1}:{' '}
              <span className="font-semibold text-foreground">{formatCurrency(compAno.ytdAnterior)}</span>
            </p>
            {compAno.variacaoPct != null ? (
              <p
                className={cn(
                  'text-xs font-medium',
                  compAno.variacaoPct >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-300',
                )}
              >
                {compAno.variacaoPct >= 0 ? '+' : ''}
                {compAno.variacaoPct}%
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Projeção próximo mês</CardDescription>
            <CardTitle className="text-lg capitalize">{proj.proxMesLabel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-2xl font-semibold tabular-nums">{formatCurrency(proj.valor)}</p>
            <p className="text-xs text-muted-foreground">
              Média diária últimos 60 dias ({formatCurrency(proj.mediaDiaria)}) × {proj.diasProxMes} dias.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tendências detectadas</CardTitle>
          <CardDescription>Heurísticas automáticas — validar no contexto da operação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">Poucos dados para gerar insights neste recorte.</p>
          ) : (
            insights.map((it, i) => (
              <div
                key={i}
                className="flex gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm leading-snug dark:bg-muted/10"
              >
                {it.tipo === 'up' ? (
                  <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                ) : it.tipo === 'down' ? (
                  <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
                ) : (
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                )}
                <span>{it.texto}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Receita mensal — ano atual vs anterior</CardTitle>
          <CardDescription>Serviços concluídos + produtos (comandas)</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <GraficoYoY data={yoy} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Crescimento por categoria (12 meses)</CardTitle>
          <CardDescription>Barras empilhadas: cortes, barbas, outros, produtos</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="mb-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-2.5 rounded-sm bg-emerald-500/85" /> Cortes
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-2.5 rounded-sm bg-amber-500/85" /> Barbas
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-2.5 rounded-sm bg-muted-foreground/50" /> Outros
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-2.5 rounded-sm bg-primary/85" /> Produtos
            </span>
          </div>
          <GraficoBarrasEmpilhadas data={stacks} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Previsão — próximos 30 dias</CardTitle>
          <CardDescription>Linha pontilhada: média diária recente aplicada ao horizonte</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <GraficoPrevisao serie={prev30} />
        </CardContent>
      </Card>
    </div>
  )
}
