'use client'

import type { CSSProperties } from 'react'
import { formatCurrency } from '@/lib/constants'
import type { RelatorioPerformancePdfData } from '@/lib/relatorio-performance-pdf-data'

const page: CSSProperties = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 12,
  lineHeight: 1.45,
  color: '#171717',
  backgroundColor: '#ffffff',
  width: 780,
  maxWidth: '100%',
  margin: 0,
  padding: '28px 32px 40px',
  boxSizing: 'border-box',
}

const breakBefore: CSSProperties = { pageBreakBefore: 'always', breakBefore: 'page' }

const h1: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
}

const h2: CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  margin: '0 0 10px',
  paddingBottom: 6,
  borderBottom: '2px solid #171717',
}

const h3: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  margin: '14px 0 6px',
  color: '#404040',
}

const muted: CSSProperties = { color: '#525252', fontSize: 11 }

const table: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 11,
  marginTop: 8,
}

const thtd: CSSProperties = {
  border: '1px solid #d4d4d4',
  padding: '6px 8px',
  textAlign: 'left' as const,
}

function fmtVar(
  comparar: boolean,
  atual: number,
  ant: number,
  fn: (a: number, b: number) => number | null,
  texto: string,
): string {
  if (!comparar) return '—'
  const v = fn(atual, ant)
  if (v == null || Number.isNaN(v)) return '—'
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}% (${texto})`
}

function MiniBars({
  rows,
  formatValue,
}: {
  rows: { label: string; total: number }[]
  formatValue: (n: number) => string
}) {
  const slice = rows.slice(-14)
  const max = Math.max(1, ...slice.map((r) => r.total))
  const barMaxPx = 96
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
        {slice.map((r) => (
          <div key={r.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              title={`${r.label}: ${formatValue(r.total)}`}
              style={{
                width: '100%',
                minHeight: 4,
                height: `${Math.max(4, Math.round((r.total / max) * barMaxPx))}px`,
                backgroundColor: '#d97706',
                borderRadius: 2,
              }}
            />
            <span style={{ fontSize: 8, color: '#737373', writingMode: 'vertical-rl' as const, transform: 'rotate(180deg)' }}>
              {r.label.slice(0, 5)}
            </span>
          </div>
        ))}
      </div>
      <p style={{ ...muted, marginTop: 6 }}>Barras proporcionais ao faturamento diário (serviços + produtos).</p>
    </div>
  )
}

export function RelatorioPerformancePdfDocument({ data }: { data: RelatorioPerformancePdfData | null }) {
  if (!data) {
    return (
      <div
        id="relatorio-performance-pdf-root"
        style={{ ...page, position: 'fixed', left: -12000, top: 0, visibility: 'hidden', pointerEvents: 'none' }}
        aria-hidden
      />
    )
  }

  const d = data
  const v = (at: keyof RelatorioPerformancePdfData['resAtual'], ant: keyof RelatorioPerformancePdfData['resAnt']) =>
    fmtVar(d.compararComAnterior, d.resAtual[at] as number, d.resAnt[ant] as number, d.variacaoPct, d.textoRodapeKpi)

  return (
    <div
      id="relatorio-performance-pdf-root"
      style={{
        ...page,
        position: 'fixed',
        left: -12000,
        top: 0,
        zIndex: -1,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
      aria-hidden
    >
      {/* Capa */}
      <section style={{ minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '2px solid #171717', padding: 32, marginBottom: 28 }}>
        {d.barbeariaLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.barbeariaLogoUrl} alt="" style={{ maxHeight: 72, maxWidth: 220, objectFit: 'contain', marginBottom: 16 }} />
        ) : (
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, letterSpacing: '0.2em', color: '#737373' }}>LOGO</div>
        )}
        <h1 style={{ ...h1, fontSize: 18 }}>Relatório de performance</h1>
        <p style={{ fontSize: 17, fontWeight: 600, margin: '4px 0 20px' }}>{d.barbeariaNome}</p>
        <p style={{ ...muted, margin: '4px 0' }}>
          Período: {d.periodoInicioFmt} a {d.periodoFimFmt}
        </p>
        <p style={{ ...muted, margin: '4px 0' }}>Gerado em: {d.geradoEmFmt}</p>
        <p style={{ ...muted, margin: '4px 0' }}>Por: {d.geradoPorLinha}</p>
      </section>

      {/* Resumo executivo */}
      <section style={{ marginTop: 20 }}>
        <h2 style={h2}>Resumo executivo</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['Faturamento (serviços concluídos)', formatCurrency(d.resAtual.fatConcluido), v('fatConcluido', 'fatConcluido')],
            ['Atendimentos (agenda)', String(d.resAtual.total), v('total', 'total')],
            ['Realização', `${d.resAtual.realizacao.toFixed(0)}%`, v('realizacao', 'realizacao')],
            ['Ticket médio', formatCurrency(d.resAtual.ticketMedio), v('ticketMedio', 'ticketMedio')],
            [
              'Novos clientes',
              String(d.clientesNovos),
              fmtVar(d.compararComAnterior, d.clientesNovos, d.clientesNovosAnt, d.variacaoPct, d.textoRodapeKpi),
            ],
            ['Base de clientes (cadastro)', String(d.totalClientes), '—'],
          ].map(([t, val, ch]) => (
            <div key={String(t)} style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 12, backgroundColor: '#fafafa' }}>
              <p style={{ ...muted, margin: 0 }}>{t}</p>
              <p style={{ fontSize: 18, fontWeight: 700, margin: '6px 0 2px' }}>{val}</p>
              <p style={{ fontSize: 10, color: '#737373', margin: 0 }}>Var.: {ch}</p>
            </div>
          ))}
        </div>

        <h3 style={h3}>Destaques do período</h3>
        <ul style={{ margin: 0, paddingLeft: 18, ...muted }}>
          <li>Melhor dia (faturamento total): {d.melhorDia ? `${d.melhorDia.label} — ${formatCurrency(d.melhorDia.total)}` : '—'}</li>
          <li>Melhor barbeiro (faturamento): {d.melhorBarbeiro ?? '—'}</li>
          <li>Horário de maior volume de agendamentos: {d.picoHorarioLabel}</li>
        </ul>

        <h3 style={h3}>Alertas importantes</h3>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {d.alertas.map((a, i) => (
            <li key={i} style={{ marginBottom: 4, fontSize: 11 }}>
              {a}
            </li>
          ))}
        </ul>
      </section>

      {/* Análise financeira */}
      <section style={{ ...breakBefore, marginTop: 24 }}>
        <h2 style={h2}>Análise financeira</h2>
        <h3 style={h3}>Faturamento diário (amostra recente)</h3>
        <MiniBars rows={d.faturamentoDiario} formatValue={formatCurrency} />
        <h3 style={h3}>Mix de receita — serviços (participação no faturamento de serviços)</h3>
        <table style={table}>
          <thead>
            <tr>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>Serviço</th>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>Faturamento</th>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>% do total serviços</th>
            </tr>
          </thead>
          <tbody>
            {d.mixServicos.map((s) => (
              <tr key={s.nome}>
                <td style={thtd}>{s.nome}</td>
                <td style={thtd}>{formatCurrency(s.fat)}</td>
                <td style={thtd}>{s.pctDoTotalServicos.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 style={h3}>Comparativo com período anterior</h3>
        <p style={{ ...muted, marginTop: 4 }}>
          {d.compararComAnterior
            ? `Os KPIs acima incluem variação percentual vs período anterior (${d.textoRodapeKpi}).`
            : 'A opção “Comparar com período anterior” estava desativada — variações não exibidas.'}
        </p>
      </section>

      {/* Performance operacional */}
      <section style={{ ...breakBefore, marginTop: 24 }}>
        <h2 style={h2}>Performance operacional</h2>
        <h3 style={h3}>Ocupação e horários de pico</h3>
        <p style={{ ...muted, marginTop: 4 }}>
          Realização: {d.resAtual.realizacao.toFixed(1)}% · Agendados/em curso: {d.resAtual.agendadosOuEm} · Pico: {d.picoHorarioLabel}
        </p>
        <h3 style={h3}>Distribuição por status</h3>
        <table style={table}>
          <thead>
            <tr>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>Status</th>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>Qtd</th>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {d.statusDistribuicao.map((s) => (
              <tr key={s.k}>
                <td style={thtd}>{s.label}</td>
                <td style={thtd}>{s.n}</td>
                <td style={thtd}>{s.pct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 style={h3}>Ranking de barbeiros (faturamento total)</h3>
        <table style={table}>
          <thead>
            <tr>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>#</th>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>Nome</th>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>Faturamento</th>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>Concluídos</th>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>Ticket médio</th>
            </tr>
          </thead>
          <tbody>
            {d.rankingBarbeiros.map((r, i) => (
              <tr key={r.nome}>
                <td style={thtd}>{i + 1}</td>
                <td style={thtd}>{r.nome}</td>
                <td style={thtd}>{formatCurrency(r.faturamentoTotal)}</td>
                <td style={thtd}>{r.concluidos}</td>
                <td style={thtd}>{formatCurrency(r.ticketMedio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 style={h3}>Taxas de comparecimento</h3>
        <p style={{ fontSize: 11, marginTop: 4 }}>{d.retencaoLinha}</p>
      </section>

      {/* Clientes */}
      <section style={{ ...breakBefore, marginTop: 24 }}>
        <h2 style={h2}>Análise de clientes</h2>
        <h3 style={h3}>Segmentação RFV (visão simplificada)</h3>
        <table style={table}>
          <thead>
            <tr>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>Segmento</th>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>Clientes</th>
            </tr>
          </thead>
          <tbody>
            {d.rfvResumo.map((r) => (
              <tr key={r.segmento}>
                <td style={thtd}>{r.segmento}</td>
                <td style={thtd}>{r.quantidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 style={h3}>Aquisição e retenção</h3>
        <p style={{ fontSize: 11 }}>{d.aquisicaoLinha}</p>
        <p style={{ fontSize: 11, marginTop: 6 }}>{d.retencaoLinha}</p>
      </section>

      {/* Produtos */}
      <section style={{ ...breakBefore, marginTop: 24 }}>
        <h2 style={h2}>Produtos e estoque</h2>
        <h3 style={h3}>Top produtos (quantidade em comandas fechadas)</h3>
        <table style={table}>
          <thead>
            <tr>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>#</th>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>Produto</th>
              <th style={{ ...thtd, backgroundColor: '#f5f5f5' }}>Qtd</th>
            </tr>
          </thead>
          <tbody>
            {d.topProdutos.map((p, i) => (
              <tr key={p.nome}>
                <td style={thtd}>{i + 1}</td>
                <td style={thtd}>{p.nome}</td>
                <td style={thtd}>{p.qtd}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 style={h3}>Alertas de estoque</h3>
        <p style={{ fontSize: 11 }}>
          SKUs cadastrados: {d.estoqueAlerta.total} · Abaixo do mínimo: {d.estoqueAlerta.baixo} · Esgotados:{' '}
          {d.estoqueAlerta.esgotado}
        </p>
      </section>
    </div>
  )
}
