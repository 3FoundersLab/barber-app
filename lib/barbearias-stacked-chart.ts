/**
 * Transformação de contagens mensais em percentuais para barras 100% empilhadas.
 * Reutilizável quando os dados vierem da API (mesmo formato de entrada).
 */

export type BarbeariasMensalAbsoluto = {
  month: string
  ativos: number
  inativos: number
}

export type BarbeariasMensalStackedPct = BarbeariasMensalAbsoluto & {
  /** % de barbearias com plano ativo (0–100) */
  pctAtivo: number
  /** % com plano inativo (0–100) */
  pctInativo: number
}

export function toBarbeariasStackedPercentRows(
  rows: readonly BarbeariasMensalAbsoluto[],
): BarbeariasMensalStackedPct[] {
  return rows.map((r) => {
    const total = r.ativos + r.inativos
    if (total === 0) {
      return { ...r, pctAtivo: 0, pctInativo: 0 }
    }
    return {
      ...r,
      pctAtivo: (r.ativos / total) * 100,
      pctInativo: (r.inativos / total) * 100,
    }
  })
}

export function formatPctBR(value: number, fractionDigits = 1): string {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}%`
}
