'use client'

import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Moon, Sparkles, Star, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency } from '@/lib/constants'
import {
  DIAS_INATIVO,
  DIAS_RISCO,
  VIP_VISITAS_MES,
  type AgHistoricoCliente,
  type ClienteCadastroAnalise,
  type SegmentoRfv,
  clientesEmRisco,
  clientesInativos,
  clientesPrimeiraVez,
  cohortRetencao,
  contarNovosEsteMes,
  contarVipMesAtual,
  distribuicaoFaixaEtaria,
  distribuicaoOrigem,
  ltvMedioProjetado,
  preferenciasAgregadas,
  segmentarRfvComNomes,
  timelineNovosPorMes,
  topPercentilValor,
  ultimaVisitaConcluidaPorCliente,
} from '@/lib/relatorios-clientes-analise'
const RFV_LABEL: Record<SegmentoRfv, string> = {
  campeoes: 'Campeões (RFV alto)',
  fieis: 'Fiéis',
  em_risco: 'Em risco',
  novos: 'Novos / primeira fase',
  ocasionais: 'Ocasionais',
  sem_atividade: 'Sem atividade concluída',
}

const PIE_COLORS = [
  'hsl(220 70% 50%)',
  'hsl(152 55% 42%)',
  'hsl(43 90% 48%)',
  'hsl(280 50% 55%)',
  'hsl(12 75% 52%)',
  'hsl(200 60% 45%)',
  'hsl(30 80% 50%)',
]

function KpiMini({
  icon: Icon,
  titulo,
  valor,
  subtitulo,
}: {
  icon: LucideIcon
  titulo: string
  valor: string | number
  subtitulo?: string
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-start gap-2 space-y-0 pb-2">
        <div className="rounded-md bg-primary/10 p-1.5 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <CardDescription className="text-[11px] leading-tight">{titulo}</CardDescription>
          <CardTitle className="text-xl tabular-nums tracking-tight">{valor}</CardTitle>
        </div>
      </CardHeader>
      {subtitulo ? (
        <CardContent className="pt-0 text-[10px] leading-snug text-muted-foreground">{subtitulo}</CardContent>
      ) : null}
    </Card>
  )
}

