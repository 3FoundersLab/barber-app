import type { SupabaseClient } from '@supabase/supabase-js'
import type { Assinatura, Plano } from '@/types'

export type AssinaturaComPlano = Assinatura & { plano?: Plano | null }

export async function fetchLatestAssinaturaWithPlano(
  supabase: SupabaseClient,
  barbeariaId: string,
): Promise<AssinaturaComPlano | null> {
  const { data } = await supabase
    .from('assinaturas')
    .select('*, plano:planos(*)')
    .eq('barbearia_id', barbeariaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data as AssinaturaComPlano | null
}
