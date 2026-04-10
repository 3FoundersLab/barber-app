import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { Assinatura, Plano } from '@/types'

export type AssinaturaComPlano = Assinatura & { plano?: Plano | null }

export type FetchLatestAssinaturaWithPlanoResult = {
  assinatura: AssinaturaComPlano | null
  error: PostgrestError | null
}

export async function fetchLatestAssinaturaWithPlano(
  supabase: SupabaseClient,
  barbeariaId: string,
): Promise<FetchLatestAssinaturaWithPlanoResult> {
  const { data, error } = await supabase
    .from('assinaturas')
    .select('*, plano:planos(*)')
    .eq('barbearia_id', barbeariaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { assinatura: null, error }
  }

  return { assinatura: data as AssinaturaComPlano | null, error: null }
}
