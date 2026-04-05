/**
 * Métricas e derivações para série mensal de MRR (integração API: mesmo formato de entrada).
 */

/** Chaves curtas usadas no mock/API; exibe nome completo na UI. */
const MRR_MONTH_PT: Record<string, string> = {
  Jan: 'Janeiro',
  Fev: 'Fevereiro',
  Mar: 'Março',
  Abr: 'Abril',
  Mai: 'Maio',
  Jun: 'Junho',
  Jul: 'Julho',
  Ago: 'Agosto',
  Set: 'Setembro',
  Out: 'Outubro',
  Nov: 'Novembro',
  Dez: 'Dezembro',
}

export function formatMrrMonthDisplay(month: string): string {
  return MRR_MONTH_PT[month] ?? month
}

export type MrrMensalPonto = {
  month: string
  value: number
}

export type MrrMensalComVariacao = MrrMensalPonto & {
  /** Variação % vs mês anterior; null no primeiro mês */
  pctVsAnterior: number | null
}

export function buildMrrChartRows(series: readonly MrrMensalPonto[]): MrrMensalComVariacao[] {
  return series.map((row, i) => {
    const prev = i > 0 ? series[i - 1].value : null
    const pctVsAnterior =
      prev != null && prev !== 0 ? ((row.value - prev) / prev) * 100 : null
    return { ...row, pctVsAnterior }
  })
}

export type MrrResumoExecutivo = {
  totalAno: number
  mediaMensal: number
  maiorMes: MrrMensalPonto
  menorMes: MrrMensalPonto
  /** Crescimento % de Jan → último mês */
  crescimentoJanUltimoPct: number | null
  ultimoMes: MrrMensalPonto
}

export function computeMrrResumoExecutivo(series: readonly MrrMensalPonto[]): MrrResumoExecutivo {
  if (series.length === 0) {
    return {
      totalAno: 0,
      mediaMensal: 0,
      maiorMes: { month: '—', value: 0 },
      menorMes: { month: '—', value: 0 },
      crescimentoJanUltimoPct: null,
      ultimoMes: { month: '—', value: 0 },
    }
  }

  let maior = series[0]
  let menor = series[0]
  let total = 0
  for (const r of series) {
    total += r.value
    if (r.value > maior.value) maior = r
    if (r.value < menor.value) menor = r
  }

  const primeiro = series[0]
  const ultimo = series[series.length - 1]
  const crescimentoJanUltimoPct =
    primeiro.value !== 0 ? ((ultimo.value - primeiro.value) / primeiro.value) * 100 : null

  return {
    totalAno: total,
    mediaMensal: total / series.length,
    maiorMes: maior,
    menorMes: menor,
    crescimentoJanUltimoPct,
    ultimoMes: ultimo,
  }
}

export function formatPctVariacao(pct: number, fractionDigits = 1): string {
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}%`
}
