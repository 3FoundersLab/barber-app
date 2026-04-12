'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { BarChart3, CalendarRange, Lightbulb, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { KPICard } from '@/components/ui/kpi-card'
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
  type DiaPrevisao,
} from '@/lib/relatorios-tendencias-analise'
import {
  relatoriosChartColors,
  relatoriosChartFont,
  relatoriosRechartsAnimationProps,
  tendenciasPrevisaoChartConfig,
  tendenciasStackChartConfig,
  tendenciasYoYChartConfig,
} from '@/lib/relatorios-chart-config'
import { cn } from '@/lib/utils'

function formatAxisCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(v)
}

function previsaoComTraco(serie: DiaPrevisao[]) {
  let lastHistI = -1
  for (let i = 0; i < serie.length; i++) {
    if (serie[i]!.historico != null) lastHistI = i
  }
  const temPrev = serie.some((s) => s.previsto != null)
  return serie.map((s, i) => {
    let tracoPrevisto: number | null = null
    if (s.previsto != null) tracoPrevisto = s.previsto
    else if (temPrev && i === lastHistI && lastHistI >= 0) tracoPrevisto = s.historico
    return {
      ...s,
      historico: s.historico ?? undefined,
      tracoPrevisto: tracoPrevisto ?? undefined,
    }
  })
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
  const prev30Chart = useMemo(() => previsaoComTraco(prev30), [prev30])

  const yoyData = useMemo(
    () =>
      yoy.map((d) => ({
        ...d,
        anoAtual: d.anoAtual ?? undefined,
        anoAnterior: d.anoAnterior,
      })),
    [yoy],
  )

  const chartFontClass = cn(
    'font-sans text-[12px] [&_.recharts-cartesian-axis-tick_text]:fill-[#737373] [&_.recharts-legend-item-text]:fill-[#737373]',
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tendências</h2>
        <p className="text-xs text-muted-foreground">
          Comparativos e projeções com base no histórico de até 36 meses (agendamentos + comandas fechadas).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <KPICard
          title="Este mês vs mês passado"
          value={formatCurrency(compMes.mesAtualParcial)}
          change={compMes.variacaoPct ?? undefined}
          changeLabel="vs mês anterior (receita total)"
          icon={CalendarRange}
          trend={
            compMes.variacaoPct == null ? 'neutral' : compMes.variacaoPct > 0 ? 'up' : compMes.variacaoPct < 0 ? 'down' : 'neutral'
          }
          color="amber"
        />
        <KPICard
          title={`YTD — Jan a ${format(ref, 'MMM', { locale: ptBR })}`}
          value={formatCurrency(compAno.ytdAtual)}
          change={compAno.variacaoPct ?? undefined}
          changeLabel={`vs ${compAno.anoAtual - 1} (mesmo período)`}
          icon={BarChart3}
          trend={
            compAno.variacaoPct == null
              ? 'neutral'
              : compAno.variacaoPct > 0
                ? 'up'
                : compAno.variacaoPct < 0
                  ? 'down'
                  : 'neutral'
          }
          color="blue"
        />
        <KPICard
          title={`Projeção ${proj.proxMesLabel}`}
          value={formatCurrency(proj.valor)}
          changeLabel={`Média diária (${formatCurrency(proj.mediaDiaria)}) × ${proj.diasProxMes} dias`}
          icon={TrendingUp}
          trend="neutral"
          color="green"
        />
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
        <CardContent className="overflow-x-auto pl-0">
          <ChartContainer
            config={tendenciasYoYChartConfig}
            className={cn(
              'aspect-auto h-[260px] min-h-[220px] w-full min-w-[320px] justify-stretch [&_.recharts-responsive-container]:!h-full',
              chartFontClass,
            )}
            style={{ fontFamily: relatoriosChartFont.family, fontSize: relatoriosChartFont.size }}
          >
            <LineChart data={yoyData} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid
                strokeDasharray="4 6"
                vertical={false}
                stroke={relatoriosChartColors.grid}
                strokeOpacity={0.9}
              />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tickFormatter={(v) => formatAxisCurrency(Number(v))}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="anoAnterior"
                stroke="var(--color-anoAnterior)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                name="anoAnterior"
                connectNulls
                {...relatoriosRechartsAnimationProps}
              />
              <Line
                type="monotone"
                dataKey="anoAtual"
                stroke="var(--color-anoAtual)"
                strokeWidth={2}
                dot={false}
                name="anoAtual"
                connectNulls
                {...relatoriosRechartsAnimationProps}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Crescimento por categoria (12 meses)</CardTitle>
          <CardDescription>Barras empilhadas: cortes, barbas, outros, produtos</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pl-0">
          <ChartContainer
            config={tendenciasStackChartConfig}
            className={cn(
              'aspect-auto h-[280px] min-h-[240px] w-full min-w-[320px] justify-stretch [&_.recharts-responsive-container]:!h-full',
              chartFontClass,
            )}
            style={{ fontFamily: relatoriosChartFont.family, fontSize: relatoriosChartFont.size }}
          >
            <BarChart data={stacks} margin={{ top: 28, right: 8, left: 4, bottom: 4 }} barCategoryGap="18%">
              <CartesianGrid
                strokeDasharray="4 6"
                vertical={false}
                stroke={relatoriosChartColors.grid}
                strokeOpacity={0.9}
              />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tickFormatter={(v) => formatAxisCurrency(Number(v))}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="cortes" stackId="a" fill="var(--color-cortes)" radius={[0, 0, 0, 0]} {...relatoriosRechartsAnimationProps} />
              <Bar dataKey="barbas" stackId="a" fill="var(--color-barbas)" {...relatoriosRechartsAnimationProps} />
              <Bar dataKey="outros" stackId="a" fill="var(--color-outros)" {...relatoriosRechartsAnimationProps} />
              <Bar
                dataKey="produtos"
                stackId="a"
                fill="var(--color-produtos)"
                radius={[4, 4, 0, 0]}
                {...relatoriosRechartsAnimationProps}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Previsão — próximos 30 dias</CardTitle>
          <CardDescription>Linha tracejada: média diária recente aplicada ao horizonte</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto pl-0">
          <ChartContainer
            config={tendenciasPrevisaoChartConfig}
            className={cn(
              'aspect-auto h-[240px] min-h-[200px] w-full min-w-[320px] justify-stretch [&_.recharts-responsive-container]:!h-full',
              chartFontClass,
            )}
            style={{ fontFamily: relatoriosChartFont.family, fontSize: relatoriosChartFont.size }}
          >
            <LineChart data={prev30Chart} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
              <CartesianGrid
                strokeDasharray="4 6"
                vertical={false}
                stroke={relatoriosChartColors.grid}
                strokeOpacity={0.9}
              />
              <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={44}
                tickFormatter={(v) => formatAxisCurrency(Number(v))}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="historico"
                stroke="var(--color-historico)"
                strokeWidth={2}
                dot={false}
                name="historico"
                connectNulls
                {...relatoriosRechartsAnimationProps}
              />
              <Line
                type="monotone"
                dataKey="tracoPrevisto"
                stroke="var(--color-previsto)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                name="previsto"
                connectNulls
                {...relatoriosRechartsAnimationProps}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