function TimelineNovosSvg(data: ReturnType<typeof timelineNovosPorMes>) {
  const max = Math.max(1, ...data.map((d) => d.n))
  const w = 360
  const h = 100
  const pad = 24
  const bw = (w - pad * 2) / Math.max(1, data.length)
  return (
    <svg width={w} height={h} className="mx-auto max-w-full" aria-label="Novos clientes por mês">
      {data.map((d, i) => {
        const bh = ((d.n / max) * (h - pad - 16)).toFixed(1)
        const x = pad + i * bw + bw * 0.2
        const width = bw * 0.6
        return (
          <g key={d.key}>
            <rect
              x={x}
              y={Number(h) - Number(pad) - Number(bh)}
              width={width}
              height={bh}
              rx={3}
              className="fill-primary/80"
            >
              <title>
                {d.label}: {d.n}
              </title>
            </rect>
            <text
              x={x + width / 2}
              y={h - 4}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function PizzaOrigem({
  slices,
}: {
  slices: ReturnType<typeof distribuicaoOrigem>
}) {
  const [active, setActive] = useState<number | null>(null)
  const cx = 80
  const cy = 80
  const r = 56
  const inner = 28
  let angle = -Math.PI / 2
  const total = slices.reduce((s, x) => s + x.n, 0) || 1
  const paths = slices.map((sl, i) => {
    const frac = sl.n / total
    const a0 = angle
    const a1 = angle + frac * 2 * Math.PI
    angle = a1
    const large = frac > 0.5 ? 1 : 0
    const x0 = cx + r * Math.cos(a0)
    const y0 = cy + r * Math.sin(a0)
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy + r * Math.sin(a1)
    const xi0 = cx + inner * Math.cos(a1)
    const yi0 = cy + inner * Math.sin(a1)
    const xi1 = cx + inner * Math.cos(a0)
    const yi1 = cy + inner * Math.sin(a0)
    const d = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi0} ${yi0} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z`
    const dim = active !== null && active !== i
    return (
      <path
        key={sl.key}
        d={d}
        fill={PIE_COLORS[i % PIE_COLORS.length]}
        opacity={dim ? 0.35 : 1}
        className="cursor-pointer stroke-background transition-opacity"
        strokeWidth={1}
        onClick={() => setActive((v) => (v === i ? null : i))}
      >
        <title>
          {sl.label}: {sl.n} ({sl.pct.toFixed(0)}%)
        </title>
      </path>
    )
  })
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-8">
      <svg width={160} height={160} viewBox="0 0 160 160" className="shrink-0">
        {paths}
      </svg>
      <ul className="max-w-xs space-y-1.5 text-xs">
        {slices.map((sl, i) => (
          <li key={sl.key} className="flex justify-between gap-2 tabular-nums">
            <span className="flex items-center gap-2">
              <span
                className="inline-block size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              {sl.label}
            </span>
            <span className="text-muted-foreground">
              {sl.n} ({sl.pct.toFixed(0)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BarrasIdade(data: ReturnType<typeof distribuicaoFaixaEtaria>) {
  const max = Math.max(1, ...data.map((d) => d.n))
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.id} className="grid grid-cols-[7.5rem_1fr] items-center gap-2 text-xs">
          <span className="text-muted-foreground">{d.label}</span>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full bg-primary/75"
                style={{ width: `${(d.n / max) * 100}%` }}
              />
            </div>
            <span className="w-8 tabular-nums text-muted-foreground">{d.n}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function ListaNomes({ items, vazio }: { items: { nome: string }[]; vazio: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{vazio}</p>
  return (
    <ul className="space-y-1 text-sm">
      {items.slice(0, 12).map((x, i) => (
        <li key={`${x.nome}-${i}`} className="truncate text-muted-foreground">
          <span className="text-foreground/80">{i + 1}.</span> {x.nome}
        </li>
      ))}
      {items.length > 12 ? <li className="text-xs text-muted-foreground">+{items.length - 12} outros</li> : null}
    </ul>
  )
}

export function RelatoriosClientesPainel({
  totalClientes,
  agHistorico,
  clientesCadastro,
  notaHistorico,
}: {
  totalClientes: number
  agHistorico: AgHistoricoCliente[]
  clientesCadastro: ClienteCadastroAnalise[]
  /** Texto curto quando o histórico está limitado (ex.: últimos 36 meses). */
  notaHistorico?: string
}) {
  const [ref] = useState(() => new Date())
  const nomePorId = useMemo(() => new Map(clientesCadastro.map((c) => [c.id, c.nome])), [clientesCadastro])

  const vip = useMemo(() => contarVipMesAtual(agHistorico, ref), [agHistorico, ref])
  const novosMes = useMemo(() => contarNovosEsteMes(clientesCadastro, ref), [clientesCadastro, ref])
  const ultima = useMemo(() => ultimaVisitaConcluidaPorCliente(agHistorico), [agHistorico])
  const inativos = useMemo(
    () => clientesInativos(ultima, nomePorId, ref, DIAS_INATIVO),
    [ultima, nomePorId, ref],
  )
  const rfv = useMemo(() => segmentarRfvComNomes(agHistorico, clientesCadastro, ref), [agHistorico, clientesCadastro, ref])
  const topVipValor = useMemo(() => topPercentilValor(agHistorico, clientesCadastro, 20), [agHistorico, clientesCadastro])
  const emRisco45 = useMemo(() => clientesEmRisco(ultima, nomePorId, ref, DIAS_RISCO), [ultima, nomePorId, ref])
  const novosPrimeira = useMemo(
    () => clientesPrimeiraVez(agHistorico, clientesCadastro).map((x) => ({ nome: x.nome })),
    [agHistorico, clientesCadastro],
  )
  const ocasionaisLista = useMemo(() => rfv.ocasionais.map((x) => ({ nome: x.nome })), [rfv.ocasionais])
  const cohort = useMemo(() => cohortRetencao(agHistorico, 6, 12, ref), [agHistorico, ref])
  const ltv = useMemo(() => ltvMedioProjetado(agHistorico), [agHistorico])
  const prefs = useMemo(() => preferenciasAgregadas(agHistorico, 90, ref), [agHistorico, ref])
  const timeline = useMemo(() => timelineNovosPorMes(clientesCadastro, 12, ref), [clientesCadastro, ref])
  const origem = useMemo(() => distribuicaoOrigem(clientesCadastro), [clientesCadastro])
  const idades = useMemo(() => distribuicaoFaixaEtaria(clientesCadastro, ref), [clientesCadastro, ref])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Clientes</h2>
        <p className="text-xs text-muted-foreground">
          Análise de público com base no cadastro e em agendamentos concluídos. {notaHistorico}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiMini
          icon={Users}
          titulo="Total de clientes"
          valor={totalClientes}
          subtitulo="Cadastro na unidade"
        />
        <KpiMini
          icon={Star}
          titulo="VIP (visitas no mês)"
          valor={vip.count}
          subtitulo={`${VIP_VISITAS_MES}+ concluídos no mês atual`}
        />
        <KpiMini
          icon={Sparkles}
          titulo="Novos este mês"
          valor={novosMes}
          subtitulo="Primeiro cadastro no mês civil"
        />
        <KpiMini
          icon={Moon}
          titulo={`Inativos (${DIAS_INATIVO}+ dias)`}
          valor={inativos.count}
          subtitulo="Último concluído há mais de 60 dias"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Segmentação RFV (automática)</CardTitle>
            <CardDescription>Recência, frequência (365 dias) e valor aproximados</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(RFV_LABEL) as SegmentoRfv[]).map((k) => (
              <div key={k} className="rounded-lg border border-border/60 p-3">
                <p className="text-xs font-medium text-foreground">{RFV_LABEL[k]}</p>
                <p className="text-lg font-semibold tabular-nums">{rfv[k].length}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Lifetime value (LTV)</CardTitle>
            <CardDescription>Projeção simples a partir do ticket médio histórico</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Ticket médio por cliente (concluídos no histórico carregado):{' '}
              <span className="font-semibold tabular-nums">{formatCurrency(ltv.ticketHistorico)}</span>
            </p>
            <p>
              Projeção anual linear:{' '}
              <span className="font-semibold tabular-nums">{formatCurrency(ltv.projAnual)}</span>
            </p>
            <p className="text-xs text-muted-foreground leading-snug">{ltv.detalhe}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">VIP por valor (top 20%)</CardTitle>
            <CardDescription>Receita total em concluídos no período analisado</CardDescription>
          </CardHeader>
          <CardContent>
            <ListaNomes items={topVipValor.map((x) => ({ nome: `${x.nome} · ${formatCurrency(x.valor)}` }))} vazio="Sem dados." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Em risco ({DIAS_RISCO}+ dias)</CardTitle>
            <CardDescription>Sem visita concluída recente</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[min(220px,30vh)] pr-2">
              <ul className="space-y-1 text-sm">
                {emRisco45.length === 0 ? (
                  <li className="text-muted-foreground">Nenhum cliente nesta faixa.</li>
                ) : (
                  emRisco45.slice(0, 20).map((x) => (
                    <li key={x.id} className="flex justify-between gap-2">
                      <span className="min-w-0 truncate">{x.nome}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{x.dias} d</span>
                    </li>
                  ))
                )}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Novos / ocasionais</CardTitle>
            <CardDescription>Primeira visita única no histórico · perfil ocasional</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Primeira vez (1 concluído)</p>
              <ListaNomes items={novosPrimeira} vazio="—" />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Ocasionais (RFV)</p>
              <ListaNomes items={ocasionaisLista} vazio="—" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cohort — retenção por mês da 1ª visita</CardTitle>
          <CardDescription>
            % de clientes da coorte com ao menos um concluído em cada mês (M+0 = mês da primeira conclusão)
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {cohort.length === 0 ? (
            <p className="text-sm text-muted-foreground">Dados insuficientes para coortes.</p>
          ) : (
            <table className="w-full min-w-[520px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/60 text-left text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">Coorte</th>
                  <th className="py-2 pr-2 font-medium">n</th>
                  {[0, 1, 2, 3, 4, 5, 6].map((k) => (
                    <th key={k} className="py-2 pr-1 font-medium tabular-nums">
                      M+{k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohort.map((row) => (
                  <tr key={row.cohortMes} className="border-b border-border/40">
                    <td className="py-1.5 pr-2 font-medium capitalize">{row.cohortLabel}</td>
                    <td className="py-1.5 pr-2 tabular-nums text-muted-foreground">{row.tamanho}</td>
                    {row.retencao.map((v, i) => (
                      <td key={i} className="py-1.5 pr-1 tabular-nums text-muted-foreground">
                        {v == null ? '—' : `${v}%`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Preferências (últimos 90 dias)</CardTitle>
          <CardDescription>Serviços, horários e profissionais mais frequentes em concluídos</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Serviços</p>
            <ul className="space-y-1 text-sm">
              {prefs.servicos.map(([nome, v]) => (
                <li key={nome} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate">{nome}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{v}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Horários</p>
            <ul className="space-y-1 text-sm">
              {prefs.horarios.map((h) => (
                <li key={h.label} className="flex justify-between gap-2">
                  <span>{h.label}</span>
                  <span className="tabular-nums text-muted-foreground">{h.v}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Profissionais</p>
            <ul className="space-y-1 text-sm">
              {prefs.barbeiros.map(([nome, v]) => (
                <li key={nome} className="flex justify-between gap-2">
                  <span className="min-w-0 truncate">{nome}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Aquisição — novos cadastros</CardTitle>
            <CardDescription>Timeline por mês (últimos 12 meses)</CardDescription>
          </CardHeader>
          <CardContent>
            <TimelineNovosSvg data={timeline} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Canal de origem</CardTitle>
            <CardDescription>
              Distribuição no cadastro — preencha em Clientes (origem) para refletir aqui
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PizzaOrigem slices={origem} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Faixa etária</CardTitle>
          <CardDescription>Calculada a partir da data de nascimento, quando informada</CardDescription>
        </CardHeader>
        <CardContent>
          <BarrasIdade data={idades} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Inativos (amostra)</CardTitle>
          <CardDescription>Último atendimento concluído há mais de {DIAS_INATIVO} dias</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[min(200px,28vh)] pr-2">
            <ul className="space-y-1 text-sm">
              {inativos.amostra.length === 0 ? (
                <li className="text-muted-foreground">Nenhum cliente nesta condição.</li>
              ) : (
                inativos.amostra.map((x) => (
                  <li key={x.id} className="flex justify-between gap-2">
                    <span className="min-w-0 truncate">{x.nome}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{x.diasDesdeUltima} d</span>
                  </li>
                ))
              )}
            </ul>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
