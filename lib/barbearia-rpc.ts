import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * RPCs SECURITY DEFINER no banco (scripts/023_barbearia_users_rls_fix_recursion.sql).
 * Evitam 42P17 / 500 em SELECT direto em barbearia_users com RLS encadeado ao PostgREST.
 */

export async function rpcGetMyBarbeariaSlug(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_my_barbearia_slug')
  if (error || data == null) return null
  return typeof data === 'string' && data.length > 0 ? data : null
}

export async function rpcGetMyBarbeariaLink(
  supabase: SupabaseClient,
): Promise<{ barbearia_id: string; slug: string } | null> {
  const { data, error } = await supabase.rpc('get_my_barbearia_link')
  if (error || data == null) return null
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') return null
  const barbearia_id = (row as { barbearia_id?: string }).barbearia_id
  const slug = (row as { slug?: string }).slug
  if (!barbearia_id || !slug) return null
  return { barbearia_id, slug }
}

export async function rpcUserIsMemberOfBarbearia(
  supabase: SupabaseClient,
  barbeariaId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('user_is_member_of_barbearia', {
    p_barbearia_id: barbeariaId,
  })
  if (error) return false
  return data === true
}
