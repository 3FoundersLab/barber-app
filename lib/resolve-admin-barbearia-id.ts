import type { SupabaseClient } from '@supabase/supabase-js'

/** Contexto da barbearia ativa no painel admin quando o usuário é super_admin (múltiplos vínculos). */
export const SUPER_ADMIN_BARBEARIA_STORAGE_KEY = 'super_admin_barbearia_id'

export type ResolveAdminBarbeariaOptions = {
  /** Slug da URL `/b/[slug]/...` — tem prioridade sobre o contexto em localStorage. */
  slug?: string
}

/**
 * Resolve o `barbearia_id` do painel admin.
 * Com `slug` na URL, valida vínculo do usuário à barbearia desse slug.
 * Super admin pode ter vários vínculos; sem slug na URL usa localStorage após "Acessar barbearia"
 * em /barbearias; senão o vínculo mais recente.
 */
export async function resolveAdminBarbeariaId(
  supabase: SupabaseClient,
  userId: string,
  options?: ResolveAdminBarbeariaOptions,
): Promise<string | null> {
  const slug = options?.slug?.trim()
  if (slug) {
    const { data: barbearia } = await supabase
      .from('barbearias')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
    if (!barbearia?.id) return null
    const { data: link } = await supabase
      .from('barbearia_users')
      .select('barbearia_id')
      .eq('user_id', userId)
      .eq('barbearia_id', barbearia.id)
      .maybeSingle()
    if (link?.barbearia_id) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SUPER_ADMIN_BARBEARIA_STORAGE_KEY, barbearia.id)
      }
      return link.barbearia_id
    }
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  const role = profile?.role

  if (role === 'super_admin' && typeof window !== 'undefined') {
    const preferred = window.localStorage.getItem(SUPER_ADMIN_BARBEARIA_STORAGE_KEY)?.trim()
    if (preferred) {
      const { data: link } = await supabase
        .from('barbearia_users')
        .select('barbearia_id')
        .eq('user_id', userId)
        .eq('barbearia_id', preferred)
        .maybeSingle()
      if (link?.barbearia_id) return link.barbearia_id
    }
  }

  const { data: rows, error } = await supabase
    .from('barbearia_users')
    .select('barbearia_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !rows?.length) return null
  return rows[0].barbearia_id
}
