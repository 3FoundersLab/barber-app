/** Cache em memória para evitar refetch repetido ao mudar de aba ou foco. */
export const RELATORIOS_CACHE_MS = 2 * 60 * 1000

/** Atualização automática em segundo plano enquanto a página está aberta. */
export const RELATORIOS_AUTO_REFRESH_MS = 5 * 60 * 1000

export function relatoriosDashboardCacheKey(barbeariaId: string, startKey: string, endKey: string): string {
  return `${barbeariaId}|${startKey}|${endKey}`
}
