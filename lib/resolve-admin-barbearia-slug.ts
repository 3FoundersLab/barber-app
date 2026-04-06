import type { SupabaseClient } from '@supabase/supabase-js'
import { rpcGetMyBarbeariaSlug } from '@/lib/barbearia-rpc'

/**
 * Resolve o slug da barbearia do usuário via RPC (evita 42P17/500 em SELECT em barbearia_users).
 */
export async function resolveBarbeariaSlugForUser(
  supabase: SupabaseClient,
  _userId: string,
): Promise<{ slug: string } | null> {
  const slug = await rpcGetMyBarbeariaSlug(supabase)
  if (!slug) return null
  return { slug }
}
