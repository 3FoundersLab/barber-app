import type { SupabaseClient } from '@supabase/supabase-js'
import { mesesPorPeriodicidade, parsePlanoPeriodicidade, precoTotalNoPeriodo } from '@/lib/plano-periodicidade'

type RelOne<T> = T | T[] | null | undefined

function pickRel<T>(x: RelOne<T>): T | undefined {
  if (x == null) return undefined
  return Array.isArray(x) ? x[0] : x
}

/**
 * Valor mensal recorrente de referência por assinatura: (preço do período) / meses do período.
 * Com planos modelados como `preco_mensal` × meses, equivale a `preco_mensal` do plano.
 */
export function mrrMensalPorAssinatura(precoMensalPlano: number, periodicidade: string | null | undefined): number {
  const p = parsePlanoPeriodicidade(periodicidade)
  const meses = mesesPorPeriodicidade(p)
  if (meses <= 0) return 0
  const totalPeriodo = precoTotalNoPeriodo(Number(precoMensalPlano) || 0, p)
  return totalPeriodo / meses
}

export function sumMrrFromAssinaturaRows(
  rows: Array<{
    periodicidade?: string | null
    plano?: RelOne<{ preco_mensal: number | string | null }>
  }>,
): number {
  let sum = 0
  for (const row of rows) {
    const plano = pickRel(row.plano)
    const pm = Number(plano?.preco_mensal)
    if (!Number.isFinite(pm)) continue
    sum += mrrMensalPorAssinatura(pm, row.periodicidade)
  }
  return sum
}

/**
 * MRR atual (soma do valor mensal de referência das assinaturas ativas).
 * Usa RPC `super_mrr_atual` no banco; se não existir ou falhar, calcula no cliente.
 */
export async function fetchSuperMrrAtual(supabase: SupabaseClient): Promise<{
  mrr: number
  error: string | null
}> {
  const rpc = await supabase.rpc('super_mrr_atual')
  if (!rpc.error && rpc.data != null && rpc.data !== '') {
    const n = typeof rpc.data === 'string' ? Number(rpc.data) : Number(rpc.data)
    if (Number.isFinite(n)) {
      return { mrr: n, error: null }
    }
  }

  const { data: rows, error: qErr } = await supabase
    .from('assinaturas')
    .select('periodicidade, plano:planos(preco_mensal)')
    .eq('status', 'ativa')

  if (qErr) {
    return {
      mrr: 0,
      error: rpc.error?.message ?? qErr.message ?? 'Não foi possível calcular o MRR',
    }
  }

  return { mrr: sumMrrFromAssinaturaRows(rows ?? []), error: null }
}
